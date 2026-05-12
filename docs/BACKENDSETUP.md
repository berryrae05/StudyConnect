# Backend Setup Guide

This guide helps set up and run the FastAPI backend for the StudyConnect project

---

## 1. Create Project Environment
### Step 1: Go to backend folder

```bash
cd backend
# Move into the backend directory where the FastAPI project lives
```
### Step 2: Create virtual environment

```bash
python -m venv venv
```

### Step 3: Activate virtual environment

Windows

```bash
venv\Scripts\Activate
```

Mac\Linux

```bash
source venv/bin/activate
```
## 2. Install Dependencies

```bash
pip install -r requirements.txt
# Installs all required packages at once
```

If you added any installed any new dependencies/packages (it will overwrite all curently installed packages in
your environement):

```bash
pip freeze > requirements.txt
```
### 2.1 Installing New Packages

Example: Install SQLAlchemy

Make sure you are the virtual environment is activated:

```bash
venv\Scripts\Activate
```

Make sure you are inside:

```bash
cd backend
```

The install:
```bash
pip install SQLAlchemy
# Installs sqlalchemy inside the virtual environment
```

Important Rule:

```text
Always pip commands inside the backend folder while virtual environment is activated
```

## 3. Run the Backend

```bash
python main.py
# Starts the FastAPI server

```
## 4. Test Backend
Open in browser:

```text 
http://127.0.0.1:8000
```

Swagger API docs:

```text
http://127.0.0.1:8000/docs
```

## 5. Git Workflow (Team Collaboration)

We use a single shared workflow for both frontend and backend. We work using feature branches

### Branch Structure

```bash
main    
feature/auth    ->login/register system
feature/groups  -> group functionality
feature/membership -> join/leavr groups
feature/ui ->frontend UI work
etc.
```
### Workflow Steps

#### 1. Always start from latest main

```bash
git checkout main
# switch to main branch

git pull origin main
# get latest updates from GitHub
```
#### 2. Create a feature branch

```bash
git checkout -b feature/auth
# creates a new branch for a new feature
```

#### 3. Stage changes (IMPORTANT)

Stage a single file

```bash
git add app/auth/routes.py
# stages only one file (best for small changes)
```

Stage multiple files:

```bash
git add app/auth/routes.py app/auth/service.py
# stages specific files only
```

Stage a folder:

```bash
git add app/auth/
# stages everything inside auth folder
```

Stage everything:

```bash
git add .
# stages ALL changes (use carefully)
```

#### 4. Commit Changes

```bash
git commit -m "Add login endpoint"
```

#### 5. Push branch

```bash
git push origin feature/auth
# uploads branch to GitHub
```

#### 6. Merge via Pull Request
* Open Github
* Create Pull Request (feature -> main)
* Team reviews
* Merge into main

#### 7. Team Rules
* Never push directly to main
* Always pull before starting work
* Commit only related changes (no mixing features)
* Prefer staging specific files instead of everything
* Test endpoints in/docs before merging

