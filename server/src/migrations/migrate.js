import { initializeDatabase, getDbType, query, closeDatabase } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrations = async () => {
  try {
    await initializeDatabase();
    const dbType = getDbType();
    
    console.log(`Running migrations for ${dbType}...`);
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Adapt schema for MySQL if needed
    if (dbType === 'mysql') {
      // Replace UUID with VARCHAR(36)
      schema = schema.replace(/UUID/g, 'VARCHAR(36)');
      // Replace gen_random_uuid() with UUID()
      schema = schema.replace(/gen_random_uuid\(\)/g, '(UUID())');
      // Replace app_role enum with VARCHAR
      schema = schema.replace(/CREATE TYPE app_role AS ENUM \('admin', 'manager', 'user'\);/g, '');
      // Add ON UPDATE CURRENT_TIMESTAMP for updated_at columns
      schema = schema.replace(/updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/g, 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
      // Replace CHECK constraint syntax for MySQL
      schema = schema.replace(/CHECK \(type IN \('in', 'out', 'adjustment'\)\)/g, "CHECK (type IN ('in', 'out', 'adjustment'))");
    }
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      try {
        // Skip enum creation for MySQL (handled differently)
        if (dbType === 'mysql' && statement.includes('CREATE TYPE')) {
          continue;
        }
        // Skip empty statements
        if (!statement || statement.length < 10) {
          continue;
        }
        await query(statement);
      } catch (error) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists') && !error.message.includes('Duplicate') && !error.message.includes('relation') && !error.message.includes('does not exist')) {
          console.error('Migration error:', error.message);
          console.error('Statement:', statement.substring(0, 100));
        }
      }
    }
    
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
};

runMigrations();
