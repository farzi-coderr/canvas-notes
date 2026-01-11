# 📝 Sticky Notes App - Complete Deployment Guide

A full-stack sticky notes application with user authentication, built with React (frontend) and Python/FastAPI (backend).

> **For Non-Developers:** This guide is written step-by-step. If you follow each step exactly, you will have a working app!

---

## 📑 Table of Contents

1. [What You'll Need](#-what-youll-need)
2. [Understanding the Project](#-understanding-the-project)
3. [Part 1: Setting Up the Backend](#-part-1-setting-up-the-backend-python--sqlite)
4. [Part 2: Setting Up the Frontend](#-part-2-setting-up-the-frontend-react)
5. [Part 3: Testing Your App](#-part-3-testing-your-app)
6. [Part 4: Google OAuth Setup (Optional)](#-part-4-google-oauth-setup-optional)
7. [Part 5: Deploying to the Cloud](#-part-5-deploying-to-the-cloud)
8. [Troubleshooting](#-troubleshooting)
9. [FAQ](#-frequently-asked-questions)

---

## 🛠 What You'll Need

Before starting, you need to install these programs on your computer:

### 1. Python (version 3.8 or higher)
- **Download:** https://www.python.org/downloads/
- **Important:** During installation, check the box that says "Add Python to PATH"
- **Verify installation:** Open Terminal/Command Prompt and type:
  ```bash
  python --version
  ```
  You should see something like `Python 3.11.5`

### 2. Node.js (version 18 or higher)
- **Download:** https://nodejs.org/ (choose the LTS version)
- **Verify installation:**
  ```bash
  node --version
  npm --version
  ```

### 3. Git
- **Download:** https://git-scm.com/downloads
- **Verify installation:**
  ```bash
  git --version
  ```

---

## 🧩 Understanding the Project

This app has three main parts:

| Component | Technology | What It Does |
|-----------|-----------|--------------|
| **Frontend** | React + TypeScript | The website you see and interact with |
| **Backend** | Python + FastAPI | Handles login, saves notes, talks to database |
| **Database** | SQLite | Stores all user accounts and notes |

**How they work together:**
```
[Your Browser] ←→ [Frontend :5173] ←→ [Backend :8000] ←→ [SQLite Database]
```

---

## 🐍 Part 1: Setting Up the Backend (Python + SQLite)

### Step 1.1: Create the Backend Folder

Open your Terminal (Mac/Linux) or Command Prompt (Windows):

```bash
# Create a new folder for the backend
mkdir sticky-notes-backend
cd sticky-notes-backend
```

### Step 1.2: Create a Virtual Environment

A virtual environment keeps your project's packages separate from other Python projects.

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**On Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You'll see `(venv)` at the start of your terminal line when activated.

### Step 1.3: Create requirements.txt

Create a file named `requirements.txt` with this content:

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
httpx==0.26.0
pydantic==2.5.3
pydantic-settings==2.1.0
```

Install the packages:
```bash
pip install -r requirements.txt
```

### Step 1.4: Create config.py

This file stores your configuration. Create `config.py`:

```python
"""
Configuration settings for the Sticky Notes API.

IMPORTANT FOR DEPLOYMENT:
- Change JWT_SECRET to a long, random string in production
- Set FRONTEND_URL to your deployed frontend URL
- Set GOOGLE_* variables only if using Google OAuth
"""

import os
from typing import Optional

# =============================================================================
# JWT AUTHENTICATION SETTINGS
# =============================================================================
# CRITICAL: Change this to a long, random string in production!
# Generate one with: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET: str = os.getenv("JWT_SECRET", "your-super-secret-key-change-in-production-minimum-32-chars")
JWT_ALGORITHM: str = "HS256"
JWT_EXPIRATION_HOURS: int = 24 * 7  # Token valid for 7 days

# =============================================================================
# CORS SETTINGS
# =============================================================================
# The URL where your frontend is running
# For local development: http://localhost:5173
# For production: https://your-frontend-domain.vercel.app
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

# =============================================================================
# GOOGLE OAUTH SETTINGS (Optional)
# =============================================================================
# Leave empty if not using Google OAuth
# Get these from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET", "")

# =============================================================================
# DATABASE SETTINGS
# =============================================================================
DATABASE_PATH: str = os.getenv("DATABASE_PATH", "sticky_notes.db")
```

### Step 1.5: Create database.py

This file sets up the SQLite database. Create `database.py`:

```python
"""
Database initialization and connection management.
Creates tables for users and notes with proper relationships.
"""

import sqlite3
import os
from config import DATABASE_PATH


def get_db_connection():
    """Get a connection to the SQLite database."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    conn.execute("PRAGMA foreign_keys = ON")  # Enable foreign key support
    return conn


def init_db():
    """Initialize the database with required tables."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            google_id TEXT UNIQUE,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    
    # Create index on email for faster lookups
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    """)
    
    # Create index on google_id for faster OAuth lookups
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)
    """)
    
    # Create notes table with user_id foreign key
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT DEFAULT '',
            content TEXT DEFAULT '',
            x REAL NOT NULL DEFAULT 100,
            y REAL NOT NULL DEFAULT 100,
            width REAL NOT NULL DEFAULT 240,
            height REAL NOT NULL DEFAULT 180,
            color TEXT NOT NULL DEFAULT 'yellow',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Create index on user_id for faster note lookups
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)
    """)
    
    conn.commit()
    conn.close()
    print("✅ Database initialized successfully!")


# Initialize database when this module is imported
if __name__ == "__main__":
    init_db()
```

### Step 1.6: Create models.py

This file defines the data structures. Create `models.py`:

```python
"""
Pydantic models for request/response validation.
These ensure data is properly formatted before processing.
"""

from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import re


# =============================================================================
# USER MODELS
# =============================================================================

class UserSignup(BaseModel):
    """Request model for user registration."""
    email: EmailStr
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Ensure password meets security requirements."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v


class UserLogin(BaseModel):
    """Request model for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Response model for user data (excludes sensitive info)."""
    id: str
    email: str


class Token(BaseModel):
    """Response model for authentication token."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# =============================================================================
# NOTE MODELS
# =============================================================================

class NoteCreate(BaseModel):
    """Request model for creating a new note."""
    id: Optional[str] = None
    title: str = ""
    content: str = ""
    x: float = 100
    y: float = 100
    width: float = 240
    height: float = 180
    color: str = "yellow"
    createdAt: Optional[int] = None
    updatedAt: Optional[int] = None


class NoteUpdate(BaseModel):
    """Request model for updating an existing note."""
    title: Optional[str] = None
    content: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    color: Optional[str] = None


class NoteResponse(BaseModel):
    """Response model for a note."""
    id: str
    user_id: str
    title: str
    content: str
    x: float
    y: float
    width: float
    height: float
    color: str
    created_at: str
    updated_at: str
```

### Step 1.7: Create auth.py

This file handles all authentication logic. Create `auth.py`:

```python
"""
Authentication utilities for JWT and password handling.
Provides secure password hashing and token generation/validation.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS
from database import get_db_connection
from models import UserResponse

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bearer token security
security = HTTPBearer()


# =============================================================================
# PASSWORD UTILITIES
# =============================================================================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


# =============================================================================
# JWT UTILITIES
# =============================================================================

def create_access_token(user_id: str, email: str) -> str:
    """
    Create a JWT access token.
    
    Args:
        user_id: The user's unique identifier
        email: The user's email address
    
    Returns:
        Encoded JWT token string
    """
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT token.
    
    Args:
        token: The JWT token string
    
    Returns:
        Decoded payload dict or None if invalid
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


# =============================================================================
# USER OPERATIONS
# =============================================================================

def create_user(email: str, password: str) -> dict:
    """
    Create a new user with hashed password.
    
    Args:
        email: User's email address
        password: Plain text password (will be hashed)
    
    Returns:
        Dict with user data
    
    Raises:
        ValueError: If email already exists
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user already exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise ValueError("Email already registered")
    
    # Create new user
    user_id = str(uuid.uuid4())
    password_hash = hash_password(password)
    
    cursor.execute(
        "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
        (user_id, email, password_hash)
    )
    conn.commit()
    conn.close()
    
    return {"id": user_id, "email": email}


def authenticate_user(email: str, password: str) -> Optional[dict]:
    """
    Authenticate a user by email and password.
    
    Args:
        email: User's email address
        password: Plain text password to verify
    
    Returns:
        User dict if credentials valid, None otherwise
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, email, password_hash FROM users WHERE email = ?",
        (email,)
    )
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    if not row["password_hash"]:
        # User registered with OAuth, no password set
        return None
    
    if not verify_password(password, row["password_hash"]):
        return None
    
    return {"id": row["id"], "email": row["email"]}


def get_user_by_id(user_id: str) -> Optional[dict]:
    """Get user by their ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, email FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    return {"id": row["id"], "email": row["email"]}


def get_or_create_google_user(google_id: str, email: str) -> dict:
    """
    Get existing Google user or create new one.
    
    Args:
        google_id: Google's unique user identifier
        email: User's email from Google
    
    Returns:
        User dict
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user exists by google_id
    cursor.execute(
        "SELECT id, email FROM users WHERE google_id = ?",
        (google_id,)
    )
    row = cursor.fetchone()
    
    if row:
        conn.close()
        return {"id": row["id"], "email": row["email"]}
    
    # Check if user exists by email (might have registered with password first)
    cursor.execute("SELECT id, email FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    
    if row:
        # Link Google account to existing user
        cursor.execute(
            "UPDATE users SET google_id = ? WHERE id = ?",
            (google_id, row["id"])
        )
        conn.commit()
        conn.close()
        return {"id": row["id"], "email": row["email"]}
    
    # Create new user
    user_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO users (id, email, google_id) VALUES (?, ?, ?)",
        (user_id, email, google_id)
    )
    conn.commit()
    conn.close()
    
    return {"id": user_id, "email": email}


# =============================================================================
# FASTAPI DEPENDENCIES
# =============================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserResponse:
    """
    FastAPI dependency to get the current authenticated user.
    
    Usage in route:
        @app.get("/protected")
        def protected_route(user: UserResponse = Depends(get_current_user)):
            return {"user_id": user.id}
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise credentials_exception
    
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = get_user_by_id(user_id)
    if user is None:
        raise credentials_exception
    
    return UserResponse(id=user["id"], email=user["email"])
```

### Step 1.8: Create main.py

This is the main application file. Create `main.py`:

```python
"""
Sticky Notes API - Main Application

A FastAPI backend for the Sticky Notes app with:
- Email/password authentication
- Google OAuth support
- JWT token-based sessions
- SQLite database storage
- Per-user note isolation

Run with: uvicorn main:app --reload
"""

import uuid
from datetime import datetime
from typing import List
from urllib.parse import urlencode

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import httpx

from config import (
    FRONTEND_URL, 
    GOOGLE_CLIENT_ID, 
    GOOGLE_CLIENT_SECRET,
)
from database import get_db_connection, init_db
from models import (
    UserSignup, 
    UserLogin, 
    UserResponse, 
    Token,
    NoteCreate, 
    NoteUpdate, 
    NoteResponse,
)
from auth import (
    create_user, 
    authenticate_user, 
    create_access_token,
    get_current_user,
    get_or_create_google_user,
)

# =============================================================================
# APP INITIALIZATION
# =============================================================================

app = FastAPI(
    title="Sticky Notes API",
    description="Backend API for the Sticky Notes application",
    version="1.0.0",
)

# Initialize database on startup
@app.on_event("startup")
def startup():
    init_db()

# CORS configuration - allows frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/", tags=["Health"])
def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Sticky Notes API is running!"}


@app.get("/health", tags=["Health"])
def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",
        "version": "1.0.0"
    }


# =============================================================================
# AUTHENTICATION ENDPOINTS
# =============================================================================

@app.post("/auth/signup", response_model=Token, tags=["Authentication"])
def signup(user_data: UserSignup):
    """
    Register a new user account.
    
    - **email**: Valid email address (must be unique)
    - **password**: Min 8 chars, 1 number, 1 uppercase letter
    
    Returns JWT token on success.
    """
    try:
        user = create_user(user_data.email, user_data.password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    access_token = create_access_token(user["id"], user["email"])
    
    return Token(
        access_token=access_token,
        user=UserResponse(id=user["id"], email=user["email"])
    )


@app.post("/auth/login", response_model=Token, tags=["Authentication"])
def login(user_data: UserLogin):
    """
    Login with email and password.
    
    Returns JWT token on success.
    """
    user = authenticate_user(user_data.email, user_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(user["id"], user["email"])
    
    return Token(
        access_token=access_token,
        user=UserResponse(id=user["id"], email=user["email"])
    )


@app.get("/auth/me", response_model=UserResponse, tags=["Authentication"])
def get_me(current_user: UserResponse = Depends(get_current_user)):
    """
    Get current authenticated user's info.
    
    Requires valid JWT token in Authorization header.
    """
    return current_user


# =============================================================================
# GOOGLE OAUTH ENDPOINTS
# =============================================================================

@app.get("/auth/google", tags=["Authentication"])
def google_login():
    """
    Initiate Google OAuth flow.
    
    Redirects user to Google's login page.
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
        )
    
    # Build Google OAuth URL
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": f"{FRONTEND_URL.rstrip('/')}/auth/callback",
        "response_type": "code",
        "scope": "email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    
    # Note: We redirect to Google, which then redirects to frontend callback
    google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url=google_auth_url)


@app.get("/auth/google/callback", tags=["Authentication"])
async def google_callback(code: str):
    """
    Handle Google OAuth callback.
    
    Exchanges authorization code for tokens, creates/gets user,
    and redirects to frontend with JWT token.
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth not configured"
        )
    
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": f"{FRONTEND_URL.rstrip('/')}/auth/callback",
                "grant_type": "authorization_code",
            },
        )
    
    if token_response.status_code != 200:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/auth/callback?error=token_exchange_failed"
        )
    
    token_data = token_response.json()
    access_token = token_data.get("access_token")
    
    # Get user info from Google
    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    
    if user_response.status_code != 200:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/auth/callback?error=user_info_failed"
        )
    
    user_info = user_response.json()
    google_id = user_info["id"]
    email = user_info["email"]
    
    # Create or get user
    user = get_or_create_google_user(google_id, email)
    
    # Create our JWT token
    jwt_token = create_access_token(user["id"], user["email"])
    
    # Redirect to frontend with token
    return RedirectResponse(
        url=f"{FRONTEND_URL}/auth/callback?token={jwt_token}"
    )


# =============================================================================
# NOTES ENDPOINTS (Protected)
# =============================================================================

@app.get("/api/notes", response_model=List[NoteResponse], tags=["Notes"])
def get_notes(current_user: UserResponse = Depends(get_current_user)):
    """
    Get all notes for the current user.
    
    Notes are isolated per user - you can only see your own notes.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        """
        SELECT id, user_id, title, content, x, y, width, height, color, 
               created_at, updated_at 
        FROM notes 
        WHERE user_id = ?
        ORDER BY updated_at DESC
        """,
        (current_user.id,)
    )
    
    rows = cursor.fetchall()
    conn.close()
    
    return [
        NoteResponse(
            id=row["id"],
            user_id=row["user_id"],
            title=row["title"],
            content=row["content"],
            x=row["x"],
            y=row["y"],
            width=row["width"],
            height=row["height"],
            color=row["color"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
        for row in rows
    ]


@app.post("/api/notes", response_model=NoteResponse, tags=["Notes"])
def create_note(
    note: NoteCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Create a new note for the current user.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    note_id = note.id or str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    cursor.execute(
        """
        INSERT INTO notes (id, user_id, title, content, x, y, width, height, color, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            note_id,
            current_user.id,
            note.title,
            note.content,
            note.x,
            note.y,
            note.width,
            note.height,
            note.color,
            now,
            now,
        )
    )
    conn.commit()
    
    # Fetch the created note
    cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
    row = cursor.fetchone()
    conn.close()
    
    return NoteResponse(
        id=row["id"],
        user_id=row["user_id"],
        title=row["title"],
        content=row["content"],
        x=row["x"],
        y=row["y"],
        width=row["width"],
        height=row["height"],
        color=row["color"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@app.patch("/api/notes/{note_id}", response_model=NoteResponse, tags=["Notes"])
def update_note(
    note_id: str,
    updates: NoteUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Update an existing note.
    
    You can only update your own notes.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verify note exists and belongs to user
    cursor.execute(
        "SELECT * FROM notes WHERE id = ? AND user_id = ?",
        (note_id, current_user.id)
    )
    existing = cursor.fetchone()
    
    if not existing:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    # Build update query dynamically
    update_fields = []
    values = []
    
    for field, value in updates.model_dump(exclude_unset=True).items():
        if value is not None:
            update_fields.append(f"{field} = ?")
            values.append(value)
    
    if update_fields:
        update_fields.append("updated_at = ?")
        values.append(datetime.utcnow().isoformat())
        values.append(note_id)
        values.append(current_user.id)
        
        cursor.execute(
            f"""
            UPDATE notes 
            SET {', '.join(update_fields)}
            WHERE id = ? AND user_id = ?
            """,
            values
        )
        conn.commit()
    
    # Fetch updated note
    cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
    row = cursor.fetchone()
    conn.close()
    
    return NoteResponse(
        id=row["id"],
        user_id=row["user_id"],
        title=row["title"],
        content=row["content"],
        x=row["x"],
        y=row["y"],
        width=row["width"],
        height=row["height"],
        color=row["color"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@app.delete("/api/notes/{note_id}", tags=["Notes"])
def delete_note(
    note_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Delete a note.
    
    You can only delete your own notes.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verify note exists and belongs to user
    cursor.execute(
        "SELECT id FROM notes WHERE id = ? AND user_id = ?",
        (note_id, current_user.id)
    )
    
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    cursor.execute(
        "DELETE FROM notes WHERE id = ? AND user_id = ?",
        (note_id, current_user.id)
    )
    conn.commit()
    conn.close()
    
    return {"message": "Note deleted successfully"}


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

### Step 1.9: Run the Backend

```bash
# Make sure you're in the sticky-notes-backend folder with venv activated
python main.py
```

You should see:
```
✅ Database initialized successfully!
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**Test the API:**
- Open http://localhost:8000 → Should show `{"status": "ok", "message": "Sticky Notes API is running!"}`
- Open http://localhost:8000/docs → Interactive API documentation

---

## ⚛️ Part 2: Setting Up the Frontend (React)

### Step 2.1: Download the Frontend Code

Open a **new terminal window** (keep the backend running in the first one):

```bash
# Clone the repository
git clone <your-repository-url> sticky-notes-frontend
cd sticky-notes-frontend

# Install dependencies
npm install
```

### Step 2.2: Configure the Backend URL

The frontend is configured to connect to `http://localhost:8000`. This is set in two files:

1. **`src/contexts/AuthContext.tsx`** - Line 3:
   ```typescript
   const API_URL = 'http://localhost:8000';
   ```

2. **`src/hooks/useNotes.ts`** - Line 5:
   ```typescript
   const API_URL = 'http://localhost:8000/api';
   ```

For local development, no changes needed. For production, update these URLs.

### Step 2.3: Run the Frontend

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser.

---

## 🧪 Part 3: Testing Your App

### Test 1: Create an Account

1. Click "Sign up" on the login page
2. Enter a valid email
3. Enter a password (8+ chars, 1 number, 1 uppercase)
4. Click "Create Account"
5. You should be redirected to the whiteboard

### Test 2: Create Notes

1. Double-click anywhere on the whiteboard to create a note
2. Type a title and content
3. Drag to move the note
4. Change the color using the toolbar

### Test 3: Verify Persistence

1. Create some notes
2. Refresh the page (Ctrl+R or Cmd+R)
3. Your notes should still be there

### Test 4: Test User Isolation

1. Log out (click user menu → Sign Out)
2. Create a new account with different email
3. You should see an empty whiteboard (no notes from first account)

---

## 🔐 Part 4: Google OAuth Setup (Optional)

If you want "Continue with Google" to work:

### Step 4.1: Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name it "Sticky Notes" → Create

### Step 4.2: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" → Create
3. Fill in:
   - App name: "Sticky Notes"
   - User support email: Your email
   - Developer contact: Your email
4. Click "Save and Continue" through the remaining steps

### Step 4.3: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "Sticky Notes Web"
5. Add Authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://your-frontend-domain.vercel.app` (production)
6. Add Authorized redirect URIs:
   - `http://localhost:5173/auth/callback` (development)
   - `https://your-frontend-domain.vercel.app/auth/callback` (production)
7. Click "Create"
8. Copy the Client ID and Client Secret

### Step 4.4: Configure Backend

Update your `config.py` or set environment variables:

```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
```

Restart the backend server.

---

## ☁️ Part 5: Deploying to the Cloud

### Option A: Deploy Backend to Railway

1. **Create Railway Account:** https://railway.app/
2. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   railway login
   ```
3. **Create Procfile** in `sticky-notes-backend`:
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. **Create runtime.txt**:
   ```
   python-3.11.0
   ```
5. **Deploy:**
   ```bash
   cd sticky-notes-backend
   railway init
   railway up
   ```
6. **Set Environment Variables** in Railway dashboard:
   - `JWT_SECRET`: Generate with `python -c "import secrets; print(secrets.token_hex(32))"`
   - `FRONTEND_URL`: Your Vercel frontend URL
   - `GOOGLE_CLIENT_ID`: (if using Google OAuth)
   - `GOOGLE_CLIENT_SECRET`: (if using Google OAuth)
7. **Copy the Railway URL** (e.g., `https://your-app.railway.app`)

### Option B: Deploy Backend to Render

1. **Create Render Account:** https://render.com/
2. **Push code to GitHub**
3. **Create New Web Service:**
   - Repository: Your GitHub repo (sticky-notes-backend)
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Add Environment Variables** (same as Railway)
5. **Deploy** and copy the URL

### Deploy Frontend to Vercel

1. **Create Vercel Account:** https://vercel.com/
2. **Update Frontend URLs:**

   In `src/contexts/AuthContext.tsx`:
   ```typescript
   const API_URL = 'https://your-backend-url.railway.app';
   ```

   In `src/hooks/useNotes.ts`:
   ```typescript
   const API_URL = 'https://your-backend-url.railway.app/api';
   ```

3. **Push to GitHub** and connect to Vercel
4. **Deploy!**

### Option C: Docker Deployment (Self-Hosted)

Create these files in your project root:

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build: ./sticky-notes-backend
    ports:
      - "8000:8000"
    environment:
      - JWT_SECRET=your-production-secret-key-change-this
      - FRONTEND_URL=http://localhost:3000
      - DATABASE_PATH=/data/sticky_notes.db
    volumes:
      - ./data:/data
    restart: unless-stopped

  frontend:
    build: ./sticky-notes-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

**sticky-notes-backend/Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**sticky-notes-frontend/Dockerfile:**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Run with Docker:**
```bash
docker-compose up -d
```

---

## 🔧 Troubleshooting

### "Python is not recognized"
**Solution:** Reinstall Python and make sure to check "Add Python to PATH" during installation. Restart your terminal.

### "npm is not recognized"
**Solution:** Reinstall Node.js. Make sure to restart your terminal after installation.

### "Port 8000 is already in use"
**Solution:** Either stop the other process or run on a different port:
```bash
uvicorn main:app --reload --port 8001
```
Then update the frontend URLs to use 8001.

### "CORS error" in browser console
**Solution:** Make sure `FRONTEND_URL` in `config.py` matches exactly where your frontend is running (including http/https and port).

### "Invalid email or password" but credentials are correct
**Solution:** Make sure the backend is running and accessible. Check browser network tab for the actual API error.

### "Cannot connect to backend"
**Solution:** 
1. Make sure backend is running (`python main.py`)
2. Check it's accessible at http://localhost:8000
3. Check firewall isn't blocking port 8000

### Notes disappear after refresh
**Solution:**
1. Make sure you're logged in
2. Check browser console for errors
3. Verify backend is running and database file exists (`sticky_notes.db`)

### Google OAuth not working
**Solution:**
1. Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly
2. Verify redirect URIs in Google Cloud Console match exactly
3. Make sure OAuth consent screen is configured

---

## ❓ Frequently Asked Questions

### Can I use PostgreSQL instead of SQLite?
Yes! Update `database.py` to use `psycopg2` instead. SQLite is simpler for getting started.

### How do I back up my notes?
Copy the `sticky_notes.db` file. It contains all users and notes.

### Can multiple users use the app at once?
Yes! Each user has their own account and private notes.

### How do I reset the database?
Delete `sticky_notes.db` and restart the backend. A new empty database will be created.

### How do I add more note colors?
1. Update the `color` options in `src/types/note.ts`
2. Add CSS for new colors in `src/components/StickyNote.tsx`

### Is my data secure?
- Passwords are hashed with bcrypt (never stored as plain text)
- JWT tokens expire after 7 days
- Notes are isolated per user
- HTTPS recommended for production

---

## 📁 Final Project Structure

```
sticky-notes-backend/
├── venv/                 # Python virtual environment
├── config.py            # Configuration settings
├── database.py          # Database connection
├── models.py            # Data models
├── auth.py              # Authentication logic
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── Procfile            # For Railway/Heroku
├── runtime.txt         # Python version
└── sticky_notes.db     # SQLite database (created automatically)

sticky-notes-frontend/
├── src/
│   ├── components/      # React components
│   ├── contexts/        # Auth context
│   ├── hooks/           # Custom hooks
│   ├── pages/           # Page components
│   └── types/           # TypeScript types
├── package.json
└── ...
```

---

## 🎉 Congratulations!

You now have a fully functional sticky notes application with:
- ✅ User authentication (email/password + Google OAuth)
- ✅ Secure password hashing
- ✅ JWT-based sessions
- ✅ Per-user note isolation
- ✅ SQLite database persistence
- ✅ Production-ready deployment options

**Need help?** Check the troubleshooting section or open an issue on GitHub.
