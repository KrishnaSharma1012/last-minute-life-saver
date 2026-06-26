const express = require('express');
const router = express.Router();
const { chatWithAI, parseTaskInput, prioritizeTasks, generateActionPlan, generateInsights } = require('../services/geminiService');

// POST /api/ai/chat - Chat with Gemini AI
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await chatWithAI(message, history || []);
    res.json({ response, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('AI Chat Error:', error.message);
    res.status(500).json({ error: 'AI service error', message: error.message });
  }
});

// POST /api/ai/parse-task - Parse natural language into task
router.post('/parse-task', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Task text is required' });
    }

    const task = await parseTaskInput(text);
    res.json({ task, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Parse Task Error:', error.message);
    res.status(500).json({ error: 'Failed to parse task', message: error.message });
  }
});

// POST /api/ai/prioritize - Re-prioritize tasks
router.post('/prioritize', async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks array is required' });
    }

    const prioritized = await prioritizeTasks(tasks);
    res.json({ prioritized, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Prioritize Error:', error.message);
    res.status(500).json({ error: 'Failed to prioritize', message: error.message });
  }
});

// POST /api/ai/action-plan - Generate action plan
router.post('/action-plan', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const steps = await generateActionPlan(title, description);
    res.json({ steps, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Action Plan Error:', error.message);
    res.status(500).json({ error: 'Failed to generate plan', message: error.message });
  }
});

// POST /api/ai/insights - Get productivity insights
router.post('/insights', async (req, res) => {
  try {
    const { taskHistory, habitData } = req.body;
    const insights = await generateInsights(taskHistory || [], habitData || []);
    res.json({ insights, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Insights Error:', error.message);
    res.status(500).json({ error: 'Failed to generate insights', message: error.message });
  }
});

module.exports = router;
