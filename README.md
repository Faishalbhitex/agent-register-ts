# Agent Card Registry API – Redis Blacklist Edition

A production-ready RESTful API for managing AI agent registrations using the [A2A (Agent-to-Agent) Protocol](https://github.com/a2aproject/A2A). Built with TypeScript, Express, PostgreSQL, and **Redis for real-time token revocation**.

> 🔥 **New in `gpt-redis-blacklist` branch:** Redis-based JWT blacklist system for immediate token revocation on logout.

---

## 🌟 Features

- **🤖 A2A Protocol Integration** - Automatic agent card fetching from agent servers
- **🔐 Dual-Token JWT Authentication** - Access (15m) + Refresh (7d) tokens with automatic rotation
- **🚫 Redis Token Blacklist** - **NEW!** Immediate token revocation on logout (no wait for expiry)
- **🛡️ Role-Based Access Control (RBAC)** - Admin and user roles with granular permissions
- **📊 Agent Registry** - Full CRUD operations for AI agent management
- **👤 Ownership-Based Authorization** - Users manage only their agents, admins manage all
- **🌐 Public Agent Discovery** - Public agents visible to all users
- **⚡ Token Lifecycle Management** - Automatic expired token cleanup with cron jobs
- **🔒 Security** - Rate limiting, helmet, CORS, bcryptjs (Termux-compatible)
- **⚡ Performance** - PostgreSQL connection pooling + Redis in-memory caching
- **🏗️ Clean Architecture** - MVC pattern with TypeScript for maintainability

---

## 🆕 What's New in This Branch (`gpt-redis-blacklist`)

| Feature | Description |
|---------|-------------|
| ✅ **Redis Integration** | Tracks blacklisted (revoked) access & refresh tokens in memory with TTL auto-expiry |
| ✅ **Secure Logout Flow** | `/api/auth/logout` immediately invalidates both access & refresh tokens |
| ✅ **Token Revocation Validation** | All protected routes verify tokens against Redis blacklist before processing |
| ✅ **PostgreSQL + Redis Hybrid** | PostgreSQL for persistent data, Redis for transient blacklists |
| 🧪 **Full Testing Flow** | Documented curl + jq commands for local verification |

---

## ⚙️ Architecture Overview

```
┌──────────────────────────┐
│      PostgreSQL          │
│ (Persistent Storage)     │
│  - users                 │
│  - agents                │
│  - refresh_tokens        │
└────────────┬─────────────┘
             │
             │
┌────────────▼─────────────┐
│      Node.js API         │
│ (Express + TypeScript)   │
│  - Auth Controller       │
│  - Redis Service         │
│  - Middleware Validator  │
└────────────┬─────────────┘
             │
             │
┌────────────▼─────────────┐
│         Redis            │
│ (In-memory blacklist)    │
│  - bl_<access_token>     │
│  - bl_<refresh_token>    │
│  - TTL = token.exp - now │
└──────────────────────────┘
```

**Token Lifecycle:**

| Action | Description |
|--------|-------------|
| **Login** | Generates Access + Refresh token |
| **`/api/auth/me`** | Validates access token (checks Redis blacklist) |
| **Logout** | Adds both tokens to Redis blacklist with TTL |
| **Blacklist TTL** | Matches each token's expiry time (`exp - now`) |
| **Access check** | Middleware denies request if token found in Redis |

---

## ⚡ Quick Start (5-10 minutes)

### Prerequisites

- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x with `pg_ctl` and `psql` CLI tools
- **Redis** >= 6.x
- **curl** and **jq** (for testing)

---

### Four-Terminal Setup

This guide uses 4 terminals for a smooth development experience:

1. **Terminal 1:** PostgreSQL setup & management
2. **Terminal 2:** Redis server
3. **Terminal 3:** Node.js server
4. **Terminal 4:** Testing with curl + jq

---

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

---

#### Terminal 2: Redis Setup

```bash
# Start Redis server
redis-server --daemonize yes

# Verify Redis is running
redis-cli ping
# Output: PONG

# Optional: Monitor Redis activity (keep terminal open)
redis-cli monitor
```

---

#### Terminal 3: Node.js Setup

```bash
# Clone repository
git clone https://github.com/Faishalbhitex/agent-register-ts.git
cd agent-register-ts

# Checkout Redis blacklist branch
git checkout gpt-redis-blacklist

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and add Redis URL
nano .env
```

**Required `.env` configuration:**

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

# Redis (NEW!)
REDIS_URL=redis://127.0.0.1:6379

# Server
PORT=3000
NODE_ENV=development
```

**Keep terminal open, will run server here.**

---

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

---

#### Terminal 3: Start Node.js Server

```bash
npm run dev

# Expected output:
# ✅ Redis connected successfully
# ✅ Database connected
# 🚀 Server running on http://localhost:3000
# Environment: development
# API base: http://localhost:3000/api
# Health: http://localhost:3000/health
# Token cleanup scheduler started
```

**Keep Terminal 3 running while testing!**

---

#### Terminal 4: Create Test Users

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

---

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

---

## 🧪 Testing Redis Blacklist System (Terminal 4)

### Test 1: Login and Save Tokens

```bash
# Login User 1 and save tokens
USER1_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@example.com","password":"password123"}')

USER1_ACCESS=$(echo $USER1_LOGIN | jq -r '.data.tokens.accessToken')
USER1_REFRESH=$(echo $USER1_LOGIN | jq -r '.data.tokens.refreshToken')

# Verify login worked
echo "Access Token: ${USER1_ACCESS:0:20}..."
echo "Refresh Token: ${USER1_REFRESH:0:20}..."
```

### Test 2: Verify Token Works Before Logout

```bash
# Get user info (should succeed)
curl -s http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $USER1_ACCESS" | jq '.data | {id, username, email, role}'

# Expected output: User 1 info
```

### Test 3: Logout (Add Tokens to Redis Blacklist)

```bash
# Logout User 1
curl -s -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"accessToken\":\"$USER1_ACCESS\",\"refreshToken\":\"$USER1_REFRESH\"}" | jq

# Expected output:
# {
#   "success": true,
#   "message": "Logout successful"
# }
```

---

#### Terminal 2: Verify Redis Blacklist (Check Redis Monitor)

```bash
# In Terminal 2, check Redis keys
redis-cli keys "bl_*"
# Output: Shows 2 keys (access + refresh token)

# Check TTL of access token (should be ~900 seconds = 15 minutes)
redis-cli ttl bl_$USER1_ACCESS

# Get token value (should be "revoked")
redis-cli get bl_$USER1_ACCESS
# Output: "revoked"
```

---

### Test 4: Verify Token is Rejected After Logout

```bash
# Try to access /me endpoint (should fail with 401)
curl -s http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $USER1_ACCESS" | jq

# Expected output:
# {
#   "success": false,
#   "error": "Token has been revoked"
# }
```

### Test 5: Verify Refresh Token is Also Blacklisted

```bash
# Try to refresh token (should fail with 401)
curl -s -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$USER1_REFRESH\"}" | jq

# Expected output:
# {
#   "success": false,
#   "error": "Invalid or expired refresh token"
# }
```

### Test 6: Verify New Login Works After Logout

```bash
# Login again (should succeed)
USER1_NEW_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@example.com","password":"password123"}')

USER1_NEW_ACCESS=$(echo $USER1_NEW_LOGIN | jq -r '.data.tokens.accessToken')

# Test new token works
curl -s http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $USER1_NEW_ACCESS" | jq '.data.username'
# Output: "user1"
```

---

## 📊 Agent Testing (Same as Before)

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
```

#### Terminal 4: Test Agent Endpoints

```bash
# Login again to get fresh token
USER1_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@example.com","password":"password123"}')

USER1_TOKEN=$(echo $USER1_LOGIN | jq -r '.data.tokens.accessToken')

# Test: User 1 sees own + public agents
curl -s http://localhost:3000/api/agents \
  -H "Authorization: Bearer $USER1_TOKEN" | jq '.data | map({id, name, user_id})'
# Output: 4 agents (2 own + 2 public)
```

---

## 🧹 Cleanup: Delete Test Data

### Terminal 1: Reset Database

```sql
-- Delete all agents first (due to foreign key)
DELETE FROM agents;
ALTER SEQUENCE agents_id_seq RESTART WITH 1;

-- Delete all refresh tokens
DELETE FROM refresh_tokens;

-- Delete all users
DELETE FROM users;
ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- Verify
SELECT COUNT(*) FROM users;    -- 0
SELECT COUNT(*) FROM agents;   -- 0
SELECT COUNT(*) FROM refresh_tokens; -- 0

-- Exit psql
\q
```

### Terminal 2: Clear Redis Blacklist

```bash
# Delete all blacklist keys
redis-cli --scan --pattern "bl_*" | xargs redis-cli del

# Verify cleared
redis-cli keys "bl_*"
# Output: (empty array)
```

### Stop Services

**Terminal 1: Stop PostgreSQL**
```bash
pg_ctl -D ~/pg-a2a-card stop
```

**Terminal 2: Stop Redis**
```bash
redis-cli shutdown
```

**Terminal 3: Stop Node.js**
```bash
# Press Ctrl+C
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
│   │   └── redis.ts        # ✨ NEW: Redis client setup
│   ├── controllers/        # Request handlers
│   │   └── auth.controller.ts  # ✨ UPDATED: Added logout
│   ├── middlewares/        # Express middlewares
│   │   ├── auth.middleware.ts  # ✨ UPDATED: Redis blacklist check
│   │   ├── authorization.middleware.ts (RBAC)
│   │   └── optionalAuth.middleware.ts
│   ├── models/             # TypeScript interfaces
│   ├── repositories/       # Database operations
│   ├── routes/             # API routes
│   │   └── auth.routes.ts  # ✨ UPDATED: Added /logout route
│   ├── services/           # Business logic
│   │   ├── auth.service.ts # ✨ UPDATED: Logout logic
│   │   └── redis.service.ts # ✨ NEW: Redis blacklist operations
│   ├── types/              # Type definitions
│   ├── utils/              # Utilities
│   │   ├── scheduler.ts    # Cron jobs
│   │   └── tokenCleanup.ts # Token cleanup
│   └── index.ts            # Entry point
├── .env.example
├── package.json
└── README.md
```

---

### API Endpoints Reference

**Authentication:**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | ❌ | Register new user (role: user) |
| `/api/auth/login` | POST | ❌ | Login, get access + refresh tokens |
| `/api/auth/logout` | POST | ❌ | **NEW!** Revoke access + refresh tokens (add to Redis blacklist) |
| `/api/auth/refresh` | POST | ❌ | Refresh access token (checks Redis blacklist) |
| `/api/auth/me` | GET | ✅ | Get current user info (checks Redis blacklist) |

**Agents:**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/agents` | GET | ⚡ | List agents (public/user/admin view) |
| `/api/agents/:id` | GET | ❌ | Get agent by ID |
| `/api/agents` | POST | ✅ | Create agent (user becomes owner) |
| `/api/agents/:id` | PUT | ✅ | Update agent (owner or admin) |
| `/api/agents/:id` | DELETE | ✅ | Delete agent (owner or admin) |

**Legend:** ✅ Required | ❌ Not required | ⚡ Optional

---

### Role-Based Access Control

| Role | List All | Create | Update Own | Update Other | Delete Own | Delete Other |
|------|----------|--------|-----------|--------------|-----------|--------------|
| **user** | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

### Authentication Tokens

**Access Token:**
- Expires: 15 minutes (configurable via `JWT_EXPIRES_IN`)
- Used for: API requests
- Payload: `{ id, username, email, role }`
- **Blacklist:** Stored in Redis with key `bl_<token>` on logout

**Refresh Token:**
- Expires: 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)
- Used for: Getting new access token
- Storage: PostgreSQL (for tracking) + Redis (for blacklist)
- **Blacklist:** Stored in Redis with key `bl_<token>` on logout

**Automatic Cleanup:**
- Redis TTL automatically expires blacklisted tokens (no manual cleanup needed)
- PostgreSQL expired refresh tokens cleaned every 6 hours via cron job

---

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

# Redis (NEW!)
REDIS_URL=redis://127.0.0.1:6379

# Server
PORT=3000
NODE_ENV=development
```

---

### Security Features

✅ Dual-token JWT system (access + refresh)  
✅ **Redis token blacklist for immediate revocation (NEW!)**  
✅ Role-Based Access Control (RBAC)  
✅ Ownership-based authorization  
✅ Automatic token cleanup (Redis TTL + PostgreSQL cron)  
✅ Password hashing (bcryptjs - Termux compatible)  
✅ Rate limiting (100 req/15min per IP)  
✅ Helmet security headers  
✅ CORS protection  
✅ SQL injection protection (parameterized queries)  
✅ Input validation  

---

### Known Limitations (Updated)

| Old Limitation | Status | Notes |
|----------------|--------|-------|
| ❌ Tokens only expire naturally | ✅ **Fixed** | Access & refresh tokens revoked instantly via Redis |
| ❌ Logout not immediate | ✅ **Fixed** | `/logout` adds tokens to Redis blacklist with TTL |
| ⚠️ Requires persistent DB for refresh token tracking | ✅ Still required | PostgreSQL still manages refresh token records for audit |

**Future Improvements:**
- Implement JTI (JWT ID) for more efficient token tracking
- Add Redis Cluster support for production scalability
- Implement token rotation on refresh

---

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

**Redis Blacklist Schema:**
- Key: `bl_<token_string>`
- Value: `"revoked"`
- TTL: `token.exp - current_time` (seconds)

---

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

---

### Technologies Used

- **Node.js** 18+ with **TypeScript** 5.x
- **Express** 5.x for REST API
- **PostgreSQL** 17.x for data storage
- **Redis** 6.x+ for token blacklist (NEW!)
- **JWT** for authentication
- **bcryptjs** for password hashing
- **node-cron** for scheduled tasks
- **Helmet**, **CORS**, **Rate Limit** for security
- **@a2a-js/sdk** for A2A Protocol support

---

### Troubleshooting

**"Redis connection refused"**
- Make sure Redis is running: `redis-cli ping`
- Verify `REDIS_URL` in `.env` is correct
- Check Redis logs: `redis-cli monitor`

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

**"Token still works after logout" (Bug)**
- Check Redis connection: `redis-cli ping`
- Verify token is in blacklist: `redis-cli keys "bl_*"`
- Check server logs for Redis errors

---

## 🧪 Development Notes

> **Branch Status:** This version (`gpt-redis-blacklist`) is experimental and not yet merged to `master`.
> 
> **Purpose:** Testing Redis blacklist behavior and validating stability before refactoring to JTI-based system.
> 
> **Next Steps:** 
> - [ ] Add comprehensive unit tests for Redis service
> - [ ] Implement JTI (JWT ID) for optimized token tracking
> - [ ] Add Redis Cluster support for production
> - [ ] Performance testing with high token volume

---

## 📝 License

ISC License

## 👤 Author

**Faishal** - [@Faishalbhitex](https://github.com/Faishalbhitex)

## 🙏 Acknowledgments

- [A2A Protocol](https://a2a-protocol.org/latest/)
- [@a2a-js/sdk](https://github.com/a2aproject/a2a-js)
- [Redis](https://redis.io/) for in-memory data structures

---

**Built with ❤️ for the AI Agent ecosystem**
