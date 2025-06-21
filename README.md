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
 FocusGuard-ML/
├── data/ # Collected raw and processed data
├── notebooks/ # Jupyter notebooks for EDA and model training
├── src/ # Core scripts (data collection, feature engineering, modeling)
├── dashboard/ # Streamlit dashboard app
├── README.md # Project overview and instructions
├── requirements.txt # Project dependencies
├── venv/ # Python virtual environment (not tracked by Git)
└── .gitignore # Git ignore file

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
