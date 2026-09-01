# StudyConnect

StudyConnect is a web-based platform designed to help university students find suitable study partners and organise study sessions.

## Table of Contents

- [Project Overview](#project-overview)
- [Purpose](#purpose)
- [Features](#features)
  - [Student Features](#student-features)
  - [Email Notifications](#email-notifications)
  - [Administrative Features](#administrative-features)
  - [Moderation](#moderation)
- [Technology Stack](#technology-stack)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
    - [Backend Environment Configuration](#backend-environment-configuration)
    - [Database Setup](#database-setup)
    - [Database Migrations](#database-migrations)
    - [Administrator Setup](#administrator-setup)
  - [Frontend Setup](#frontend-setup)
    - [Frontend Environment Configuration](#frontend-environment-configuration)
- [Running the Backend](#running-the-backend)
- [Running the Frontend](#running-the-frontend)
- [Running the Complete Application](#running-the-complete-application)
- [Example Usage](#example-usage)
- [Security](#security)
- [Development Team](#development-team)

---

## Project Overview

The idea for StudyConnect originated from a common challenge experienced by university students: finding suitable study partners for specific modules. This can be particularly difficult for students who struggle to make friends or connect with other students in their classes. As a result, finding people to study with and coordinating suitable study times and locations can become challenging.

Students often rely on platforms such as WhatsApp, word of mouth, and other social media platforms to communicate with classmates and organise study sessions. Although these platforms are useful for communication, they are not specifically designed for discovering and organising study groups. Finding students who are studying a particular module or are available at a particular time may therefore be difficult.

StudyConnect was developed to address this problem by providing a centralised and organised platform specifically designed for study group discovery and coordination. The system allows students to find and create study groups based on relevant academic information, helping make the process of connecting with potential study partners more structured and accessible.

---

## Purpose

StudyConnect provides university students with a dedicated platform for discovering, creating, and participating in study groups.

The platform aims to make it easier for students to:

* Find other students studying similar modules
* Discover available study groups
* Create and organise their own study sessions
* Join and leave study groups
* Coordinate study sessions based on modules, dates, times, and venues

---

## Features

### Student Features

* Register and authenticate using an allowed email address.

* Verify email addresses and reset forgotten passwords.

* Create and manage a student profile

* Add programme and biography information

* Manage enrolled modules

* Browse, search, and filter available study groups.

* View study group and student profile details

* Create and organise study sessions by selecting a module, venue, date, time, and maximum number of participants

* Join and leave study groups

* View created and joined study groups

### Email Notifications

StudyConnect provides email notifications for important study group events, including:

* Students joining or leaving a study group

* Groups becoming nearly full

* Study group cancellations

* Reminders for upcoming study sessions

### Administrative Features

Administrators can manage:

* Student accounts

* Modules

* Venues

### Moderation

The backend includes moderation functionality that allows:

* Students to submit reports

* Administrators to review reports and manage inappropriate behaviour

> **Note:** Moderation functionality is implemented in the backend but has not yet been integrated into the frontend interface.

---

## Technology Stack

### Backend

* Python

* FastAPI

* MySQL

### Frontend

* React

* Vite

* JavaScript

* CSS

---

## Project Structure

```text
StudyConnect/
│
├── .venv/                         # Python virtual environment
│
├── backend/
│   ├── alembic/                   # Database migrations
│   ├── scripts/
│   │   └── seed_admin.py          # Script for creating an admin account
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py              # Application configuration
│   │   ├── database.py            # Database configuration
│   │   ├── main.py                # FastAPI application
│   │   │
│   │   ├── auth/                  # Authentication functionality
│   │   ├── users/                 # User and student profile functionality
│   │   ├── groups/                # Study group functionality
│   │   ├── memberships/           # Group membership functionality
│   │   ├── admin/                 # Administrative functionality
│   │   ├── venues/                # Venue management
│   │   ├── modules/               # Module management
│   │   ├── moderation/            # Reporting and moderation
│   │   ├── middleware/            # Application middleware
│   │   └── shared/                # Shared functionality
│   │
│   ├── .env                       # Local environment configuration
│   ├── .env.example               # Environment configuration template
│   ├── alembic.ini
│   ├── main.py                    # Backend entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── .env                       # Local frontend configuration
│   ├── .env.example               # Frontend environment template
│   ├── package.json
│   └── vite.config.js
│
├── requirements.txt 
└── README.md
```
---

## Getting Started

### Prerequisites

Before running StudyConnect, make sure the following software is installed:

* **Python 3**

* **Node.js and npm**

* **MySQL Server**

* **Git**

---

#### 1. Clone the Repository

Clone the StudyConnect repository and navigate into the project directory:

```bash

git clone <repository-url>

cd StudyConnect

```

---

### Backend Setup

#### 2. Create the Python Virtual Environment

The Python virtual environment should be created at the **root of the project**.

From the `StudyConnect` project directory:

```bash

python -m venv .venv

```

---

#### 3. Activate the Virtual Environment

##### Linux/macOS

```bash

source .venv/bin/activate

```

##### Windows Command Prompt

```cmd

.venv\Scripts\activate

```

##### Windows PowerShell

```powershell

.venv\Scripts\Activate.ps1

```

---

#### 4. Install Backend Dependencies

The `requirements.txt` file is located in the project root.

From the `StudyConnect` project directory, with the virtual environment activated:

```bash

pip install -r requirements.txt

```

---

### Backend Environment Configuration

StudyConnect uses environment variables for configuration such as database credentials, authentication settings, email settings, and application environment settings.

The backend environment file is:

```text

backend/.env

```

#### 5. Create the Backend `.env` File

While inside the `backend` directory, copy `.env.example` to `.env`.

##### Linux/macOS

```bash

cp .env.example .env

```

##### Windows Command Prompt

```cmd

copy .env.example .env

```

##### Windows PowerShell

```powershell

Copy-Item .env.example .env

```

Open `backend/.env` and update the required values.

### Database Configuration

Configure the MySQL connection:

```env

DB_HOST=localhost

DB_PORT=3306

DB_USER=root

DB_PASSWORD=your_password

DB_NAME=studyconnect_db

```

Update the values to match your local MySQL installation.

### JWT Configuration

Replace the default secret key with a secure random value:

```env

SECRET_KEY=replace_me

```

A secure key can be generated using:

```bash

python -c "import secrets; print (secrets.token_urlsafe(32))"

```

The generated value can then be placed in `.env`:

```env

SECRET_KEY=your_generated_secret_key

```

The remaining JWT settings can normally remain unchanged when running the provided configuration.:

```env

ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_DAYS=7

```

### Email Configuration

Email functionality requires valid SMTP credentials.

Configure:

```env

MAIL_USERNAME=example@gmail.com

MAIL_PASSWORD=app_password

MAIL_FROM=example@gmail.com

```

The Gmail SMTP settings can normally remain:

```env

MAIL_PORT=587

MAIL_SERVER=smtp.gmail.com

MAIL_FROM_NAME=Study Connect

MAIL_STARTTLS=True

MAIL_SSL_TLS=False

```

### Application Configuration

For running StudyConnect on your machine:

```env

FRONTEND_URL=http://localhost:5173

ENVIRONMENT=development

```

### Security Configuration

For running StudyConnect on your machine:

```env

ENABLE_HSTS=false

LOGIN_MAX_ATTEMPTS=5

LOGIN_LOCKOUT_MINUTES=15

```

HSTS should only be enabled when deploying the application using HTTPS.

### Allowed Email Domains

The default allowed email domains are:

```env

ALLOWED_EMAIL_DOMAINS=gmail.com,outlook.com,hotmail.com,myuwc.ac.za

```

This can be changed if different email domains are required.

## Database Setup

#### 6. Start MySQL

Make sure your MySQL server is installed and running.

---

#### 7. Create the Database

Create the StudyConnect database:

```sql

CREATE DATABASE studyconnect_db;

```

Make sure the database name and credentials match `backend/.env`.

---

### Database Migrations

StudyConnect uses **Alembic** to manage database schema migrations.

Make sure you are inside the `backend` directory:

```bash

cd backend

```

Apply the latest migrations:

```bash

alembic upgrade head

```

### Administrator Setup

StudyConnect includes a script for creating an administrator account.

Before running the script, ensure that:

1. MySQL is running

2. The StudyConnect database exists

3. `backend/.env` is configured correctly

4. Database migrations have been applied

From the `backend` directory, run:

```bash

python scripts/seed_admin.py

```

The script prompts for:

* Full name

* Email address

* Password

The administrator account is created with the appropriate administrator role and is automatically marked as verified.

---

## Running the Backend

From the `backend` directory, with the virtual environment activated:

```bash

python main.py

```

The backend will run at:

```text

http://localhost:8000

```

The API is available under:

```text

http://localhost:8000/api/v1/

```

When running in the development environment, interactive API documentation is also available at:

```text

http://localhost:8000/docs

```

---

## Frontend Setup

Open a **new terminal** while leaving the backend running.

From the project root, navigate to the frontend:

```bash

cd frontend

```

### Install Frontend Dependencies

Install the required Node.js packages:

```bash

npm install

```

---

## Frontend Environment Configuration

The frontend uses an environment variable to determine the backend API URL.

The frontend environment file is:

```text

frontend/.env

```

Create it by copying `.env.example`.

### Linux/macOS

```bash

cp .env.example .env

```

### Windows Command Prompt

```cmd

copy .env.example .env

```

### Windows PowerShell

```powershell

Copy-Item .env.example .env

```

For running StudyConnect on your machine, the `.env` file should contain:

```env

VITE_API_BASE_URL=http://localhost:8000/api/v1/

```

## Running the Frontend

From the `frontend` directory:

```bash

npm run dev

```

The frontend will normally be available at:

```text

http://localhost:5173

```

---

## Running the Complete Application

Both the backend and frontend need to be running at the same time.

#### Terminal 1 - Backend

From the project root, activate the virtual environment.

Linux/macOS:

```bash

source .venv/bin/activate

```

Windows Command Prompt:

```cmd

.venv\Scripts\activate

```

Then:

```bash

cd backend

python main.py

```

The backend runs on:

```text

http://localhost:8000

```

#### Terminal 2 - Frontend

From the project root:

```bash

cd frontend

npm run dev

```

The frontend normally runs on:

```text

http://localhost:5173

```

Open the frontend address in a web browser to use StudyConnect.

---

## Example Usage

A typical StudyConnect workflow is:

1. Register for an account using an allowed email address.

2. Verify the registered email address.

3. Log in to the application.

4. Create or update a student profile.

5. Manage enrolled modules.

6. Browse available study groups.

7. Search or filter groups by module and study date.

8. Create a study group if a suitable group does not exist.

9. Join an existing study group.

10. View created and joined study groups.

11. Receive notifications about relevant study group events.

---

## Security

StudyConnect implements several security measures to help protect user accounts and system resources:

* Password hashing using bcrypt

* JWT-based authentication with access and refresh tokens

* Refresh token rotation

* Email verification

* Password reset functionality

* Login attempt limits and temporary account lockout

* Rate limiting in the production environment

* Security headers

* CORS configuration

* Protected API endpoints

* Environment-based security configuration

---

## Development Team

StudyConnect was developed as a collaborative university software engineering project.

**Team Members:**

* Andiswe

* Thespo

* Constance

* Beredine

---
