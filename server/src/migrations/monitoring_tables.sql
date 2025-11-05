-- Create error_logs table for error tracking
CREATE TABLE IF NOT EXISTS error_logs (
  id VARCHAR(36) PRIMARY KEY,
  level VARCHAR(20) NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  stack TEXT,
  name VARCHAR(255),
  user_id VARCHAR(36),
  url TEXT,
  user_agent TEXT,
  context JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_level (level),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Create performance_metrics table for performance monitoring
CREATE TABLE IF NOT EXISTS performance_metrics (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'custom',
  metadata JSON,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
);

-- Create feedback table for user feedback
CREATE TABLE IF NOT EXISTS feedback (
  id VARCHAR(36) PRIMARY KEY,
  type VARCHAR(50) NOT NULL DEFAULT 'other',
  message TEXT NOT NULL,
  email VARCHAR(255),
  url TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
);

