
# 🛰️ SkyZero - Carbon Emissions Dashboard

A futuristic emissions dashboard to analyze and visualize carbon emissions.

---

## 👨‍💻 Developed by:
SkyZero

---

## ⚙️ Tech Stack:
- Frontend: Vite + TypeScript + TailwindCSS
- Backend: Python Flask
- Deployment: Not deployed — this project runs locally. Instructions below.

---

## 🚀 How to Run the Project

### 1. Backend (Flask)
```bash
# Inside project root:
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt  # Create it if missing

python app.py
# Flask will run on http://localhost:5000
```

### 2. Frontend (Vite + Tailwind)
```bash
npm install
npm run dev
# App runs on http://localhost:5173
```

Make sure Flask is running to enable API calls.

---

## 📁 Folder Structure
```
├── app.py                # Flask API
├── index.html            # App entry
├── src/                  # React components
├── static/, templates/   # Flask assets & HTML
├── node_modules/         # Frontend dependencies
├── package.json          # Frontend config
├── vite.config.ts        # Vite config
```

---

## 📝 Notes
- You must have Python 3, Node.js, and npm installed.
- For full functionality, run both frontend and backend together.


