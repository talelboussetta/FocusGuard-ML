# FocusGuard-ML 🔍🧠

**AI-powered Desktop App to Detect and Improve Digital Focus**

## 💡 Overview

FocusGuard is a machine learning-powered tool that monitors behavioral data — like webcam feed, typing, and screen usage — to estimate user focus levels and provide smart nudges for better productivity and mental wellness.

## 🎯 Features

- Real-time webcam monitoring (face detection, eye activity)
- Keyboard and mouse activity logging
- Machine Learning model to classify focus vs distraction
- Visual dashboards for trends and analytics
- Smart reminders and notifications to improve focus

## 🛠️ Tech Stack

- Python
- OpenCV (webcam processing)
- `pynput` (keyboard/mouse tracking)
- Scikit-learn / XGBoost (ML models)
- Streamlit (dashboard app)
- Matplotlib / Plotly (visualizations)

## 📁 Project Structure
project-root/
│
├── front/                     # Frontend application (React, Vue, etc.)  
│   ├── public/                # Static assets (index.html, favicon, etc.)  
│   ├── src/                   # Source code for frontend  
│   │   ├── components/        # React components or Vue components  
│   │   ├── pages/             # Pages or views  
│   │   ├── hooks/             # Custom React hooks (if any)  
│   │   ├── services/          # API calls and services  
│   │   ├── styles/            # CSS or styling files  
│   │   ├── App.js             # Main app component  
│   │   └── index.js           # Entry point  
│   ├── .env                   # Frontend environment variables (optional)  
│   ├── package.json           # Frontend dependencies and scripts  
│   └── README.md              # Frontend specific instructions (optional)  
│
├── serv/                      # Backend server (Node.js, Python Flask, etc.)  
│   ├── app.py / index.js      # Main backend entry point  
│   ├── routes/                # API route handlers  
│   ├── controllers/           # Controller logic (optional, if using MVC)  
│   ├── services/              # Business logic / external API integration  
│   ├── models/                # Database models (if any)  
│   ├── config.py / config.js  # Configuration file to manage environment variables  
│   ├── .env                   # Backend environment variables (API keys, secrets)  
│   ├── requirements.txt / package.json  # Backend dependencies  
│   ├── README.md              # Backend specific instructions (optional)  
│   └── utils/                 # Utility functions/helpers  
│
├── .gitignore                 # Files and folders to ignore in Git  
├── README.md                  # Project overview and main instructions  
└── LICENSE                    # License file (if any)  


## ✅ Goals (v1.0)

- Build reliable data collection (webcam + keyboard/mouse)
- Store timestamped activity logs for analysis
- Train ML model to detect focus vs distraction
- Create live dashboard to visualize focus scores
- Implement reminder feature to improve user focus

## 🚀 Motivation

Built to help remote workers, students, and developers regain their focus in a digital world full of distractions.

---

Let’s focus better, one session at a time. 🔬🧠
