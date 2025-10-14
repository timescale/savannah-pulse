import 'dotenv/config';
import { CronExpressionParser } from 'cron-parser';
import express from 'express';
import { marked } from 'marked';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { db, migrateToLatest } from './db';
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
  getLinksByHostname,
  getLinksByHostnameGrouped,
  getLinksByResponseId,
  getRecentLinks,
  insertLink,
} from './repositories/links-repository';
import {
  deletePrompt,
  getDuePrompts,
  getPromptById,
  getPrompts,
  getPromptsForTag,
  insertPrompt,
  updatePrompt,
} from './repositories/prompts-repository';
import {
  deletePromptTag,
  getTagsForPrompt,
  insertPromptTag,
} from './repositories/prompts-tags-repository';
import {
  deleteResponseFollowUp,
  getResponseFollowUpById,
  getResponseFollowUpsByResponseId,
  insertResponseFollowUp,
  updateResponseFollowUp,
} from './repositories/response-followup-repository';
import {
  getResponseById,
  getResponses,
  getResponsesByProvider,
  getResponsesByProviderAndTag,
  getResponsesForTag,
  insertResponse,
} from './repositories/responses-repository';
import {
  getSearchQueriesByResponseId,
  insertSearchQuery,
} from './repositories/search-queries-repository';
import {
  deleteTag,
  getTag,
  getTags,
  insertTag,
  updateTag,
} from './repositories/tags-repository';
import {
  getWeeklyBrandSentimentCounts,
  getWeeklyLinkCounts,
} from './repositories/trends-repository';
import { generateBrandSentiment } from './services/brand-sentiment';
import { generatePrompts } from './services/prompt-generator';
import {
  DEFAULT_RESPONSE_MODELS,
  getPriorMessages,
  getResponse,
  parseFollowUp,
  SUPPORTED_RESPONSE_MODELS,
  SUPPORTED_RESPONSE_MODELS_BY_PROVIDER,
} from './services/response';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  express.static(path.join(__dirname, '..', 'node_modules/bootstrap/dist/css')),
);
app.use(
  '/bootstrap/js',
  express.static(path.join(__dirname, '..', 'node_modules/bootstrap/dist/js')),
);
app.use(
  '/bootstrap/icons',
  express.static(
    path.join(__dirname, '..', 'node_modules/bootstrap-icons/font'),
  ),
);
app.use(
  '/cronstrue',
  express.static(path.join(__dirname, '..', 'node_modules/cronstrue/dist')),
);
app.use(
  '/chartjs',
  express.static(path.join(__dirname, '..', 'node_modules/chart.js/dist')),
);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_, res) => {
  res.render('index');
});

app.get('/competitors', async (_, res) => {
  const competitors = await getCompetitors();
  res.render('competitors', { competitors });
});

app.get('/competitors/add', (_, res) => {
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

app.get('/tags', async (_, res) => {
  res.render('tags', { tags: await getTags() });
});

app.get('/tags/add', (_, res) => {
  res.render('tags/add');
});

app.post('/tags/add', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).send('Name is required');
    return;
  }
  await insertTag(name);
  res.redirect('/tags');
});

app.get('/tags/:id/edit', async (req, res) => {
  const tagId = parseInt(req.params.id, 10);
  if (isNaN(tagId)) {
    res.status(400).send('Invalid tag ID');
    return;
  }
  const tag = await getTag(tagId);
  if (!tag) {
    res.status(404).send('Tag not found');
    return;
  }
  res.render('tags/edit', { tag });
});

app.post('/tags/:id/edit', async (req, res) => {
  const tagId = parseInt(req.params.id, 10);
  if (isNaN(tagId)) {
    res.status(400).send('Invalid tag ID');
    return;
  }
  const { name } = req.body;
  if (!name) {
    res.status(400).send('Name is required');
    return;
  }
  const tag = await getTag(tagId);
  if (!tag) {
    res.status(404).send('Tag not found');
    return;
  }
  await updateTag(tagId, { name });
  res.redirect('/tags');
});

app.get('/tags/:id/delete', async (req, res) => {
  const tagId = parseInt(req.params.id, 10);
  if (isNaN(tagId)) {
    res.status(400).send('Invalid tag ID');
    return;
  }
  await deleteTag(tagId);
  res.redirect('/tags');
});

app.get('/prompts', async (req, res) => {
  const tags = await getTags();
  const tagParam = req.query['tag'];
  const selectedTag = tagParam ? parseInt(tagParam as string, 10) : null;

  const prompts =
    selectedTag && !isNaN(selectedTag)
      ? await getPromptsForTag(selectedTag)
      : await getPrompts();

  res.render('prompts', { prompts, tags, selectedTag });
});

