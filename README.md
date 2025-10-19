# Real-Time AI Voice Assistant

## 🧩 Problem Scenario

People often struggle with technical tasks such as setting up servers, fixing Linux errors, or navigating new software.  
For example:
- A beginner trying to deploy a website on DigitalOcean may not know which options to select or which commands to run.  
- A student learning Linux may get stuck on a simple terminal error and waste hours searching for the fix.  
- Office workers often face problems using new tools like Excel, WordPress, or accounting software, spending excessive time watching tutorials or asking colleagues for help.

Currently, the common solutions—Google searches, YouTube videos, or forum posts—are **time-consuming and non-interactive**.  
Videos cannot adapt their steps based on the user’s current progress, and forum answers often lack context.  
As a result, people **lose productivity and become frustrated** due to the lack of real-time, personalized guidance.

---

## 🎯 Objectives

- Build an **AI assistant** that can guide users in real time by analyzing their screen.  
- Enable **voice-based interaction** so users can keep working hands-free.  
- Optimize bandwidth usage by **streaming only 1–2 frames per second**.  
- Include a **chat interface** for additional clarification during sessions.  
- Allow users to **save and resume sessions** without repeating previous steps.

---

## 💡 Proposed Solution

The platform enables users to share their screen at a low frame rate (1–2 FPS) so the AI can monitor progress efficiently.  
These frames are sent to the backend, where an **AI model analyzes the screen**, detects user actions, and generates **step-by-step guidance**.

The backend communicates with the frontend via **WebSocket** for real-time interaction, and responses are **converted into voice output**, allowing users to continue working without reading.

If the AI fails to understand a screen or if users need additional help:
- They can pause screen sharing.
- Chat directly with the AI.
- The system will **retain context** (goal, steps, and chat history).

Users can **end the session** after completing tasks and **save it** to review or resume later.

---

## ⚙️ Key Features

- 📺 **Screen Sharing** with minimal bandwidth (1–2 FPS).  
- 🤖 **AI-Powered Guidance** based on on-screen content.  
- 🔄 **Real-Time Communication** using WebSocket.  
- 🔊 **Voice Assistance** for hands-free user experience.  
- 💻 **Local Machine Support** for Linux and desktop environments.  
- 💬 **In-Session Chat** for additional explanation.  
- 🧠 **Session Memory** to track goals, changes, and conversations.  
- 📂 **Session History** saving and continuation.

---

## 🧠 Technology Stack

| Component | Technology |
|------------|-------------|
| **Frontend (Desktop App)** | Electron.js |
| **Backend** | Node.js, Express.js, PostgreSQL |
| **AI Integration** | Gemini (Free Tier) |
| **Screen Sharing** | WebRTC |
| **Real-Time Communication** | WebSocket |
| **Voice Output** | Browser/Electron-based Text-to-Speech |

---

## 🚀 Summary

This project aims to create an **interactive AI assistant** capable of providing **real-time, voice-guided help** based on what users are doing on their screens.  
By combining **AI analysis**, **low-latency communication**, and **voice interaction**, the system can significantly improve **learning efficiency**, **task completion speed**, and **user experience** in both educational and professional environments.
