# 🚀 Vibeship - AI Productivity Companion

## 📖 Overview
Vibeship (Last-Minute Life Saver) is a next-generation productivity and task management platform designed to help students, developers, and professionals beat procrastination. By leveraging the power of **Google Gemini AI**, Vibeship doesn't just store tasks—it actively acts as a personal discipline coach, prioritizing work, parsing natural language into structured plans, and sending background push notifications to ensure deadlines are never missed.

## 🌟 Key Features
- **🧠 AI-Powered Task Parsing:** Type natural language like "I need to study DevOps for 4 hours tomorrow" and Gemini AI automatically extracts the title, calculates priority, sets the deadline, and breaks it into actionable steps.
- **💬 Elite AI Coach (Gemini Flash):** A dedicated AI Chat interface where users can brainstorm, get study plans, and receive motivational guidance from an AI explicitly trained as a discipline coach.
- **⏰ Background Push Notifications (FCM):** Integrates Firebase Cloud Messaging and Service Workers to wake up the user and ring an alarm *even when the website is completely closed*.
- **📊 Advanced Analytics & Habit Tracking:** Tracks daily streaks, task completion rates, and visualizes productivity through interactive charts and calendar views.
- **🔐 Secure Authentication:** End-to-end security using JWT tokens and Firebase Authentication.
- **🎨 Premium UI/UX:** A stunning, modern, glassmorphic dark-mode interface built with TailwindCSS, Framer Motion, and Sonner toast notifications.

## 🛠️ Technology Stack
### Frontend
- **Framework:** React.js (Vite)
- **Styling:** TailwindCSS, Framer Motion (Animations)
- **State Management:** React Context API
- **Notifications:** Service Workers, Firebase Cloud Messaging (FCM)

### Backend
- **Server:** Node.js, Express.js
- **Database:** Firebase Firestore
- **Authentication:** JWT (JSON Web Tokens), Firebase Auth
- **AI Integration:** Google Generative AI SDK (`gemini-2.0-flash`)

### Cloud & Deployment (Google Cloud)
- **Containerization:** Docker
- **Backend Hosting:** Google Cloud Run
- **Push Architecture:** Firebase Cloud Messaging (FCM)

## 🏗️ System Architecture
1. **Client Layer:** The React frontend acts as a Progressive Web App (PWA). It registers a Service Worker (`firebase-messaging-sw.js`) that listens for background pushes from Google's servers.
2. **API Gateway:** The Node/Express backend handles routing, JWT verification, and rate-limiting.
3. **AI Layer:** The backend communicates securely with Google AI Studio to process complex NLP tasks (parsing tasks, prioritizing queues, generating insights) without exposing API keys to the frontend.
4. **Cloud Layer:** Deployed via a Docker container to Google Cloud Run, ensuring highly scalable, serverless execution.

## 🚀 Future Roadmap
- Integration with Google Calendar and Notion APIs.
- Voice-to-Text AI task creation.
- Mobile App release using React Native.
