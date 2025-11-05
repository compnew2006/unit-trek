# بديل الجرد - نظام إدارة المخزون والمستودعات

نظام إدارة مخزون حديث وجاهز للإنتاج مبني بـ React و TypeScript و Node.js backend مع دعم PostgreSQL و MySQL.

## Features

- 🏭 **Multi-Warehouse Management** - Manage inventory across multiple warehouses
- 📦 **Item Tracking** - Track items with barcodes, quantities, and minimum stock levels
- 📊 **Stock Movements** - Record incoming, outgoing, and adjustment movements
- 📈 **History & Analytics** - Complete audit trail and dashboard analytics
- 📱 **Barcode Scanning** - Single and batch barcode scanning support
- 👥 **User Management** - Role-based access control (Admin, Manager, User)
- 🌍 **Internationalization** - Multi-language support (English, Arabic)
- 🎨 **Dark Mode** - Beautiful UI with dark/light theme support
- 📥 **Import/Export** - Excel import and export functionality
- 🔄 **Item Cloning** - Clone items across warehouses
- 🗄️ **Database Support** - PostgreSQL and MySQL database support

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Beautiful component library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **i18next** - Internationalization

### Backend
- **Node.js** with Express
- **PostgreSQL** or **MySQL** database
- **JWT** authentication
- **RESTful API**

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+ or MySQL 8+
- Git

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd unit-trek-main
```

2. **Install frontend dependencies:**
```bash
npm install
```

3. **Install backend dependencies:**
```bash
cd server
npm install
cd ..
```

4. **Configure backend environment:**
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your database credentials:
```env
DB_TYPE=postgresql  # or 'mysql'
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=unit_trek
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
JWT_SECRET=your-super-secret-jwt-key
```

5. **Configure frontend environment:**
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

6. **Run database migrations:**
```bash
cd server
npm run migrate
```

7. **Start the backend server:**
```bash
cd server
npm run dev
```

8. **Start the frontend (in a new terminal):**
```bash
npm run dev
```

9. **Open your browser:**
Navigate to `http://localhost:8080` (or the port shown in the terminal)

## Project Structure

```
unit-trek-main/
├── server/                 # Backend API server
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── routes/        # API routes
│   │   ├── migrations/    # Database migrations
│   │   └── index.js       # Server entry point
│   ├── .env.example       # Environment variables template
│   └── package.json
├── src/                    # Frontend source
│   ├── components/        # React components
│   ├── context/           # React contexts
│   ├── hooks/             # Custom hooks
│   ├── pages/             # Page components
│   ├── services/          # API services
│   └── types.ts           # TypeScript types
├── .env.example           # Frontend environment template
└── package.json
```

## Database Setup

The application supports both PostgreSQL and MySQL. Set `DB_TYPE` in `server/.env` to choose your database.

### PostgreSQL
```env
DB_TYPE=postgresql
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=unit_trek
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```

### MySQL
```env
DB_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=unit_trek
MYSQL_USER=root
MYSQL_PASSWORD=your_password
```

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/warehouses` - Get all warehouses
- `POST /api/warehouses` - Create warehouse
- `GET /api/items/warehouse/:id` - Get items by warehouse
- `POST /api/items` - Create item
- `POST /api/movements` - Record stock movement
- `GET /api/history` - Get history entries

See `server/README.md` for complete API documentation.

## Production Deployment

1. Build the frontend:
```bash
npm run build
```

2. Set production environment variables:
```bash
# Frontend
VITE_API_URL=https://your-api-domain.com/api
NODE_ENV=production

# Backend
NODE_ENV=production
DB_TYPE=postgresql
# ... database credentials
JWT_SECRET=strong-secret-key
CORS_ORIGIN=https://your-frontend-domain.com
```

3. Start the backend server:
```bash
cd server
npm start
```

4. Serve the frontend build:
   - Use a web server (nginx, Apache) to serve the `dist` folder
   - Or use a hosting service like Vercel, Netlify, etc.

## Development

```bash
# Run frontend dev server
npm run dev

# Run backend dev server
cd server && npm run dev

# Run migrations
cd server && npm run migrate
```

# بديل الجرد - نظام إدارة المخزون والمستودعات

نظام إدارة مخزون حديث وجاهز للإنتاج مبني بـ React و TypeScript و Node.js backend مع دعم PostgreSQL و MySQL.

## Features

- 🏭 **Multi-Warehouse Management** - Manage inventory across multiple warehouses
- 📦 **Item Tracking** - Track items with barcodes, quantities, and minimum stock levels
- 📊 **Stock Movements** - Record incoming, outgoing, and adjustment movements
- 📈 **History & Analytics** - Complete audit trail and dashboard analytics
- 📱 **Barcode Scanning** - Single and batch barcode scanning support
- 👥 **User Management** - Role-based access control (Admin, Manager, User)
- 🌍 **Internationalization** - Multi-language support (English, Arabic)
- 🎨 **Dark Mode** - Beautiful UI with dark/light theme support
- 📥 **Import/Export** - Excel import and export functionality
- 🔄 **Item Cloning** - Clone items across warehouses
- 🗄️ **Database Support** - PostgreSQL and MySQL database support
- 🔒 **Security** - JWT authentication, input sanitization, rate limiting
- 📊 **Monitoring** - Error tracking, performance monitoring, user feedback

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Pages      │  │  Components  │  │    Hooks     │     │
│  │              │  │              │  │              │     │
│  │ - Dashboard  │  │ - UI Library │  │ - useAuth    │     │
│  │ - Inventory  │  │ - Forms      │  │ - useInventory│    │
│  │ - History    │  │ - Tables     │  │ - usePagination│   │
│  │ - Reports    │  │ - Dialogs    │  │ - useDebounce│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Client (apiClient.ts)               │   │
│  │  - Authentication  - Error Handling                  │   │
│  │  - Token Refresh   - Rate Limiting                   │   │
│  │  - Retry Logic     - Performance Monitoring          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Routes     │  │  Middleware  │  │  Validation  │     │
│  │              │  │              │  │              │     │
│  │ - /auth      │  │ - Auth       │  │ - Zod Schemas│     │
│  │ - /items     │  │ - Rate Limit │  │ - Input      │     │
│  │ - /warehouses│  │ - Error      │  │   Validation │     │
│  │ - /movements │  │   Handling   │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Database Adapter (PostgreSQL/MySQL)          │   │
│  │  - Query Execution  - Connection Pooling              │   │
│  │  - Transaction Support                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Database                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │     MySQL     │  │   (Choose)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```
