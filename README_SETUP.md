# Quick Setup Guide

## Troubleshooting "Failed to fetch" Error

If you're getting a "Failed to fetch" error when trying to sign in or sign up, it means the backend server is not running or not accessible.

### Step 1: Start the Backend Server

1. **Navigate to the server directory:**
```bash
cd server
```

2. **Install backend dependencies (if not already done):**
```bash
npm install
```

3. **Create backend `.env` file:**
```bash
cp .env.example .env
```

4. **Edit `server/.env` with your database credentials:**
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Choose your database type
DB_TYPE=postgresql

# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=unit_trek
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_SSL=false

# OR MySQL Configuration (if DB_TYPE=mysql)
# MYSQL_HOST=localhost
# MYSQL_PORT=3306
# MYSQL_DB=unit_trek
# MYSQL_USER=root
# MYSQL_PASSWORD=your_password
# MYSQL_SSL=false

CORS_ORIGIN=http://localhost:8080
```

5. **Run database migrations:**
```bash
npm run migrate
```

6. **Start the backend server:**
```bash
npm run dev
```

You should see:
```
🚀 Server running on port 3001
📊 Database: postgresql
🌍 Environment: development
✅ PostgreSQL connection established
```

### Step 2: Configure Frontend

1. **Create frontend `.env` file (in root directory):**
```bash
cp .env.example .env
```

2. **Edit `.env` (should already be set correctly):**
```env
VITE_API_URL=http://localhost:3001/api
```

### Step 3: Start the Frontend

1. **In a new terminal, from the root directory:**
```bash
npm run dev
```

2. **Open your browser to:** `http://localhost:8080`

### Common Issues

1. **Backend server not running:**
   - Make sure you see "🚀 Server running on port 3001" in the backend terminal
   - Check that port 3001 is not already in use

2. **Database connection failed:**
   - Verify your database is running
   - Check database credentials in `server/.env`
   - Make sure the database exists

3. **CORS errors:**
   - Make sure `CORS_ORIGIN` in `server/.env` matches your frontend URL (default: `http://localhost:8080`)

4. **Port conflicts:**
   - Backend uses port 3001 (change in `server/.env` if needed)
   - Frontend uses port 8080 (Vite default)

### Testing the Connection

You can test if the backend is running by visiting:
```
http://localhost:3001/health
```

You should see:
```json
{"status":"ok","timestamp":"..."}
```

If you see this, the backend is running correctly!
