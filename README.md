# Agent Card Registry API

A production-ready RESTful API for managing AI agent registrations using the [A2A (Agent-to-Agent) Protocol](https://github.com/a2aproject/A2A). Built with TypeScript, Express, and PostgreSQL.

## 🌟 Features

- **🤖 A2A Protocol Integration** - Automatic agent card fetching from agent servers
- **🔐 JWT Authentication** - Secure user registration and login with 7-day token expiry
- **📊 Agent Registry** - Full CRUD operations for AI agent management
- **🔍 Public Discovery API** - Enable AI agents to discover available services
- **🛡️ Security** - Rate limiting, helmet, CORS, and bcrypt password hashing
- **⚡ Performance** - PostgreSQL connection pooling and optimized queries
- **🏗️ Clean Architecture** - MVC pattern with TypeScript for maintainability

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Testing with A2A Agent](#testing-with-a2a-agent)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Contributing](#contributing)
- [License](#license)

## 🔧 Prerequisites

- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x
- **npm** or **yarn**
- **curl** and **jq** (for testing)

## 📦 Installation

1. **Clone the repository**

```bash
git clone https://github.com/Faishalbhitex/agent-register-ts.git
cd agent-register-ts
```

2. **Install dependencies**

```bash
npm install
```

3. **Copy environment variables**

```bash
cp .env.example .env
```

## 🗄️ Database Setup

1. **Start PostgreSQL**

```bash
# For Termux (Android)
pg_ctl -D $HOME/pg-a2a-card start

# For standard installations
sudo systemctl start postgresql
```

2. **Create database**

```bash
createdb -U admin agentcard_db
```

3. **Run migrations**

```bash
psql -U admin -d agentcard_db

# Inside psql:
\i migrations/001_create_users_table.sql
\i migrations/002_create_agents_table.sql

# Verify tables
\dt
\q
```

## ⚙️ Configuration

Edit `.env` file with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agentcard_db
DB_USER=admin
DB_PASSWORD=your_password
DB_URI=postgresql://admin:your_password@localhost:5432/agentcard_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
```

## 🚀 Running the Application

**Development mode:**

```bash
npm run dev
```

**Expected output:**

```
Database connected
Server running on http://localhost:3000
Environment: development
API base: http://localhost:3000/api
Health: http://localhost:3000/health
```

## 📡 API Endpoints

### Health Check

```bash
GET /health
```

### Authentication

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth/register` | POST | ❌ | Register new user |
| `/api/auth/login` | POST | ❌ | Login user |
| `/api/auth/me` | GET | ✅ | Get current user info |

### Agents

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/agents` | GET | ❌ | List all agents (Public Discovery) |
| `/api/agents/:id` | GET | ❌ | Get agent by ID |
| `/api/agents` | POST | ✅ | Register new agent |
| `/api/agents/:id` | PUT | ✅ | Update agent |
| `/api/agents/:id` | DELETE | ✅ | Delete agent |

### Example Requests

**Register User:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password_hash": "secure_password123"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secure_password123"
  }'
```

**Register Agent (with A2A):**

```bash
TOKEN="your_jwt_token"

curl -X POST http://localhost:3000/api/agents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:4000/"
  }'
```

**Get All Agents:**

```bash
curl http://localhost:3000/api/agents
```

## 🧪 Testing with A2A Agent

To test agent registration with a real A2A agent server:

1. **Clone the weather agent repository:**

```bash
git clone https://github.com/Faishalbhitex/ts-a2a-mcp.git
cd ts-a2a-mcp
```

2. **Follow the setup in that repository's README**

3. **Run the weather agent:**

```bash
npm install
npm run mcp:weather  # Terminal 1
npm run a2a:weather-agent  # Terminal 2
```

4. **Copy the agent server URL** (e.g., `http://localhost:4000/`)

5. **Register the agent:**

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' | jq -r '.data.token')

curl -X POST http://localhost:3000/api/agents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:4000/"}'
```

The API will automatically fetch the agent card from `http://localhost:4000/.well-known/agent-card.json` and register it.

## 📁 Project Structure

```
agent-register-ts/
├── migrations/              # Database migration files
│   ├── 001_create_users_table.sql
│   └── 002_create_agents_table.sql
├── src/
│   ├── config/             # Configuration files
│   │   ├── db.ts           # Database connection
│   │   └── env.ts          # Environment variables
│   ├── controllers/        # Request handlers
│   │   ├── agent.controller.ts
│   │   └── auth.controller.ts
│   ├── middlewares/        # Express middlewares
│   │   ├── auth.middleware.ts
│   │   └── errorHandler.ts
│   ├── models/             # TypeScript interfaces
│   │   ├── agent.model.ts
│   │   └── user.model.ts
│   ├── repositories/       # Database operations
│   │   ├── agent.repository.ts
│   │   └── user.repository.ts
│   ├── routes/             # API routes
│   │   ├── agent.routes.ts
│   │   ├── auth.routes.ts
│   │   └── index.ts
│   ├── services/           # Business logic
│   │   ├── a2a.service.ts
│   │   ├── agent.service.ts
│   │   └── auth.service.ts
│   ├── types/              # TypeScript type definitions
│   │   └── express.d.ts
│   ├── utils/              # Utility functions
│   │   ├── errors.ts
│   │   └── response.ts
│   └── index.ts            # Application entry point
├── .env.example            # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Technologies

- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.x
- **Framework:** Express 5.x
- **Database:** PostgreSQL 17.x
- **Authentication:** JWT + bcryptjs
- **Security:** Helmet, CORS, express-rate-limit
- **A2A SDK:** @a2a-js/sdk
- **Dev Tools:** tsx (TypeScript executor)

## 🔒 Security Features

- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **JWT Tokens** - Secure authentication with expiry
- ✅ **Rate Limiting** - 100 requests per 15 minutes per IP
- ✅ **Helmet** - Security headers
- ✅ **CORS** - Cross-origin resource sharing
- ✅ **Input Validation** - Request body validation
- ✅ **SQL Injection Protection** - Parameterized queries
- ✅ **Error Handling** - No sensitive data in error responses

## 📊 Database Schema

### Users Table

```sql
- id (SERIAL PRIMARY KEY)
- username (VARCHAR(50) UNIQUE NOT NULL)
- email (VARCHAR(255) UNIQUE NOT NULL)
- password_hash (VARCHAR(255) NOT NULL)
- created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
```

### Agents Table

```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR(255) UNIQUE NOT NULL)
- description (TEXT)
- url (VARCHAR(500) UNIQUE NOT NULL)
- user_id (INTEGER REFERENCES users(id))
- created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
```

## 🧪 Testing

**Test health endpoint:**

```bash
curl http://localhost:3000/health | jq
```

**Test rate limiting:**

```bash
for i in {1..105}; do
  curl -s -o /dev/null -w "Request $i: %{http_code}\n" http://localhost:3000/health
  sleep 0.05
done
```

**Test authentication flow:**

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password_hash":"test123"}'

# Login & save token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' | jq -r '.data.token')

# Get user info
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👤 Author

**Faishal**

- GitHub: [@Faishalbhitex](https://github.com/Faishalbhitex)

## 🙏 Acknowledgments

- [A2A Protocol](https://a2a-protocol.org/latest/) - Agent-to-Agent communication standard
- [@a2a-js/sdk](https://github.com/a2aproject/a2a-js) - JavaScript SDK for A2A Protocol

## 📚 Resources

- [A2A Protocol Documentation](https://a2a-protocol.org/latest/)
- [A2A JavaScript SDK](https://github.com/a2aproject/a2a-js)
- [Example Weather Agent](https://github.com/Faishalbhitex/ts-a2a-mcp)

---

**Built with ❤️ for the AI Agent ecosystem**
