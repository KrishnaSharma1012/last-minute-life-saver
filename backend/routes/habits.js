const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory habit store
let habits = [
  {
    id: '1',
    name: 'Morning Exercise',
    emoji: '🏋️',
    frequency: 'daily',
    streak: 12,
    completionLog: [],
    aiInsight: 'Great consistency! You exercise best on weekdays.',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Read 30 Minutes',
    emoji: '📚',
    frequency: 'daily',
    streak: 8,
    completionLog: [],
    aiInsight: 'Try reading right after lunch for best results.',
    createdAt: new Date().toISOString(),
  },
];

// GET /api/habits
router.get('/', (req, res) => {
  res.json({ habits });
});

// POST /api/habits
router.post('/', (req, res) => {
  const { name, emoji, frequency } = req.body;
  if (!name) return res.status(400).json({ error: 'Habit name is required' });

  const habit = {
    id: uuidv4(),
    name,
    emoji: emoji || '✅',
    frequency: frequency || 'daily',
    streak: 0,
    completionLog: [],
    aiInsight: '',
    createdAt: new Date().toISOString(),
  };

  habits.push(habit);
  res.status(201).json({ habit });
});

// PATCH /api/habits/:id/complete
router.patch('/:id/complete', (req, res) => {
  const habit = habits.find(h => h.id === req.params.id);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  habit.completionLog.push(new Date().toISOString());
  habit.streak += 1;
  res.json({ habit });
});

// DELETE /api/habits/:id
router.delete('/:id', (req, res) => {
  habits = habits.filter(h => h.id !== req.params.id);
  res.json({ success: true });
});

module.exports = router;
