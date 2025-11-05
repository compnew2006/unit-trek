# Unit Trek API Server

Backend API server for Unit Trek Inventory Management System.

## Features

- PostgreSQL and MySQL support
- RESTful API
- JWT Authentication
- Database migrations
- Environment-based configuration

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```env
DB_TYPE=postgresql  # or 'mysql'
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=unit_trek
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
```

4. Run migrations:
```bash
npm run migrate
```

5. Start the server:
```bash
npm run dev  # Development with auto-reload
# or
npm start    # Production
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Warehouses
- `GET /api/warehouses` - Get all warehouses
- `GET /api/warehouses/:id` - Get warehouse by ID
- `POST /api/warehouses` - Create warehouse
- `PUT /api/warehouses/:id` - Update warehouse
- `DELETE /api/warehouses/:id` - Delete warehouse

### Items
- `GET /api/items/warehouse/:warehouseId` - Get items by warehouse
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `POST /api/items/bulk` - Bulk create items

### Movements
- `POST /api/movements` - Record stock movement

### History
- `GET /api/history` - Get all history
- `GET /api/history/warehouse/:warehouseId` - Get history by warehouse
- `GET /api/history/item/:itemId` - Get history by item

## Environment Variables

See `.env.example` for all available configuration options.

## Database Support

The server supports both PostgreSQL and MySQL. Set `DB_TYPE` in `.env` to switch between them.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper CORS origins
4. Use connection pooling for database
5. Enable SSL for database connections
6. Set up proper logging and monitoring
