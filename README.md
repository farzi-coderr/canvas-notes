# 📝 Sticky Notes App - Complete Deployment Guide

A beautiful, interactive sticky notes application with a React frontend and Python backend.

![Sticky Notes App](https://img.shields.io/badge/Status-Ready%20to%20Deploy-brightgreen)

---

## 📋 Table of Contents

1. [What You'll Need](#-what-youll-need)
2. [Understanding the Project](#-understanding-the-project)
3. [Part 1: Setting Up the Backend (Python + SQLite)](#-part-1-setting-up-the-backend-python--sqlite)
4. [Part 2: Setting Up the Frontend (React)](#-part-2-setting-up-the-frontend-react)
5. [Part 3: Connecting Frontend to Backend](#-part-3-connecting-frontend-to-backend)
6. [Part 4: Deploying to the Cloud](#-part-4-deploying-to-the-cloud)
7. [Troubleshooting](#-troubleshooting)
8. [Frequently Asked Questions](#-frequently-asked-questions)

---

## 🛠 What You'll Need

Before starting, you need to install some software on your computer. Don't worry - we'll guide you through each step!

### Required Software

| Software | What it does | Download Link |
|----------|--------------|---------------|
| **Python 3.10+** | Runs the backend server | [Download Python](https://www.python.org/downloads/) |
| **Node.js 18+** | Runs the frontend | [Download Node.js](https://nodejs.org/) |
| **Git** | Downloads code from the internet | [Download Git](https://git-scm.com/downloads) |
| **VS Code** (Optional) | Code editor for viewing files | [Download VS Code](https://code.visualstudio.com/) |

### How to Check if Software is Installed

Open your **Terminal** (Mac/Linux) or **Command Prompt** (Windows) and type these commands:

```bash
# Check Python version (should show 3.10 or higher)
python --version

# Check Node.js version (should show 18 or higher)
node --version

# Check Git version
git --version
```

> 💡 **Windows Users**: If `python` doesn't work, try `python3` or `py` instead.

---

## 📚 Understanding the Project

This project has **two parts** that work together:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   YOUR BROWSER                         YOUR COMPUTER        │
│                                                             │
│   ┌─────────────┐                    ┌─────────────────┐   │
│   │             │   ←── Data ──→     │    Backend      │   │
│   │  Frontend   │                    │   (Python)      │   │
│   │  (React)    │                    │                 │   │
│   │             │                    │   ┌──────────┐  │   │
│   │  What you   │                    │   │ Database │  │   │
│   │    see      │                    │   │ (SQLite) │  │   │
│   └─────────────┘                    │   └──────────┘  │   │
│                                      └─────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- **Frontend (React)**: The visual part you interact with - runs on port `5173`
- **Backend (Python)**: Handles saving/loading notes - runs on port `8000`
- **Database (SQLite)**: A file that stores all your notes permanently

---

## 🐍 Part 1: Setting Up the Backend (Python + SQLite)

The backend is a Python server that stores your notes in a database.

### Step 1.1: Create the Backend Folder

Open your Terminal/Command Prompt and run these commands one by one:

```bash
# Create a new folder for the backend
mkdir sticky-notes-backend

# Go into that folder
cd sticky-notes-backend
```

### Step 1.2: Create a Virtual Environment

A virtual environment keeps this project's code separate from other Python projects.

**On Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows (Command Prompt):**
```bash
python -m venv venv
venv\Scripts\activate
```

**On Windows (PowerShell):**
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
```

> ✅ **Success Check**: You should see `(venv)` at the beginning of your command line.

### Step 1.3: Create the Required Files

You need to create 4 files. You can use any text editor (Notepad, VS Code, etc.)

---

#### File 1: `requirements.txt`

Create a file named `requirements.txt` and paste this content:

```
fastapi==0.109.0
uvicorn==0.27.0
pydantic==2.5.3
```

---

#### File 2: `database.py`

Create a file named `database.py` and paste this content:

```python
import sqlite3
from contextlib import contextmanager

DB_PATH = "notes.db"

def init_db():
    """Creates the database table if it doesn't exist."""
    with get_db() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT DEFAULT '',
                content TEXT DEFAULT '',
                x REAL DEFAULT 100,
                y REAL DEFAULT 100,
                width REAL DEFAULT 240,
                height REAL DEFAULT 180,
                color TEXT DEFAULT 'yellow',
                created_at INTEGER,
                updated_at INTEGER
            )
        ''')
    print("✅ Database initialized successfully!")

@contextmanager
def get_db():
    """Opens a connection to the database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
```

---

#### File 3: `models.py`

Create a file named `models.py` and paste this content:

```python
from pydantic import BaseModel
from typing import Optional

class NoteCreate(BaseModel):
    """Data structure for creating a new note."""
    id: str
    title: str = ""
    content: str = ""
    x: float = 100
    y: float = 100
    width: float = 240
    height: float = 180
    color: str = "yellow"
    createdAt: int
    updatedAt: int

class NoteUpdate(BaseModel):
    """Data structure for updating an existing note."""
    title: Optional[str] = None
    content: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    color: Optional[str] = None
```

---

#### File 4: `main.py`

Create a file named `main.py` and paste this content:

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_db
from models import NoteCreate, NoteUpdate
import time

# Create the application
app = FastAPI(
    title="Sticky Notes API",
    description="Backend API for the Sticky Notes application",
    version="1.0.0"
)

# Allow the frontend to connect (CORS settings)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    """Runs when the server starts."""
    print("🚀 Starting Sticky Notes Backend...")
    init_db()
    print("🎉 Server is ready!")

@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "running", "message": "Sticky Notes API is online!"}

@app.get("/api/notes")
def get_notes():
    """Get all notes from the database."""
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM notes ORDER BY updated_at DESC").fetchall()
        return [dict(row) for row in rows]

@app.post("/api/notes")
def create_note(note: NoteCreate):
    """Create a new note."""
    with get_db() as conn:
        conn.execute('''
            INSERT INTO notes (id, title, content, x, y, width, height, color, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (note.id, note.title, note.content, note.x, note.y, 
              note.width, note.height, note.color, note.createdAt, note.updatedAt))
    print(f"📝 Created note: {note.id}")
    return {"status": "created", "id": note.id}

@app.patch("/api/notes/{note_id}")
def update_note(note_id: str, updates: NoteUpdate):
    """Update an existing note."""
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Note not found")
        
        update_fields = {k: v for k, v in updates.dict().items() if v is not None}
        if update_fields:
            update_fields["updated_at"] = int(time.time() * 1000)
            set_clause = ", ".join(f"{k} = ?" for k in update_fields)
            conn.execute(f"UPDATE notes SET {set_clause} WHERE id = ?", 
                        (*update_fields.values(), note_id))
    print(f"✏️ Updated note: {note_id}")
    return {"status": "updated"}

@app.delete("/api/notes/{note_id}")
def delete_note(note_id: str):
    """Delete a note."""
    with get_db() as conn:
        conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    print(f"🗑️ Deleted note: {note_id}")
    return {"status": "deleted"}

# Run the server
if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("🌐 Starting server at http://localhost:8000")
    print("📚 API docs available at http://localhost:8000/docs")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

### Step 1.4: Your Backend Folder Should Look Like This

```
sticky-notes-backend/
├── venv/              # Virtual environment (folder)
├── database.py        # Database connection code
├── main.py            # Main server code
├── models.py          # Data structures
└── requirements.txt   # List of dependencies
```

### Step 1.5: Install Dependencies

Make sure you're in the `sticky-notes-backend` folder with the virtual environment activated, then run:

```bash
pip install -r requirements.txt
```

> ✅ **Success Check**: You should see messages about packages being installed.

### Step 1.6: Start the Backend Server

```bash
python main.py
```

> ✅ **Success Check**: You should see:
> ```
> 🚀 Starting Sticky Notes Backend...
> ✅ Database initialized successfully!
> 🎉 Server is ready!
> 🌐 Starting server at http://localhost:8000
> ```

### Step 1.7: Test the Backend

Open your web browser and go to:
- **http://localhost:8000** - Should show `{"status": "running", "message": "Sticky Notes API is online!"}`
- **http://localhost:8000/docs** - Interactive API documentation

> 🎉 **Congratulations!** Your backend is running!

> ⚠️ **Keep this terminal window open!** The backend needs to keep running.

---

## ⚛️ Part 2: Setting Up the Frontend (React)

The frontend is the visual part of the app that you see in your browser.

### Step 2.1: Download the Frontend Code

Open a **new** Terminal/Command Prompt window (keep the backend running!) and run:

```bash
# Clone the repository (replace with your actual repo URL)
git clone <YOUR_REPOSITORY_URL> sticky-notes-frontend

# Go into the folder
cd sticky-notes-frontend

# Install dependencies
npm install
```

> 💡 **Note**: Replace `<YOUR_REPOSITORY_URL>` with the actual URL of your GitHub repository.

### Step 2.2: Start the Frontend

```bash
npm run dev
```

> ✅ **Success Check**: You should see:
> ```
>   VITE v5.x.x  ready in xxx ms
>
>   ➜  Local:   http://localhost:5173/
> ```

### Step 2.3: Open the App

Open your web browser and go to **http://localhost:5173**

> 🎉 **Congratulations!** Your app should now be working!

---

## 🔌 Part 3: Connecting Frontend to Backend

The frontend is already configured to connect to `http://localhost:8000/api`. 

### Verify the Connection

1. Make sure the **backend is running** (Terminal 1: `python main.py`)
2. Make sure the **frontend is running** (Terminal 2: `npm run dev`)
3. Open **http://localhost:5173** in your browser
4. Try creating a new note by double-clicking on the canvas
5. Refresh the page - your note should still be there!

### If Notes Don't Save

If you see an error message about connecting to the backend:
1. Check that the backend is running in Terminal 1
2. Check that you can access http://localhost:8000/docs
3. Make sure no firewall is blocking port 8000

---

## ☁️ Part 4: Deploying to the Cloud

Once everything works locally, you can deploy to the cloud so others can access your app.

### Option A: Deploy Backend to Railway (Free Tier Available)

Railway is a simple platform that can run your Python backend.

#### Step A.1: Create a Railway Account

1. Go to [railway.app](https://railway.app/)
2. Sign up with your GitHub account

#### Step A.2: Prepare Your Backend for Railway

Add this file to your `sticky-notes-backend` folder:

**`Procfile`** (no file extension):
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

**`runtime.txt`**:
```
python-3.11.4
```

#### Step A.3: Push to GitHub

```bash
# Initialize git in your backend folder
git init

# Add all files
git add .

# Commit
git commit -m "Initial backend"

# Create a new repository on GitHub, then:
git remote add origin <YOUR_BACKEND_REPO_URL>
git push -u origin main
```

#### Step A.4: Deploy on Railway

1. Go to [railway.app](https://railway.app/) dashboard
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your backend repository
4. Railway will automatically detect it's a Python project
5. Wait for deployment to complete
6. Click on your deployment → "Settings" → "Generate Domain"
7. Copy your backend URL (e.g., `https://your-app.railway.app`)

---

### Option B: Deploy Backend to Render (Free Tier Available)

#### Step B.1: Create a Render Account

1. Go to [render.com](https://render.com/)
2. Sign up with your GitHub account

#### Step B.2: Create New Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `sticky-notes-backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Click "Create Web Service"
5. Copy your backend URL (e.g., `https://sticky-notes-backend.onrender.com`)

---

### Option C: Deploy Frontend to Vercel (Free)

#### Step C.1: Update Frontend API URL

Before deploying, update the frontend to use your deployed backend URL.

Edit `src/hooks/useNotes.ts` and change:
```typescript
// Change this:
const API_URL = 'http://localhost:8000/api';

// To your deployed backend URL:
const API_URL = 'https://your-backend-url.railway.app/api';
```

#### Step C.2: Push Frontend to GitHub

```bash
git add .
git commit -m "Update API URL for production"
git push
```

#### Step C.3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com/)
2. Sign up with your GitHub account
3. Click "Add New..." → "Project"
4. Import your frontend repository
5. Vercel will auto-detect it's a Vite project
6. Click "Deploy"
7. Your app will be live at `https://your-app.vercel.app`

---

### Option D: Deploy Everything Locally (Self-Hosted)

If you want to run everything on your own computer/server:

#### Using Docker (Recommended for Servers)

Create this `docker-compose.yml` in a new folder:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./sticky-notes-backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  frontend:
    build:
      context: ./sticky-notes-frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

Create `sticky-notes-backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/data

# Use data directory for database
ENV DB_PATH=/app/data/notes.db

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `sticky-notes-frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Then run:
```bash
docker-compose up -d
```

---

## 🔧 Troubleshooting

### Problem: "Python is not recognized"

**Solution**: Python isn't installed or not in your PATH.
- Reinstall Python from [python.org](https://www.python.org/downloads/)
- During installation, check "Add Python to PATH"

### Problem: "npm is not recognized"

**Solution**: Node.js isn't installed or not in your PATH.
- Reinstall Node.js from [nodejs.org](https://nodejs.org/)
- Restart your terminal after installation

### Problem: "Port 8000 is already in use"

**Solution**: Something else is using port 8000.
```bash
# On Mac/Linux, find and kill the process:
lsof -i :8000
kill -9 <PID>

# On Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Problem: "CORS error" in browser console

**Solution**: The backend isn't allowing requests from your frontend.
- Make sure the backend is running
- Check that `allow_origins=["*"]` is in `main.py`

### Problem: Notes disappear after refresh

**Solution**: The frontend can't connect to the backend.
- Make sure the backend is running (`python main.py`)
- Check the browser console for errors
- Verify http://localhost:8000/docs is accessible

### Problem: "ModuleNotFoundError"

**Solution**: Dependencies aren't installed.
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # Mac/Linux
# or
venv\Scripts\activate  # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

---

## ❓ Frequently Asked Questions

### Q: Can I use a different database instead of SQLite?

**A:** Yes! SQLite is great for getting started, but for production you might want PostgreSQL or MySQL. You would need to modify `database.py` to use a different database connector.

### Q: How do I back up my notes?

**A:** The notes are stored in `notes.db` file in your backend folder. Simply copy this file to back up all your notes.

### Q: Can multiple people use this app?

**A:** Yes, but all users will share the same notes. To have separate notes per user, you would need to add user authentication.

### Q: How do I update the app?

**A:** Pull the latest code and restart the servers:
```bash
git pull
npm install  # for frontend
pip install -r requirements.txt  # for backend
```

### Q: The app is slow. How do I speed it up?

**A:** 
- Make sure you're using production builds (`npm run build`)
- Consider using a CDN for static assets
- For the backend, consider using a production-grade database like PostgreSQL

---

## 🎉 You Did It!

Congratulations on deploying your Sticky Notes app! Here's what you've accomplished:

- ✅ Set up a Python backend server
- ✅ Created a SQLite database
- ✅ Connected a React frontend
- ✅ Learned how to deploy to the cloud

---

## 📞 Need Help?

If you're stuck, here are some resources:

- **FastAPI Documentation**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com/)
- **React Documentation**: [react.dev](https://react.dev/)
- **Vite Documentation**: [vitejs.dev](https://vitejs.dev/)

---

Made with ❤️ using Lovable
