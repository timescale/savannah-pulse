import 'dotenv/config';
import express from 'express';
import { marked } from 'marked';
import path from 'node:path';

import {
  getBrandSentiment,
  getBrandSentimentByResponseId,
  insertBrandSentiment,
} from './repositories/brand-sentiment-repository';
import {
  getCompetitors,
  insertCompetitor,
} from './repositories/competitors-repository';
import {
  getHostnameCount,
  getLinksByResponseId,
  getRecentLinks,
  insertLink,
} from './repositories/links-repository';
import {
  deletePrompt,
  getPromptById,
  getPrompts,
  insertPrompt,
} from './repositories/prompts-repository';
import {
  getResponseById,
  getResponses,
  insertResponse,
} from './repositories/responses-repository';
import { generateBrandSentiment } from './services/brand-sentiment';
import { generatePrompts } from './services/prompt-generator';
import { getResponse, RESPONSE_MODELS } from './services/response';

const app = express();
const port = process.env['PORT'] || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make markdown renderer available in all EJS templates
app.locals['markdown'] = (text: string) => {
  return marked(text, { async: false, gfm: true });
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Bootstrap CSS and JS from node_modules
app.use(
  '/bootstrap/css',
  express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')),
);
app.use(
  '/bootstrap/js',
  express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')),
);
app.use(
  '/bootstrap/icons',
  express.static(path.join(__dirname, 'node_modules/bootstrap-icons/font')),
);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/competitors', async (req, res) => {
  const competitors = await getCompetitors();
  res.render('competitors', { competitors });
});

app.get('/competitors/add', (req, res) => {
  res.render('competitors/add');
});

app.post('/competitors/add', async (req, res) => {
  const { name, url } = req.body;
  if (!name || !url) {
    res.status(400).send('Name and URL are required');
    return;
  }
  await insertCompetitor({ name, url });
  res.redirect('/competitors');
});

app.get('/prompts', async (req, res) => {
  const prompts = await getPrompts();
  res.render('prompts', { models: RESPONSE_MODELS, prompts });
});

app.get('/prompts/add', (req, res) => {
  res.render('prompts/add');
});

app.post('/prompts/add', async (req, res) => {
  const { prompt, prompts } = req.body;

  if (
    !prompt &&
    (!prompts || !Array.isArray(prompts) || prompts.length === 0)
  ) {
    res.status(400).send('Prompt is required');
    return;
  }
  const promptArray = prompts ? prompts : [prompt];
  for (const p of promptArray) {
    await insertPrompt({ prompt: p });
  }
  res.redirect('/prompts');
});

app.get('/prompts/generate', (req, res) => {
  res.render('prompts/generate');
});

app.post('/prompts/generate', async (req, res) => {
  const prompts = await generatePrompts(req.body.base);
  res.json({ prompts });
});

app.get('/prompts/:id/run', async (req, res) => {
  const promptId = parseInt(req.params.id, 10);
  if (isNaN(promptId)) {
    res.status(400).send('Invalid prompt ID');
    return;
  }
  const prompt = await getPromptById(promptId);
  if (!prompt) {
    res.status(404).send('Prompt not found');
    return;
  }

  const responseModels =
    typeof req.query['model'] === 'string' &&
    RESPONSE_MODELS.includes(req.query['model'])
      ? [req.query['model']]
      : RESPONSE_MODELS;

  if (responseModels.length === 0) {
    res.status(400).send('Invalid model');
    return;
  }

  const promises = responseModels.map(async (model) => {
    const response = await getResponse(prompt.prompt, model);
    const brandSentiment = await generateBrandSentiment(
      [
        ...(await getCompetitors()).map((c) => c.name),
        'Timescale',
        'TigerData',
      ],
      response.content,
    );
    const newResponse = await insertResponse({
      prompt_id: promptId,
      model,
      response: response.content,
    });
    if (!newResponse) {
      throw new Error('Could not insert response');
    }
    const id = newResponse.id;
    for (const url of response.urls) {
      await insertLink({
        response_id: id,
        url,
        hostname: new URL(url).hostname.replace(/^www\./, ''),
      });
    }
    for (const sentiment of brandSentiment.sentiments) {
      await insertBrandSentiment({
        ...sentiment,
        response_id: id,
      });
    }

    return id;
  });

  const results = await Promise.allSettled(promises);

  if (results.length === 1) {
    const result = results[0];
    if (result?.status === 'fulfilled') {
      res.redirect(`/responses/${result.value}`);
    } else {
      res
        .status(500)
        .send('Error processing response:<br /><br />' + result?.reason);
    }
    return;
  }

  res.redirect('/responses');
});

app.get('/prompts/:id/delete', async (req, res) => {
  const promptId = parseInt(req.params.id, 10);
  if (isNaN(promptId)) {
    res.status(400).send('Invalid prompt ID');
    return;
  }
  await deletePrompt(promptId);
  res.redirect('/prompts');
});

app.get('/responses', async (req, res) => {
  const responses = await getResponses();
  res.render('responses', { responses });
});

app.get('/responses/:id', async (req, res) => {
  const responseId = parseInt(req.params.id, 10);
  if (isNaN(responseId)) {
    res.status(400).send('Invalid response ID');
    return;
  }
  const response = await getResponseById(responseId);
  if (!response) {
    res.status(404).send('Response not found');
    return;
  }
  const brandSentiment = await getBrandSentimentByResponseId(responseId);
  const links = await getLinksByResponseId(responseId);
  res.render('responses/view', { brandSentiment, links, response });
});

app.get('/links', async (req, res) => {
  const links = await getRecentLinks();
  const hostnameCounts = await getHostnameCount();

  res.render('links', { links, hostnameCounts });
});

app.get('/sentiments', async (req, res) => {
  const sentiments = await getBrandSentiment();
  res.render('sentiments', { sentiments });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
