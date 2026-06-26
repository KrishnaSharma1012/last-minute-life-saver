// In-memory store for demo mode (no Firebase needed)
// This lets you test the entire app without setting up Firebase

const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
tomorrow.setHours(17, 0, 0, 0)

const in3Days = new Date()
in3Days.setDate(in3Days.getDate() + 3)

const tonight = new Date()
tonight.setHours(23, 59, 0, 0)

let demoTasks = [
  {
    id: 'demo-task-1',
    userId: 'demo-user-001',
    title: 'Complete hackathon submission for Vibe2Ship',
    description: 'Finish building the Last-Minute Life Saver app and submit on BlockseBlock',
    deadline: tonight.toISOString(),
    priority: 'critical',
    priorityScore: 95,
    estimatedHours: 4,
    status: 'in-progress',
    category: 'Hackathon',
    actionSteps: [
      'Wire up all frontend pages to Firestore',
      'Test the full user flow end-to-end',
      'Deploy to Google Cloud Run',
      'Write submission Google Doc',
      'Submit on BlockseBlock platform',
    ],
    completedSteps: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-task-2',
    userId: 'demo-user-001',
    title: 'Review AI/ML model integration for judges',
    description: 'Make sure Gemini API integration is robust and impressive for the demo',
    deadline: tomorrow.toISOString(),
    priority: 'high',
    priorityScore: 80,
    estimatedHours: 2,
    status: 'pending',
    category: 'Work',
    actionSteps: [
      'Test Gemini chat responses',
      'Verify task parsing accuracy',
      'Prepare demo script for judges',
    ],
    completedSteps: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-task-3',
    userId: 'demo-user-001',
    title: 'Study for DSA interview next week',
    description: 'Practice medium-level LeetCode problems focusing on trees and graphs',
    deadline: in3Days.toISOString(),
    priority: 'medium',
    priorityScore: 55,
    estimatedHours: 3,
    status: 'pending',
    category: 'Study',
    actionSteps: [
      'Solve 3 tree problems',
      'Solve 2 graph problems',
      'Review time complexity notes',
    ],
    completedSteps: 0,
    createdAt: new Date().toISOString(),
  },
]

let demoHabits = [
  {
    id: 'demo-habit-1',
    userId: 'demo-user-001',
    name: 'Code for 2 hours',
    emoji: '💻',
    frequency: 'daily',
    streak: 5,
    completionLog: [
      new Date(Date.now() - 86400000 * 6).toISOString(),
      new Date(Date.now() - 86400000 * 5).toISOString(),
      new Date(Date.now() - 86400000 * 4).toISOString(),
      new Date(Date.now() - 86400000 * 3).toISOString(),
      new Date(Date.now() - 86400000 * 2).toISOString(),
    ],
    aiInsight: 'You code best between 9-11 PM. Try blocking this time!',
  },
  {
    id: 'demo-habit-2',
    userId: 'demo-user-001',
    name: 'Read 30 minutes',
    emoji: '📚',
    frequency: 'daily',
    streak: 3,
    completionLog: [
      new Date(Date.now() - 86400000 * 3).toISOString(),
      new Date(Date.now() - 86400000 * 2).toISOString(),
      new Date(Date.now() - 86400000 * 1).toISOString(),
    ],
    aiInsight: '',
  },
  {
    id: 'demo-habit-3',
    userId: 'demo-user-001',
    name: 'Drink 8 glasses of water',
    emoji: '💧',
    frequency: 'daily',
    streak: 7,
    completionLog: [
      new Date(Date.now() - 86400000 * 7).toISOString(),
      new Date(Date.now() - 86400000 * 6).toISOString(),
      new Date(Date.now() - 86400000 * 5).toISOString(),
      new Date(Date.now() - 86400000 * 4).toISOString(),
      new Date(Date.now() - 86400000 * 3).toISOString(),
      new Date(Date.now() - 86400000 * 2).toISOString(),
      new Date(Date.now() - 86400000 * 1).toISOString(),
    ],
    aiInsight: 'Perfect 7-day streak! 🔥 Keep going!',
  },
]

let nextId = 100

// ---- Tasks ----
export function getDemoTasks(filter) {
  if (filter === 'active') {
    return demoTasks.filter(t => t.status !== 'completed')
  }
  return [...demoTasks]
}

export function addDemoTask(task) {
  const newTask = {
    ...task,
    id: `demo-task-${nextId++}`,
    createdAt: new Date().toISOString(),
  }
  demoTasks.unshift(newTask)
  return newTask
}

export function updateDemoTask(taskId, updates) {
  demoTasks = demoTasks.map(t =>
    t.id === taskId ? { ...t, ...updates } : t
  )
}

// ---- Habits ----
export function getDemoHabits() {
  return [...demoHabits]
}

export function addDemoHabit(habit) {
  const newHabit = {
    ...habit,
    id: `demo-habit-${nextId++}`,
    streak: 0,
    completionLog: [],
  }
  demoHabits.push(newHabit)
  return newHabit
}

export function updateDemoHabit(habitId, updates) {
  demoHabits = demoHabits.map(h =>
    h.id === habitId ? { ...h, ...updates } : h
  )
}

export function deleteDemoHabit(habitId) {
  demoHabits = demoHabits.filter(h => h.id !== habitId)
}
