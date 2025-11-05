# Quick Start Guide

## Step 1: Create the Database

Before starting the server, you need to create the database.

### For PostgreSQL:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE unit_trek;

# Exit psql
\q
```

### For MySQL:

```bash
# Connect to MySQL
mysql -u root -p

# Create the database
CREATE DATABASE unit_trek;

# Exit MySQL
EXIT;
```

### Alternative: Create database via command line

**PostgreSQL:**
```bash
createdb -U postgres unit_trek
```

**MySQL:**
```bash
mysql -u root -p -e "CREATE DATABASE unit_trek;"
```

## Step 2: Configure Database Connection

Edit `server/.env` and update the database credentials:

```env
# For PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password_here

# OR For MySQL
MYSQL_USER=root
MYSQL_PASSWORD=your_password_here
```

## Step 3: Run Migrations

```bash
cd server
npm run migrate
```

This will create all the necessary tables in your database.

## Step 4: Start the Server

```bash
cd server
npm run dev
```

You should see:
```
🚀 Server running on port 3001
📊 Database: postgresql
🌍 Environment: development
✅ PostgreSQL connection established
```

## Step 5: Start the Frontend

In a new terminal:

```bash
npm run dev
```

Then open http://localhost:8080 in your browser.

## Troubleshooting

### Database doesn't exist
- Make sure you've created the database (see Step 1)
- Check database name in `.env` matches the created database

### Connection refused
- Make sure PostgreSQL/MySQL is running
- Check host, port, username, and password in `.env`
- For PostgreSQL: `pg_isready` to check if it's running
- For MySQL: `mysqladmin ping` to check if it's running

### Port 3001 already in use
- Change `PORT` in `server/.env` to a different port (e.g., 3002)
- Update `VITE_API_URL` in frontend `.env` to match

### Migration errors
- Make sure the database exists
- Check database user has CREATE privileges
- Try dropping and recreating the database if needed
