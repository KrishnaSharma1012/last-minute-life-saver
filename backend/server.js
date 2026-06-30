const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');
const habitRoutes = require('./routes/habits');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    app: 'Last-Minute Life Saver API',
    version: '1.0.0',
    powered_by: 'Google Gemini 2.0 Flash'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/habits', habitRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

const { startPushService } = require('./services/pushService');

app.listen(PORT, () => {
  console.log(`🚀 Last-Minute Life Saver API running on port ${PORT}`);
  console.log(`🧠 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Connected ✅' : 'Key missing ❌'}`);
  startPushService();
});

module.exports = app;
