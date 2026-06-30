const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
const model = genAI.getGenerativeModel({ 
  model: 'gemini-pro',
  systemInstruction: "You are an elite productivity and discipline coach. Your name is Vibeship AI. Keep responses concise, motivational, and actionable."
});
const jsonModel = genAI.getGenerativeModel({ model: 'gemini-pro', generationConfig: { responseMimeType: "application/json" } });

// Helper to check if we have a real key
const hasRealKey = () => process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10;

/**
 * Chat with Gemini AI
 */
async function chatWithAI(message, history = []) {
  if (!hasRealKey()) {
    console.log(`[MOCK AI] chatWithAI: ${message}`);
    return `[Demo Mode - Please add GEMINI_API_KEY to backend/.env] \n\nI received your message: "${message}". Once you add your Gemini API key, I will be able to have a real conversation with you!`;
  }

  try {
    let formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Gemini SDK strictly requires the first message to be from 'user'
    while (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
      formattedHistory.shift();
    }

    const chat = model.startChat({
      history: formattedHistory
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (err) {
    console.error('Gemini API Error:', err);
    return "I'm having trouble connecting to my brain right now. Error details: " + err.message;
  }
}

/**
 * Parse natural language into a task
 */
async function parseTaskInput(text) {
  if (!hasRealKey()) {
    console.log(`[MOCK AI] parseTaskInput: ${text}`);
    let deadline = 'Tomorrow, 5:00 PM';
    let priority = 'high';
    if (text.toLowerCase().includes('today') || text.toLowerCase().includes('urgent')) {
      deadline = 'Today, 11:59 PM';
      priority = 'critical';
    }
    return {
      title: text, priority, priorityScore: priority === 'critical' ? 95 : 85,
      deadline, estimatedHours: 2, category: 'Work',
      actionSteps: ['Break down objective', 'Execute task', 'Review']
    };
  }

  try {
    const prompt = `Analyze this task input: "${text}". 
    Return a JSON object exactly matching this structure: 
    { "title": "short concise title", "priority": "low"|"medium"|"high"|"critical", "priorityScore": number 1-100, "deadline": "readable string like 'Today, 5 PM'", "estimatedHours": number, "category": "Work"|"Personal"|"Study"|"Health", "actionSteps": ["step 1", "step 2"] }`;
    
    const result = await jsonModel.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (err) {
    console.error('Gemini API Error:', err);
    throw new Error('Failed to parse task with AI');
  }
}

/**
 * Prioritize tasks
 */
async function prioritizeTasks(tasks) {
  if (!hasRealKey()) {
    return tasks.map((t, i) => ({ id: t.id, priorityScore: 90 - (i * 5), priority: i === 0 ? 'critical' : 'high', reason: 'Mocked AI prioritization.' }));
  }

  try {
    const prompt = `Analyze these tasks: ${JSON.stringify(tasks)}.
    Return a JSON array of objects with structure: [{ "id": "task_id", "priorityScore": number 1-100, "priority": "low"|"medium"|"high"|"critical", "reason": "short explanation" }]`;
    
    const result = await jsonModel.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (err) {
    console.error('Gemini API Error:', err);
    throw new Error('Failed to prioritize tasks');
  }
}

async function generateActionPlan(taskTitle, taskDescription = '') {
  if (!hasRealKey()) {
    return ['Review requirements', 'Setup environment', 'Implement', 'Test'];
  }
  
  try {
    const prompt = `Create a step-by-step action plan for this task: Title: ${taskTitle}. Desc: ${taskDescription}. Return a JSON array of strings, where each string is a step.`;
    const result = await jsonModel.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (err) {
    return ['Step 1', 'Step 2', 'Step 3'];
  }
}

async function generateInsights(taskHistory, habitData) {
  if (!hasRealKey()) {
    return [{ icon: '🔥', title: 'Demo Insight', value: '100%', description: 'Add Gemini key for real insights' }];
  }
  
  try {
    const prompt = `Analyze task history and return 3 productivity insights. Return a JSON array of objects matching: [{ "icon": "emoji", "title": "short title", "value": "short metric", "description": "1 sentence explanation" }]`;
    const result = await jsonModel.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (err) {
    return [{ icon: '📈', title: 'Error', value: 'N/A', description: 'Failed to generate insights' }];
  }
}

module.exports = {
  chatWithAI,
  parseTaskInput,
  prioritizeTasks,
  generateActionPlan,
  generateInsights,
};
