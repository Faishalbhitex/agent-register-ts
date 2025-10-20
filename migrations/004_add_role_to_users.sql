-- Add role column to users table 
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';

-- Create index for role queries 
CREATE INDEX idx_users_role ON users(role);

-- Optional: Set current admin user to admin role
-- UPDATE users SET role = 'admin' WHERE id = 1;
