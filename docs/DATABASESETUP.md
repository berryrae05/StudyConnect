# DATABASE SETUP GUIDE

This guide helps with setting up MySQL, environement variables, and Alembic migrations for the Study Connect backend

---

## 1. Prerequistes

### Install MySQL

Download MySQL: https://dev.mysql.com/downloads/mysql/

During installation:
- Install MySQL server
- Install MySQL Workbench
- Install MySQL Shell
- Set root password
- Ensure MySQL is running on port '3306'

Check MySQL is running:

Open MySQL Shell
```bash
mysql -u root -p
```

## 2. Create Database

Option 1:
Open MySQL Workbench

Type and Execute 
```sql
CREATE DATABASE studyconnect_db
```

Option 2:
Open MySQL Shell

Log into MySQL:
```bash
mysql -u root -p
```

Create the database:
```sql
CREATE DATABASE studyconnect_db
```

---

## 3. Environment Variables (.env)

### Recommended location
Place '.env' inside the backend folder:

```text
backend\.env
```

#### Example '.env'

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_USER=studyconnect_db
```

#### Important rules:
- NEVER push '.env' to GitHub
- It contains sensitive information

## 4. Install Dependencies

Install in backend folder with the virtual environment activated

Install backend dependencies:

```bash
pip install -r requirements.txt
# Installs FastAPI, SQLAlchemy, PyMySQL, Alembic, etc.
```

Important:
```text
requirements.txt already contains all required datbase packages
```

## 5. Database Connection Testing

Run backend:
```bash
python main.py
```

Expected output:
```text
Database connected successfully!
```

If it fails:
- Check '.env'
- Ensure MySQL server is running
- Confirm datbase exist

---

## 6. Alembic Setup (Migrations)
Alembic has already been initialized and committed to GitHub.

You DO NOT NEED to run:
```bash
alembic init alembic
```

## 7. Run Database Migrations

##### Note: Model and Schemas are in progess, so DO NOT run this YET.

Apply latest database structure

```bash
alembic upgrade head
# Creates/updates tables in MySQL
```

Important: 

Run this command after pulling new datbase changes

## 8. Common Commands

Create migration:

```bash
alembic revision --autogenerates -m "create user table"
```

Apply migrations:

```bash
alembic upgrade head
```

Rollback last migrations:

```bash
alembic downgrade -1
```

Reset migrations:

```bash
alembic downgrade base
```