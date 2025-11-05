// Routes imports - will be migrated to TypeScript
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { Pool } from 'pg';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

type DatabaseType = 'postgresql' | 'mysql';

let dbPool: Pool | mysql.Pool | null = null;
let dbType: DatabaseType | null = null;

/**
 * Initialize database connection based on DB_TYPE in .env
 */
export const initializeDatabase = async (): Promise<Pool | mysql.Pool> => {
  dbType = (process.env.DB_TYPE || 'postgresql') as DatabaseType;

  try {
    if (dbType === 'postgresql') {
      dbPool = new Pool({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'unit_trek',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || '',
        ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await (dbPool as Pool).connect();
      console.log('✅ PostgreSQL connection established');
      client.release();
    } else if (dbType === 'mysql') {
      dbPool = await mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        database: process.env.MYSQL_DB || 'unit_trek',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        ssl: process.env.MYSQL_SSL === 'true' ? {} : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Test connection
      await (dbPool as mysql.Pool).query('SELECT 1 as test');
      console.log('✅ MySQL connection established');
    } else {
      throw new Error(`Unsupported database type: ${dbType}`);
    }

    return dbPool;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Database connection failed:', errorMessage);
    throw error;
  }
};

/**
 * Get database connection pool
 */
export const getDb = (): Pool | mysql.Pool => {
  if (!dbPool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbPool;
};

/**
 * Get database type
 */
export const getDbType = (): DatabaseType | null => dbType;

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  if (dbPool) {
    if (dbType === 'postgresql') {
      await (dbPool as Pool).end();
    } else if (dbType === 'mysql') {
      await (dbPool as mysql.Pool).end();
    }
    dbPool = null;
    console.log('Database connection closed');
  }
};

/**
 * Convert SQL with ? placeholders to PostgreSQL $1, $2 format
 */
const convertToPostgresParams = (sql: string, params: unknown[]): { sql: string; params: unknown[] } => {
  let paramIndex = 1;
  const convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
  return { sql: convertedSql, params };
};

/**
 * Execute a query (works with both PostgreSQL and MySQL)
 */
export const query = async (sql: string, params: unknown[] = []): Promise<unknown[]> => {
  const db = getDb();

  if (dbType === 'postgresql') {
    const { sql: pgSql, params: pgParams } = convertToPostgresParams(sql, params);
    const result = await (db as Pool).query(pgSql, pgParams);
    return result.rows;
  } else if (dbType === 'mysql') {
    const [rows] = await (db as mysql.Pool).query(sql, params);
    return rows as unknown[];
  }
  
  throw new Error('Database not initialized');
};

/**
 * Execute a query and return the first row
 */
export const queryOne = async (sql: string, params: unknown[] = []): Promise<unknown | null> => {
  const results = await query(sql, params);
  return results[0] || null;
};

/**
 * Execute an INSERT and return the inserted ID
 */
export const insert = async (sql: string, params: unknown[] = []): Promise<string | number> => {
  const db = getDb();

  if (dbType === 'postgresql') {
    const { sql: pgSql, params: pgParams } = convertToPostgresParams(sql, params);
    // Check if RETURNING clause already exists
    const finalSql = pgSql.toUpperCase().includes('RETURNING') ? pgSql : pgSql + ' RETURNING id';
    const result = await (db as Pool).query(finalSql, pgParams);
    return result.rows[0]?.id || result.rows[0];
  } else if (dbType === 'mysql') {
    const [result] = await (db as mysql.Pool).query(sql, params) as [mysql.ResultSetHeader, unknown[]];
    return result.insertId;
  }
  
  throw new Error('Database not initialized');
};

/**
 * Execute a transaction
 */
export const transaction = async <T>(
  callback: (client: Pool | mysql.PoolConnection) => Promise<T>
): Promise<T> => {
  const db = getDb();

  if (dbType === 'postgresql') {
    const client = await (db as Pool).connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client as unknown as Pool);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } else if (dbType === 'mysql') {
    const connection = await (db as mysql.Pool).getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection as unknown as mysql.PoolConnection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  throw new Error('Database not initialized');
};

