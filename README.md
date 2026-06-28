<div align="center">
  
# 🚀 The Last-Minute Life Saver

**Vibe2Ship Hackathon 2026 Submission**

Your AI-powered productivity companion that doesn't just remind you — it **plans, prioritizes, and guides** you to completion using the power of Google Gemini.

[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini%202.0-8E75FF?style=for-the-badge&logo=googlebard&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/firebase-a08021?style=for-the-badge&logo=firebase&logoColor=ffcd34)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)

</div>

---

## 🎯 Problem Statement Selected
**Problem Statement 1**

*88% of professionals miss at least one deadline per month, wasting an average of 3.2 hours a day on unplanned, unprioritized tasks.*
Current productivity tools act as passive dumping grounds for tasks. A buzzing notification doesn't help you actually complete the task, and seeing a massive list of "urgent" items only leads to decision fatigue and procrastination. 

## 💡 Solution Overview
**The Last-Minute Life Saver** is an intelligent, context-aware productivity engine. Instead of just storing your tasks, it acts as an autonomous project manager:
1. **Intelligent Prioritization:** It analyzes your deadlines, task complexity, and work history to score and rank tasks (0-100) in real-time.
2. **Auto Action Plans:** It breaks down overwhelming tasks into 5-7 actionable micro-steps with accurate time estimates.
3. **Smart Scheduling & Reminders:** It calculates the exact optimal time to remind you based on task urgency and your personal habits.

It shifts the paradigm from *passive reminders* to **active AI-driven execution**.

## ✨ Key Features
* 🧠 **AI Priority Engine:** Real-time urgency scoring via Gemini based on multiple parameters.
* 📋 **Auto Action Plans:** Gemini dynamically breaks down complex tasks into bite-sized, achievable JSON-structured steps.
* 🎙️ **Voice-to-Task:** Web Speech API captures your voice, and Gemini NLP extracts the task, deadline, and priority automatically.
* 💬 **AI Chat Assistant:** Full context-aware conversation. Ask *"What should I do now?"* and Gemini adapts to your current state.
* 🔔 **Smart Reminder Engine:** Calculates optimal ping times rather than just triggering at a fixed hour.
* 🏆 **Gamified Productivity:** Earn XP, build streaks, and unlock achievements to make productivity addictive.

## 🛠️ Technologies Used
* **Frontend:** React.js, Vite, Tailwind CSS, Framer Motion, Zustand
* **Backend:** Node.js, Express.js
* **Database & Auth:** Firebase Firestore, Firebase Authentication
* **APIs:** Web Speech API, Google Calendar API (planned)

## 🌐 Google Technologies Utilized
This project leans heavily into the Google ecosystem to provide state-of-the-art AI capabilities and robust infrastructure:
* **Google Gemini 2.0 Flash:** Powers the core AI Priority Engine, Action Plan Generator, and Chat Assistant. Utilized heavily for rapid text analysis and structured JSON outputs.
* **Google AI Studio:** Used for prompt engineering, testing, and generating the optimal system instructions for our AI agent.
* **Firebase Authentication:** Handles secure user onboarding via Google OAuth 2.0.
* **Firebase Firestore:** Real-time NoSQL database syncing tasks, habits, and user profiles across devices.
* **Firebase Hosting & Google Cloud Run:** (Deployment infrastructure).

## 🚀 Getting Started (Local Development)

### Prerequisites
* Node.js (v18+)
* Firebase Project
* Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KrishnaSharma1012/last-minute-life-saver.git
   cd vibeship
   ```

2. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   # Create a .env file and add your Firebase config & Gemini API key
   npm run dev
   ```

3. **Setup Backend**
   ```bash
   cd backend
   npm install
   # Create a .env file with required credentials
   npm start
   ```

## 📸 Screenshots

*(Add screenshots of the Dashboard, AI Chat, and Task Input here before submission)*
