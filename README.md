# Agent Card Registry API

A production-ready RESTful API for managing AI agent registrations using the [A2A (Agent-to-Agent) Protocol](https://github.com/a2aproject/A2A). Built with TypeScript, Express, and PostgreSQL.

## 🌟 Features

- **🤖 A2A Protocol Integration** - Automatic agent card fetching from agent servers
- **🔐 Dual-Token JWT Authentication** - Access (15m) + Refresh (7d) tokens with automatic rotation
- **🛡️ Role-Based Access Control (RBAC)** - Admin and user roles with granular permissions
- **📊 Agent Registry** - Full CRUD operations for AI agent management
- **👤 Ownership-Based Authorization** - Users manage only their agents, admins manage all
- **🌐 Public Agent Discovery** - Public agents visible to all users
- **⚡ Token Lifecycle Management** - Automatic expired token cleanup with cron jobs
- **🔒 Security** - Rate limiting, helmet, CORS, bcryptjs (Termux-compatible)
- **⚡ Performance** - PostgreSQL connection pooling and optimized queries
- **🏗️ Clean Architecture** - MVC pattern with TypeScript for maintainability

## ⚡ Quick Start (5-10 minutes)

### Prerequisites

- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x with `pg_ctl` and `psql` CLI tools
- **curl** and **jq** (for testing)

### Three-Terminal Setup

This guide uses 3 terminals for a smooth development experience:

1. **Terminal 1:** PostgreSQL setup & management
2. **Terminal 2:** Node.js server
3. **Terminal 3:** Testing with curl + jq

#### Terminal 1: PostgreSQL Setup

```bash
# Create PostgreSQL data directory (for Termux or custom setup)
mkdir -p ~/pg-a2a-card
cd ~/pg-a2a-card

# Initialize PostgreSQL cluster
initdb -D ~/pg-a2a-card

# Start PostgreSQL server (keep this terminal open)
pg_ctl -D ~/pg-a2a-card start

# Verify PostgreSQL is running
pg_ctl -D ~/pg-a2a-card status
# Output: pg_ctl: server is running (PID: XXXX)

# In the same terminal, connect to PostgreSQL
psql -h localhost -U postgres

# Inside psql, create admin user and database
CREATE USER admin WITH SUPERUSER CREATEDB;
CREATE DATABASE agentcard_db OWNER admin;

# Stay in psql (don't quit yet - you'll use it for migrations)
```

#### Terminal 2: Node.js Setup

```bash
# Clone repository
git clone https://github.com/Faishalbhitex/agent-register-ts.git
cd agent-register-ts

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env if needed (defaults should work)
# DB_URI=postgresql://admin@localhost:5432/agentcard_db

# Keep terminal open, will run server here
```

#### Terminal 1: Database Migrations (psql still open)

```sql
-- Make sure you're connected to agentcard_db in psql
-- If not: \c agentcard_db

-- Run migrations
\i migrations/001_create_users_table.sql
\i migrations/002_create_agents_table.sql
\i migrations/003_create_refresh_tokens_table.sql
\i migrations/004_add_role_to_users.sql

-- Verify tables created
\dt
-- You should see: agents, refresh_tokens, users tables

-- Stay in psql (keep it open for later steps)
```

#### Terminal 2: Start Node.js Server

```bash
npm run dev

# Expected output:
# Database connected
# Server running on http://localhost:3000
# Environment: development
# API base: http://localhost:3000/api
# Health: http://localhost:3000/health
# Token cleanup scheduler started
```

**Keep Terminal 2 running while testing!**

#### Terminal 3: Create Test Users

```bash
# Create User 1
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user1",
    "email": "user1@example.com",
    "password": "password123"
  }' | jq

# Create User 2
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user2",
    "email": "user2@example.com",
    "password": "password456"
  }' | jq

# Create Admin User
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin1",
    "email": "admin@example.com",
    "password": "admin123"
  }' | jq
```

#### Terminal 1: Update User Roles to Admin

```sql
-- Back in psql (Terminal 1)
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';

-- Verify
SELECT id, username, email, role FROM users;
-- Expected output:
--  id | username |       email        | role
-- ----+----------+--------------------+-------
--   1 | user1    | user1@example.com  | user
--   2 | user2    | user2@example.com  | user
--   3 | admin1   | admin@example.com  | admin
```

#### Terminal 3: Get User Tokens

```bash
# Login User 1 and save token
USER1_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@example.com","password":"password123"}')

USER1_TOKEN=$(echo $USER1_LOGIN | jq -r '.data.tokens.accessToken')

# Login User 2 and save token
USER2_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user2@example.com","password":"password456"}')

USER2_TOKEN=$(echo $USER2_LOGIN | jq -r '.data.tokens.accessToken')

# Login Admin and save token
ADMIN_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | jq -r '.data.tokens.accessToken')

# Verify tokens (should return user info)
curl -s http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $USER1_TOKEN" | jq '.data | {id, username, role}'
```

#### Terminal 1: Create Dummy Agents

```sql
-- Back in psql (Terminal 1)
-- Insert agents for User 1
INSERT INTO agents (name, description, url, user_id) VALUES
('Weather Service', 'Get weather information', 'http://localhost:4000/', 1),
('Calculator Service', 'Perform calculations', 'http://localhost:4001/', 1);

-- Insert agents for User 2
INSERT INTO agents (name, description, url, user_id) VALUES
('News Aggregator', 'Fetch latest news', 'http://localhost:4002/', 2),
('Translation Service', 'Translate text', 'http://localhost:4003/', 2);

-- Insert public agents (user_id IS NULL)
INSERT INTO agents (name, description, url, user_id) VALUES
('Public API Gateway', 'General purpose API', 'http://localhost:5000/', NULL),
('Health Monitor', 'System health check', 'http://localhost:5001/', NULL);

-- Verify
SELECT id, name, user_id FROM agents ORDER BY id;
-- Expected: 6 agents (2 for user1, 2 for user2, 2 public)
```

#### Terminal 3: Test Agent Endpoints

**Test 1: Public agents (no auth)**

```bash
# Anyone can see public agents
curl -s http://localhost:3000/api/agents | jq '.data | map({id, name, user_id})'
# Output: 2 public agents
```

**Test 2: User 1 - sees own + public agents**

```bash
curl -s http://localhost:3000/api/agents \
  -H "Authorization: Bearer $USER1_TOKEN" | jq '.data | map({id, name, user_id})'
# Output: 2 public + 2 user1 agents = 4 total
```

**Test 3: User 2 - sees own + public agents**

```bash
curl -s http://localhost:3000/api/agents \
  -H "Authorization: Bearer $USER2_TOKEN" | jq '.data | map({id, name, user_id})'
# Output: 2 public + 2 user2 agents = 4 total
```

**Test 4: Admin - sees ALL agents**

```bash
curl -s http://localhost:3000/api/agents \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data | map({id, name, user_id})'
# Output: 6 agents (all)
```

**Test 5: User 1 cannot modify User 2's agent**

```bash
curl -s -X PUT http://localhost:3000/api/agents/3 \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"hacked"}' | jq '.error'
# Output: "You can only manage your own agents"
```

**Test 6: User 1 can modify their own agent**

```bash
curl -s -X PUT http://localhost:3000/api/agents/1 \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Updated by User 1"}' | jq '.data.description'
# Output: "Updated by User 1"
```

**Test 7: Admin can modify ANY agent**

```bash
curl -s -X PUT http://localhost:3000/api/agents/3 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Updated by Admin"}' | jq '.data.description'
# Output: "Updated by Admin"
```

**Test 8: Test token refresh**

```bash
# Get refresh token from login response
REFRESH_TOKEN=$(echo $USER1_LOGIN | jq -r '.data.tokens.refreshToken')

# Use refresh token to get new access token
curl -s -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | jq '.data | {accessToken, refreshToken}'
```

### Cleanup: Delete Test Data

When you're done testing:

#### Terminal 1: Reset Database

```sql
-- Delete all agents first (due to foreign key)
DELETE FROM agents;

-- Reset sequence
ALTER SEQUENCE agents_id_seq RESTART WITH 1;

-- Delete all refresh tokens
DELETE FROM refresh_tokens;

-- Delete all users
DELETE FROM users;

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- Verify
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM agents;
SELECT COUNT(*) FROM refresh_tokens;
-- All should return 0

-- Exit psql
\q
```

#### Stop PostgreSQL (Terminal 1)

```bash
# Stop the PostgreSQL server
pg_ctl -D ~/pg-a2a-card stop

# Verify it stopped
pg_ctl -D ~/pg-a2a-card status
# Output: pg_ctl: no server running
```

#### Stop Node.js Server (Terminal 2)

```bash
# Press Ctrl+C to stop the server
Ctrl+C
```

---

## 📚 Full Documentation

### Project Structure

```
agent-register-ts/
├── migrations/              # Database migration files
│   ├── 001_create_users_table.sql
│   ├── 002_create_agents_table.sql
│   ├── 003_create_refresh_tokens_table.sql
│   └── 004_add_role_to_users.sql
├── src/
│   ├── config/             # Configuration
│   ├── controllers/        # Request handlers
│   ├── middlewares/        # Express middlewares
│   │   ├── auth.middleware.ts
│   │   ├── authorization.middleware.ts (RBAC)
│   │   └── optionalAuth.middleware.ts
│   ├── models/             # TypeScript interfaces
│   ├── repositories/       # Database operations
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── types/              # Type definitions
│   ├── utils/              # Utilities
│   │   ├── scheduler.ts    # Cron jobs
│   │   └── tokenCleanup.ts # Token cleanup
│   └── index.ts            # Entry point
├── .env.example
├── package.json
└── README.md
```

### API Endpoints Reference

**Authentication:**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | ❌ | Register new user (role: user) |
| `/api/auth/login` | POST | ❌ | Login, get access + refresh tokens |
| `/api/auth/refresh` | POST | ❌ | Refresh access token |
| `/api/auth/me` | GET | ✅ | Get current user info |

**Agents:**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/agents` | GET | ⚡ | List agents (public/user/admin view) |
| `/api/agents/:id` | GET | ❌ | Get agent by ID |
| `/api/agents` | POST | ✅ | Create agent (user becomes owner) |
| `/api/agents/:id` | PUT | ✅ | Update agent (owner or admin) |
| `/api/agents/:id` | DELETE | ✅ | Delete agent (owner or admin) |

**Legend:** ✅ Required | ❌ Not required | ⚡ Optional

### Role-Based Access Control

| Role | List All | Create | Update Own | Update Other | Delete Own | Delete Other |
|------|----------|--------|-----------|--------------|-----------|--------------|
| **user** | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Authentication Tokens

**Access Token:**
- Expires: 15 minutes (configurable via `JWT_EXPIRES_IN`)
- Used for: API requests
- Payload: `{ id, username, email, role }`

**Refresh Token:**
- Expires: 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)
- Used for: Getting new access token
- Storage: Database (for tracking and cleanup)

**Automatic Cleanup:**
- Expired refresh tokens are automatically deleted every 6 hours
- No manual intervention needed

### Configuration

Edit `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agentcard_db
DB_USER=admin
DB_PASSWORD=
DB_URI=postgresql://admin@localhost:5432/agentcard_db

# JWT (Access Token)
JWT_SECRET=jwt-super-secret-key-minimum-32-characters
JWT_EXPIRES_IN=15m

# JWT (Refresh Token)
JWT_REFRESH_SECRET=jwt-super-secret-refresh-key-different-from-access
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
```

### Security Features

✅ Dual-token JWT system (access + refresh)
✅ Role-Based Access Control (RBAC)
✅ Ownership-based authorization
✅ Automatic token cleanup
✅ Password hashing (bcryptjs - Termux compatible)
✅ Rate limiting (100 req/15min per IP)
✅ Helmet security headers
✅ CORS protection
✅ SQL injection protection (parameterized queries)
✅ Input validation

### Known Limitations

> ⚠️ **Token Blacklist/Denial:** Currently, the API relies on token expiration (15m for access tokens) for logout. Token blacklist functionality is planned for future versions. If immediate logout is required, users should discard their tokens and wait for expiration.

### Database Schema

**Users Table:**
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password_hash` - Hashed password
- `role` - 'user' or 'admin'
- `created_at`, `updated_at`

**Agents Table:**
- `id` - Primary key
- `name` - Unique agent name
- `description` - Agent description
- `url` - Agent server URL
- `user_id` - Owner ID (NULL = public agent)
- `created_at`, `updated_at`

**Refresh Tokens Table:**
- `id` - Primary key
- `user_id` - Token owner
- `token` - JWT token string
- `expires_at` - Expiration timestamp
- `created_at`

### Testing with A2A Agents

To test with a real A2A agent server:

```bash
# 1. Clone and setup A2A agent
git clone https://github.com/Faishalbhitex/ts-a2a-mcp.git
cd ts-a2a-mcp
npm install

# 2. Run agent (check README for specific commands)
npm run a2a:weather-agent  # Example

# 3. Register in your registry
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@example.com","password":"password123"}' | jq -r '.data.tokens.accessToken')

curl -X POST http://localhost:3000/api/agents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:4000/"}'
```

### Technologies Used

- **Node.js** 18+ with **TypeScript** 5.x
- **Express** 5.x for REST API
- **PostgreSQL** 17.x for data storage
- **JWT** for authentication
- **bcryptjs** for password hashing
- **node-cron** for scheduled tasks
- **Helmet**, **CORS**, **Rate Limit** for security
- **@a2a-js/sdk** for A2A Protocol support

### Troubleshooting

**"Database connection refused"**
- Make sure PostgreSQL is running: `pg_ctl -D ~/pg-a2a-card status`
- Verify `DB_URI` in `.env` is correct

**"Migration file not found"**
- Make sure you're in the project root directory
- Check migrations folder exists: `ls migrations/`

**"Port 3000 already in use"**
- Change `PORT` in `.env`
- Or kill the process: `lsof -i :3000`

**"Token expired error"**
- This is expected after 15 minutes
- Use refresh token endpoint to get new access token
- Or login again

---

## 📝 License

ISC License

## 👤 Author

**Faishal** - [@Faishalbhitex](https://github.com/Faishalbhitex)

## 🙏 Acknowledgments

- [A2A Protocol](https://a2a-protocol.org/latest/)
- [@a2a-js/sdk](https://github.com/a2aproject/a2a-js)

---

**Built with ❤️ for the AI Agent ecosystem**
