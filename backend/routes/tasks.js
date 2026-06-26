const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory store (replace with Firestore later)
let tasks = [
  {
    id: '1',
    title: 'Complete Project Report',
    description: 'Finish the quarterly project report with data analysis',
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    priority: 'critical',
    priorityScore: 95,
    estimatedHours: 2,
    status: 'in-progress',
    category: 'Work',
    actionSteps: ['Gather data from team', 'Write executive summary', 'Add charts', 'Review and submit'],
    completedSteps: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Prepare Presentation Slides',
    description: 'Create slides for tomorrow meeting',
    deadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    priorityScore: 82,
    estimatedHours: 1.5,
    status: 'pending',
    category: 'Work',
    actionSteps: ['Create outline', 'Design slides', 'Add content', 'Practice run'],
    completedSteps: 0,
    createdAt: new Date().toISOString(),
  },
];

// GET /api/tasks - Get all tasks
router.get('/', (req, res) => {
  const sorted = [...tasks].sort((a, b) => b.priorityScore - a.priorityScore);
  res.json({ tasks: sorted });
});

// GET /api/tasks/:id - Get single task
router.get('/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ task });
});

// POST /api/tasks - Create task
router.post('/', (req, res) => {
  const { title, description, deadline, priority, priorityScore, estimatedHours, category, actionSteps } = req.body;

  if (!title) return res.status(400).json({ error: 'Title is required' });

  const task = {
    id: uuidv4(),
    title,
    description: description || '',
    deadline: deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    priority: priority || 'medium',
    priorityScore: priorityScore || 50,
    estimatedHours: estimatedHours || 1,
    status: 'pending',
    category: category || 'Work',
    actionSteps: actionSteps || [],
    completedSteps: 0,
    createdAt: new Date().toISOString(),
  };

  tasks.push(task);
  res.status(201).json({ task });
});

// PATCH /api/tasks/:id - Update task
router.patch('/:id', (req, res) => {
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });

  tasks[index] = { ...tasks[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json({ task: tasks[index] });
});

// PATCH /api/tasks/:id/complete - Mark task complete
router.patch('/:id/complete', (req, res) => {
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });

  tasks[index].status = 'completed';
  tasks[index].completedAt = new Date().toISOString();
  res.json({ task: tasks[index] });
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', (req, res) => {
  tasks = tasks.filter(t => t.id !== req.params.id);
  res.json({ success: true });
});

module.exports = router;