app.get('/prompts/add', async (_, res) => {
  res.render('prompts/form', {
    defaultModels: DEFAULT_RESPONSE_MODELS,
    prompt: null,
    tags: await getTags(),
    supportedModels: SUPPORTED_RESPONSE_MODELS_BY_PROVIDER,
  });
});

app.post('/prompts/add', async (req, res) => {
  const { models, prompt, prompts, schedule, tags } = req.body;

  if (
    !models &&
    (!models ||
      (!Array.isArray(models) && typeof models !== 'string') ||
      models.length === 0)
  ) {
    res.status(400).send('At least one model is required');
    return;
  }
  const modelArray = models ? (Array.isArray(models) ? models : [models]) : [];
  for (const model of modelArray) {
    if (!SUPPORTED_RESPONSE_MODELS.includes(model)) {
      res.status(400).send(`Unsupported model: ${model}`);
      return;
    }
  }

  if (
    !prompt &&
    (!prompts ||
      (!Array.isArray(prompts) && typeof prompts !== 'string') ||
      prompts.length === 0)
  ) {
    res.status(400).send('Prompt is required');
    return;
  }

  // Validate and calculate schedule
  let scheduleValue: string | null = null;
  let nextRunAt: Date | null = null;

  if (schedule && schedule.trim().length > 0) {
    const trimmedSchedule = schedule.trim();
    try {
      nextRunAt = CronExpressionParser.parse(trimmedSchedule).next().toDate();
      scheduleValue = trimmedSchedule;
    } catch (error) {
      res
        .status(400)
        .send(
          `Invalid cron expression: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      return;
    }
  }

  const promptArray = prompts
    ? Array.isArray(prompts)
      ? prompts
      : [prompts]
    : [prompt];
  for (const p of promptArray) {
    const { id } = await insertPrompt({
      models: modelArray,
      prompt: p,
      schedule: scheduleValue,
      next_run_at: nextRunAt,
    });
    if (tags && Array.isArray(tags)) {
      for (const tagIdStr of tags) {
        const tagId = parseInt(tagIdStr, 10);
        if (!isNaN(tagId)) {
          await insertPromptTag({ prompt_id: id, tag_id: tagId });
        }
      }
    }
  }
  res.redirect('/prompts');
});

app.get('/prompts/generate', async (req, res) => {
  let promptText = `Searching the TigerData website (https://www.tigerdata.com/), generate a list of prompts that someone might type into ChatGPT searching for technology that is related to what TigerData provides. The prompts should be in the form of "What is ..." or "How would I do ..." type questions. The questions should not directly mention TigerData or Timescale, but rather be like "How would I have time-series data in Postgres".`;
  if (req.query['promptId']) {
    const promptId = parseInt((req.query['promptId'] as string) || '0', 10);
    const prompt = await getPromptById(promptId);
    if (prompt) {
      promptText = `Given the following prompt:

${prompt.prompt}

Generate a list of related search prompts a user might type into ChatGPT or Perplexity. Feel free to expand on the base idea of the prompt.`;
    }
  }

  res.render('prompts/generate', {
    defaultModels: DEFAULT_RESPONSE_MODELS,
    promptText,
    supportedModels: SUPPORTED_RESPONSE_MODELS_BY_PROVIDER,
  });
});

app.post('/prompts/generate', async (req, res) => {
  const prompts = await generatePrompts(req.body.base);
  res.json({ prompts });
});

app.get('/prompts/:id/edit', async (req, res) => {
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
  res.render('prompts/form', {
    prompt,
    tags: await getTags(),
    supportedModels: SUPPORTED_RESPONSE_MODELS_BY_PROVIDER,
  });
});

app.post('/prompts/:id/edit', async (req, res) => {
  const promptId = parseInt(req.params.id, 10);
  if (isNaN(promptId)) {
    res.status(400).send('Invalid prompt ID');
    return;
  }
  const existingPrompt = await getPromptById(promptId);
  if (!existingPrompt) {
    res.status(404).send('Prompt not found');
    return;
  }

  const { models, schedule, tags } = req.body;
  if (!models || !Array.isArray(models) || models.length === 0) {
    res.status(400).send('At least one model is required');
    return;
  }
  for (const model of models) {
    if (!SUPPORTED_RESPONSE_MODELS.includes(model)) {
      res.status(400).send(`Unsupported model: ${model}`);
      return;
    }
  }

  // Validate and calculate schedule
  let scheduleValue: string | null = null;
  let nextRunAt: Date | null = null;

  if (schedule && schedule.trim().length > 0) {
    const trimmedSchedule = schedule.trim();
    try {
      nextRunAt = CronExpressionParser.parse(trimmedSchedule).next().toDate();
      scheduleValue = trimmedSchedule;
    } catch (error) {
      res
        .status(400)
        .send(
          `Invalid cron expression: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      return;
    }
  }

  await updatePrompt(promptId, {
    models,
    schedule: scheduleValue,
    next_run_at: nextRunAt,
  });

  const promptTags = await getTagsForPrompt(promptId);
  const promptTagIds = promptTags.map((t) => t.id);
  const tagIds =
    tags && Array.isArray(tags)
      ? tags
          .map((t: string) => parseInt(t, 10))
          .filter((t: number) => !isNaN(t))
      : [];

  const newTags = tagIds.filter((id) => !promptTagIds.includes(id));
  for (const tagId of newTags) {
    await insertPromptTag({ prompt_id: promptId, tag_id: tagId });
  }
  const removedTags = promptTagIds.filter((id) => !tagIds.includes(id));
  for (const tagId of removedTags) {
    await deletePromptTag(promptId, tagId);
  }

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

  const responseModels =
    typeof req.query['model'] === 'string' &&
    prompt.models.includes(req.query['model'])
      ? [req.query['model']]
      : prompt.models;

  if (responseModels.length === 0) {
    res.status(400).send('Invalid model');
    return;
  }

  const results = await db.transaction().execute(async (trx) => {
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
      const newResponse = await insertResponse(
        {
          prompt_id: promptId,
          model,
          raw: response.raw,
          response: response.content,
        },
        trx,
      );
      if (!newResponse) {
        throw new Error('Could not insert response');
      }
      const id = newResponse.id;
      for (const url of response.urls) {
        await insertLink(
          {
            response_id: id,
            url,
            hostname: new URL(url).hostname.replace(/^www\./, ''),
          },
          trx,
        );
      }
      for (const searchQuery of response.searchQueries) {
        await insertSearchQuery({ query: searchQuery, response_id: id }, trx);
      }
      for (const sentiment of brandSentiment.sentiments) {
        await insertBrandSentiment(
          {
            ...sentiment,
            response_id: id,
          },
          trx,
        );
      }

      return id;
    });

    return await Promise.all(promises);
  });

  if (results.length === 1) {
    res.redirect(`/responses/${results[0]}`);
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
  const tags = await getTags();
  const providerParam = req.query['provider'] as string | undefined;
  const tagParam = req.query['tag'];
  const selectedTag = tagParam ? parseInt(tagParam as string, 10) : null;

  let responses: Awaited<ReturnType<typeof getResponses>>;

  if (providerParam && selectedTag && !isNaN(selectedTag)) {
    responses = await getResponsesByProviderAndTag(providerParam, selectedTag);
  } else if (providerParam) {
    responses = await getResponsesByProvider(providerParam);
  } else if (selectedTag && !isNaN(selectedTag)) {
    responses = await getResponsesForTag(selectedTag);
  } else {
    responses = await getResponses();
  }

  res.render('responses', { responses, tags, selectedTag });
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
  const searchQueries = await getSearchQueriesByResponseId(responseId);
  const followups = await getResponseFollowUpsByResponseId(responseId);
  res.render('responses/view', {
    brandSentiment,
    followups,
    links,
    searchQueries,
    response,
  });
});

app.get('/responses/:id/followup/new', async (req, res) => {
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

  const { id } = await insertResponseFollowUp({
    response_id: responseId,
    followup: [],
  });

  res.redirect(`/responses/${responseId}/followup/${id}`);
});

app.get('/responses/:responseId/followup/:followupId', async (req, res) => {
  const responseId = parseInt(req.params.responseId, 10);
  if (isNaN(responseId)) {
    res.status(400).send('Invalid response ID');
    return;
  }
  const response = await getResponseById(responseId);
  if (!response) {
    res.status(404).send('Response not found');
    return;
  }

  const followupId = parseInt(req.params.followupId, 10);
  if (isNaN(followupId)) {
    res.status(400).send('Invalid followup ID');
    return;
  }
  const followup = await getResponseFollowUpById(followupId);
  if (!followup) {
    res.status(404).send('Followup not found');
    return;
  }

  const parsedFollowUp = parseFollowUp(
    response.model,
    response.prompt,
    response.raw,
    followup.followup,
  );

  res.render('responses/followup', { followup, response, parsedFollowUp });
});

app.post('/responses/:responseId/followup/:followupId', async (req, res) => {
  const responseId = parseInt(req.params.responseId, 10);
  if (isNaN(responseId)) {
    res.status(400).send('Invalid response ID');
    return;
  }
  const response = await getResponseById(responseId);
  if (!response) {
    res.status(404).send('Response not found');
    return;
  }

  const followupId = parseInt(req.params.followupId, 10);
  if (isNaN(followupId)) {
    res.status(400).send('Invalid followup ID');
    return;
  }
  const followup = await getResponseFollowUpById(followupId);
  if (!followup) {
    res.status(404).send('Followup not found');
    return;
  }

  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).send('Message is required');
    return;
  }

  const newResponse = await getResponse(
    message,
    response.model,
    getPriorMessages(
      response.model,
      response.prompt,
      response.raw,
      followup.followup,
    ),
  );
  await updateResponseFollowUp(followupId, {
    followup: [
      ...followup.followup,
      { role: 'user', content: message, type: 'message' },
      newResponse.raw,
    ],
  });

  res.redirect(`/responses/${responseId}/followup/${followupId}`);
});

app.get('/responses/:id/followup/:followupId/delete', async (req, res) => {
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

  const followupId = parseInt(req.params.followupId, 10);
  if (isNaN(followupId)) {
    res.status(400).send('Invalid followup ID');
    return;
  }
  const followup = await getResponseFollowUpById(followupId);
  if (!followup) {
    res.status(404).send('Followup not found');
    return;
  }

  await deleteResponseFollowUp(followupId);
  res.redirect(`/responses/${responseId}`);
});

app.get('/links', async (_, res) => {
  const links = await getRecentLinks();
  const hostnameCounts = await getHostnameCount();

  res.render('links', { links, hostnameCounts });
});

app.get('/links/:hostname', async (req, res) => {
  const hostname = req.params.hostname;
  const view = (req.query['view'] as string) || 'all';

  const links =
    view === 'grouped'
      ? await getLinksByHostnameGrouped(hostname)
      : await getLinksByHostname(hostname);

  res.render('links/hostname', { hostname, links, view });
});

app.get('/sentiments', async (_, res) => {
  const sentiments = await getBrandSentiment();
  res.render('sentiments', { sentiments });
});

app.get('/trends', async (_, res) => {
  const weeklyLinkCounts = await getWeeklyLinkCounts();
  const weeklyBrandSentimentCounts = await getWeeklyBrandSentimentCounts();
  res.render('trends', { weeklyLinkCounts, weeklyBrandSentimentCounts });
});

// Scheduled prompt runner - checks every 5 minutes for prompts that need to run
async function runScheduledPrompts() {
  try {
    const duePrompts = await getDuePrompts();
    if (duePrompts.length === 0) {
      return;
    }

    console.log(
      `Running ${duePrompts.length} scheduled prompt(s) at ${new Date().toISOString()}`,
    );

    for (const prompt of duePrompts) {
      try {
        console.log(`Running scheduled prompt ${prompt.id}: ${prompt.prompt}`);

        await db.transaction().execute(async (trx) => {
          const promises = prompt.models.map(async (model) => {
            const response = await getResponse(prompt.prompt, model);
            const brandSentiment = await generateBrandSentiment(
              [
                ...(await getCompetitors()).map((c) => c.name),
                'Timescale',
                'TigerData',
              ],
              response.content,
            );
            const newResponse = await insertResponse(
              {
                prompt_id: prompt.id,
                model,
                raw: response.raw,
                response: response.content,
              },
              trx,
            );
            if (!newResponse) {
              throw new Error('Could not insert response');
            }
            const id = newResponse.id;
            for (const url of response.urls) {
              await insertLink(
                {
                  response_id: id,
                  url,
                  hostname: new URL(url).hostname.replace(/^www\./, ''),
                },
                trx,
              );
            }
            for (const searchQuery of response.searchQueries) {
              await insertSearchQuery(
                { query: searchQuery, response_id: id },
                trx,
              );
            }
            for (const sentiment of brandSentiment.sentiments) {
              await insertBrandSentiment(
                {
                  ...sentiment,
                  response_id: id,
                },
                trx,
              );
            }

            return id;
          });

          await Promise.all(promises);
        });

        // Calculate next run time
        if (prompt.schedule) {
          const nextRunAt = CronExpressionParser.parse(prompt.schedule)
            .next()
            .toDate();
          await updatePrompt(prompt.id, { next_run_at: nextRunAt });
          console.log(
            `Prompt ${prompt.id} completed. Next run at ${nextRunAt.toISOString()}`,
          );
        }
      } catch (error) {
        console.error(`Error running scheduled prompt ${prompt.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in runScheduledPrompts:', error);
  }
}

// Calculate delay to next 5-minute boundary
const now = new Date();
const minutes = now.getMinutes();
const seconds = now.getSeconds();
const milliseconds = now.getMilliseconds();
const delayMs = (5 - (minutes % 5)) * 60 * 1000 - seconds * 1000 - milliseconds;

console.log(
  `Scheduling first run in ${Math.round(delayMs / 1000)} seconds (at ${new Date(Date.now() + delayMs).toLocaleTimeString()})`,
);

migrateToLatest()
  .catch((err) => {
    console.error('Error running migrations:', err);
    process.exit(1);
  })
  .then(() => {
    // Run once on startup, then at the next 5-minute boundary, then every 5 minutes
    runScheduledPrompts();
    setTimeout(() => {
      runScheduledPrompts();
      setInterval(runScheduledPrompts, 300000);
    }, delayMs);
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  });
