const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
});

/**
 * Chat with Gemini AI — productivity assistant context
 */
async function chatWithAI(message, history = []) {
  const systemPrompt = `You are "LifeSaver AI", an intelligent productivity companion inside "The Last-Minute Life Saver" app. Your personality:
- Encouraging but direct — you don't sugarcoat when deadlines are close
- You give actionable advice, not vague platitudes
- You understand task management, prioritization, and time blocking
- You use emojis sparingly for warmth
- Keep responses concise (2-4 sentences for simple questions, more for plans)
- When users ask "what should I do now?", give a specific, ordered recommendation
- You can reference the user's tasks, habits, and productivity patterns

Current date/time: ${new Date().toLocaleString()}`;

  const chatHistory = history
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .slice(-10)
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood! I\'m LifeSaver AI, ready to help you crush your tasks and never miss a deadline. What can I help you with?' }] },
      ...chatHistory,
    ],
  });

  const result = await chat.sendMessage(message);
  return result.response.text();
}

/**
 * Parse natural language task input into structured data
 */
async function parseTaskInput(text) {
  const prompt = `Parse this task description into structured JSON. Extract or infer:
- title: clear, concise task title
- priority: "critical", "high", "medium", or "low" (infer from urgency cues)
- priorityScore: 0-100 number (higher = more urgent)
- deadline: specific date/time string (infer from context, use "Tomorrow" if unclear)
- estimatedHours: realistic estimate of hours needed
- category: one of "Work", "Personal", "Learning", "Health", "Communication", "Finance"
- actionSteps: array of 3-5 concrete, actionable steps to complete this task

Task description: "${text}"

Current date/time: ${new Date().toLocaleString()}

Respond with ONLY valid JSON, no markdown formatting, no code blocks.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();
  
  // Clean up potential markdown code block wrapping
  const cleaned = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  
  return JSON.parse(cleaned);
}

/**
 * Prioritize a list of tasks using AI
 */
async function prioritizeTasks(tasks) {
  const prompt = `You are a task prioritization engine. Given these tasks, re-rank them by urgency and importance.
For each task, provide an updated priorityScore (0-100) and a brief reason.

Tasks:
${JSON.stringify(tasks, null, 2)}

Current date/time: ${new Date().toLocaleString()}

Respond with ONLY a valid JSON array of objects with: { id, priorityScore, priority, reason }
No markdown, no code blocks.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();
  const cleaned = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  
  return JSON.parse(cleaned);
}

/**
 * Generate action plan for a task
 */
async function generateActionPlan(taskTitle, taskDescription = '') {
  const prompt = `Generate a detailed, actionable step-by-step plan to complete this task:

Task: ${taskTitle}
${taskDescription ? `Details: ${taskDescription}` : ''}

Provide 5-8 specific, concrete steps. Each step should be:
- Clear and unambiguous
- Achievable in a single sitting
- Ordered logically

Respond with ONLY a valid JSON array of strings. No markdown, no code blocks.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();
  const cleaned = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  
  return JSON.parse(cleaned);
}

/**
 * Generate productivity insights from task history
 */
async function generateInsights(taskHistory, habitData) {
  const prompt = `Analyze this user's productivity data and provide 3-4 actionable insights:

Task History: ${JSON.stringify(taskHistory)}
Habit Data: ${JSON.stringify(habitData)}

For each insight, provide:
- icon: a single relevant emoji
- title: short title (2-4 words)
- value: the key metric or finding
- description: actionable recommendation (1 sentence)

Respond with ONLY valid JSON array. No markdown, no code blocks.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();
  const cleaned = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  
  return JSON.parse(cleaned);
}

module.exports = {
  chatWithAI,
  parseTaskInput,
  prioritizeTasks,
  generateActionPlan,
  generateInsights,
};
