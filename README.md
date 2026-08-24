# Universal AI Chat Interface

> **Smart India Hackathon 2026** | Team: **Dev Dynasty** | Team ID: **34** | Problem Statement: **PS12**

A domain-agnostic AI conversational interface that allows users to interact with business data, APIs, dashboards, forms, registered functions and analytics using **natural language** — powered by Google Gemini function calling.

---

## 📽️ Demo

| Scenario | Input | Output |
|----------|-------|--------|
| Query | "Show me today's orders" | Interactive data table |
| Filter | "Show Mumbai orders above ₹5000" | Filtered table |
| Answer | "What is the total unpaid invoice amount?" | Calculated answer |
| Analytics | "Generate a bar chart of revenue by region" | Recharts visualization |
| Mutation | "Update order ORD-101 to shipped" | Confirmation card → Execute |

---

## 🏗️ Architecture

```
User
 ↓
React Chat UI (Vite + TypeScript + Zustand + Recharts)
 ↓
Node.js + Express Backend (TypeScript)
 ↓
Gemini LLM (Function Calling)
 ↓
Zod Validation → Authorization
 ↓
Tool Registry → Action Dispatcher
 ↓
MongoDB DataAdapter
 ↓
MongoDB Atlas
 ↓
Response Formatter → Chat UI
```

**Core Security Principle:** The LLM interprets user intent. The backend controls all execution.

---

## ✨ Features

- 🤖 **Real Gemini AI** — function calling, structured outputs, no fake responses
- 📊 **Interactive Tables** — filtered, paginated data results
- 📈 **Live Charts** — Bar, Line, Pie charts via Recharts
- ✅ **Mutation Confirmation** — never silently mutates data
- 📝 **Conversation History** — full multi-turn conversations, stored in MongoDB
- 🔐 **JWT Authentication** — secure login/register
- 🛡️ **Production Security** — Helmet, CORS, rate limiting, Zod validation
- 📋 **Audit Logging** — every action logged
- 🎨 **Premium SaaS UI** — dark mode, responsive, modern design

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Zustand, Recharts, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript |
| **AI** | Google Gemini API (function calling) |
| **Database** | MongoDB Atlas, Mongoose |
| **Auth** | JWT + bcrypt |
| **Validation** | Zod |
| **Logging** | Winston |
| **Deployment** | Vercel (frontend) + Render (backend) + MongoDB Atlas |

---

## 📁 Project Structure

```
universal-ai-chat/
├── server/                    # Express backend
│   └── src/
│       ├── ai/                # Gemini client + system prompt
│       ├── adapters/          # DataAdapter + MongoDBAdapter
│       ├── config/            # DB config, env validation
│       ├── controllers/       # Route handlers
│       ├── middleware/        # Auth, error handling
│       ├── models/            # Mongoose models
│       ├── routes/            # Express routes
│       ├── services/          # Chat service (orchestration)
│       ├── tools/             # Tool registry + handlers
│       ├── types/             # TypeScript types
│       ├── utils/             # Logger, seed script
│       └── validators/        # Zod schemas
│
├── client/                    # React frontend
│   └── src/
│       ├── components/        # UI components
│       │   ├── chat/          # Chat area, input, renderers
│       │   └── layout/        # Sidebar, TopBar
│       ├── lib/               # Axios instance
│       ├── pages/             # Login, Register, Chat
│       ├── services/          # API service layer
│       ├── store/             # Zustand stores
│       └── types/             # TypeScript types
│
├── README.md
├── DEPLOYMENT.md
```

---

## 🚀 Quick Start (Local Development)

> **No local installations required** — uses cloud services only.
> You only need a browser + GitHub access + cloud accounts.

### Prerequisites (Cloud Only)
- [MongoDB Atlas account](https://cloud.mongodb.com) — free tier works
- [Google AI Studio](https://aistudio.google.com) — get Gemini API key
- [GitHub account](https://github.com) — for repository
- [Vercel account](https://vercel.com) — for frontend
- [Render account](https://render.com) — for backend

See **DEPLOYMENT.md** for complete step-by-step instructions.

---

## 🔑 Environment Variables

### Backend (`server/.env`)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/universal_ai_chat
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
JWT_SECRET=your_very_long_random_secret_at_least_64_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

> **⚠️ Never commit actual API keys.** Copy `.env.example` → `.env` and fill in your values.

---

## 🌱 Seeding Demo Data

After setting up MongoDB, run the seed script via the Render backend console or locally:

```bash
cd server
npm run seed
```

This creates:
- **15 customers** across Indian cities
- **15 products** (electronics, furniture)
- **30 orders** with realistic data
- **25 invoices** linked to orders
- **1 demo user**: `demo@devdynasty.in` / `DevDynasty@SIH2026`
- **1 E-Commerce Demo project**

---

## 📚 Documentation

| File | Description |
|------|-------------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Step-by-step production deployment |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Complete technical architecture |

---

## 🔒 Security

- Gemini API key — server-side only
- MongoDB URI — server-side only
- JWT verification on all protected routes
- Zod validates ALL LLM-generated function arguments
- Tool registry whitelist — no dynamic code execution
- Rate limiting on chat endpoint
- Helmet security headers
- CORS restricted to known origins
- Audit log for all mutations

---

## 🗺️ Future Roadmap

- [ ] MySQL/PostgreSQL adapters
- [ ] Real-time streaming responses (SSE)
- [ ] Voice input
- [ ] Multi-project management
- [ ] Role-based access control
- [ ] REST API connector
- [ ] GraphQL connector
- [ ] CSV/Excel export
- [ ] Custom function registration UI
- [ ] Webhook integrations

---

## 👥 Team Dev Dynasty

**Smart India Hackathon 2026 | Team ID: 34 | Problem Statement: PS12**

Built with ❤️ using Google Gemini, React, Node.js, and MongoDB Atlas.
