import dotenv from 'dotenv';
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
import { generateBrandSentiment } from './services/brand-sentiment-service';
import { getResponse } from './services/response-service';

dotenv.config();

const app = express();
const port = process.env['PORT'] || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make markdown renderer available in all EJS templates
app.locals['markdown'] = (text: string) => {
  return marked(text);
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  res.render('prompts', { prompts });
});

app.get('/prompts/add', (req, res) => {
  res.render('prompts/add');
});

app.post('/prompts/add', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    res.status(400).send('Prompt is required');
    return;
  }
  await insertPrompt({ prompt });
  res.redirect('/prompts');
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
  const response = await getResponse(
    prompt.prompt,
    'gpt-4o-mini-search-preview',
  );
  const brandSentiment = await generateBrandSentiment(
    [...(await getCompetitors()).map((c) => c.name), 'Timescale', 'TigerData'],
    response.content,
  );
  const newResponse = await insertResponse({
    prompt_id: promptId,
    provider: 'chatgpt',
    response: response.content,
  });
  if (!newResponse) {
    res.status(500).send('Failed to insert response');
    return;
  }
  const id = newResponse.id;
  for (const url of response.urls) {
    await insertLink({ response_id: id, url, hostname: new URL(url).hostname });
  }
  for (const sentiment of brandSentiment.sentiments) {
    await insertBrandSentiment({
      ...sentiment,
      response_id: id,
    });
  }
  res.redirect(`/responses/${id}`);
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
  console.log(brandSentiment);
  res.render('responses/view', { brandSentiment, response });
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
