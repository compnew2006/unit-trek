import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { query, initializeDatabase, closeDatabase } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const runMigration = async () => {
  try {
    console.log('🔄 Running refresh tokens migration...');
    
    await initializeDatabase();
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'add_refresh_tokens.sql');
    let sql = fs.readFileSync(sqlPath, 'utf8');
    
    const dbType = process.env.DB_TYPE || 'postgresql';
    
    // Adapt SQL for MySQL
    if (dbType === 'mysql') {
      console.log('Adapting SQL for MySQL...');
      
      // Replace PostgreSQL-specific syntax
      sql = sql.replace(/UUID/g, 'CHAR(36)');
      sql = sql.replace(/DEFAULT gen_random_uuid\(\)/g, 'DEFAULT (UUID())');
      sql = sql.replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/g, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      sql = sql.replace(/NOW\(\)/g, 'CURRENT_TIMESTAMP');
      sql = sql.replace(/DATE_SUB\(/g, 'DATE_SUB(');
      
      // Remove PostgreSQL-specific DO block for ALTER TABLE
      sql = sql.replace(/DO \$\$[\s\S]*?END \$\$;/g, '');
      
      // Add ALTER TABLE for MySQL
      sql += `\n-- Add password_hash column for MySQL\n`;
      sql += `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);\n`;
    }
    
    // Remove comments and split into statements
    const lines = sql.split('\n');
    const statements = [];
    let currentStatement = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comment lines
      if (trimmed.startsWith('--') || trimmed.length === 0) {
        continue;
      }
      
      currentStatement += line + '\n';
      
      // If line ends with semicolon, it's end of statement
      if (trimmed.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // Execute each statement
    for (const statement of statements) {
      if (!statement || statement.length === 0) continue;
      
      try {
        const preview = statement.replace(/\s+/g, ' ').substring(0, 60);
        console.log(`Executing: ${preview}...`);
        await query(statement, []);
        console.log('✅ Executed successfully');
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message && (
            error.message.includes('already exists') || 
            error.message.includes('Duplicate column') ||
            error.message.includes('Duplicate key name')) ||
            error.code === 'ER_DUP_FIELDNAME' ||
            error.code === '42701' || // PostgreSQL: duplicate column
            error.code === '42P07' || // PostgreSQL: relation already exists
            error.code === '42710') { // PostgreSQL: duplicate object
          console.log('⚠️  Already exists, skipping...');
        } else {
          console.error('❌ Error:', error.message);
          throw error;
        }
      }
    }
    
    console.log('✅ Refresh tokens migration completed successfully!');
    
    await closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await closeDatabase();
    process.exit(1);
  }
};

runMigration();

