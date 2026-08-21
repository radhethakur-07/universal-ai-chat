# SIH Judge Q&A — Universal AI Chat Interface

> **Team: Dev Dynasty | Team ID: 34 | Problem Statement: PS12 | SIH 2026**

---

## Q1: How will this work in a real-world business?

**Answer:**

A business installs the system and configures a **Project** that describes their data structure — collections, field types, allowed operations, and registered functions. No code change is required to adapt to a new business domain.

A business user then opens the chat interface and asks natural language questions like:
- *"Show all overdue invoices from Maharashtra"*
- *"What's our revenue from the South region this month?"*
- *"Update customer CUST-005's segment to enterprise"*

The Gemini AI model interprets the intent, calls the appropriate registered tool, and the backend retrieves real data from the company's database — then presents it as a table, chart, or confirmation card.

The ROI: employees who previously needed training on 5 different dashboards now use one interface. Data is always live. Mutations require confirmation, so accidental changes are prevented.

---

## Q2: What if the company uses MySQL?

**Answer:**

The architecture uses a `DataAdapter` interface that abstracts all database operations:

```typescript
interface DataAdapter {
  query(params): Promise<Record[]>;
  update(params): Promise<Result>;
  aggregate(entity, pipeline): Promise<Record[]>;
  findById(entity, id): Promise<Record | null>;
}
```

To support MySQL, we would implement a `MySQLAdapter` that:
- Uses parameterized queries via `mysql2` library
- Maps our filter operators to SQL `WHERE` clauses
- Translates aggregation requests to `GROUP BY` / `SUM()` queries

The React chat UI, Gemini function calling, Zod validation, and tool registry remain **completely unchanged**. Only the adapter changes.

We have NOT implemented MySQL in this MVP — MongoDB Atlas was chosen for speed of development. We would be misleading judges to claim MySQL support is implemented.

---

## Q3: What if the company uses PostgreSQL?

**Answer:**

Same answer as MySQL — implement a `PostgreSQLAdapter` using `pg` (node-postgres) library with parameterized `$1, $2...` queries. The interface contract is identical. We explicitly designed the `DataAdapter` interface for this extensibility. Again, not implemented in this MVP but the architecture is designed for it.

---

## Q4: Does the LLM directly access the database?

**Answer:** **No. Never.**

This is the most critical security boundary in our architecture.

**What Gemini sees:**
- System prompt with project context (collection names, field descriptions)
- User message
- Tool call results (data returned by our backend)

**What Gemini does NOT see:**
- MongoDB connection string
- Database credentials
- Raw database queries
- Any internal system details

**How data flows:**
```
Gemini → returns function_call("query_data", { entity: "orders", ... })
Backend → receives function_call arguments
Backend → validates with Zod
Backend → MongoDBAdapter.query() executes safe Mongoose query
Backend → returns results to Gemini as function response
```

Gemini never writes a MongoDB query. The backend controls all execution.

---

## Q5: How do you prevent unauthorized actions?

**Answer:**

Multiple layers:
1. **JWT authentication** — every request verified server-side
2. **Entity whitelist** — MongoDBAdapter only allows `['orders', 'customers', 'products', 'invoices']`
3. **Tool whitelist** — `ALLOWED_TOOLS` Set prevents calling unregistered tools
4. **Zod validation** — all LLM-generated arguments validated before use
5. **Confirmation flow** — mutations require explicit user confirmation
6. **Project membership** — users can only access their own projects
7. **Audit logging** — every action recorded with user, timestamp, success/failure
8. **Rate limiting** — prevents abuse of the AI endpoint

---

## Q6: How do you prevent hallucinated queries?

**Answer:**

We use **Gemini function calling** (structured outputs), not free-form text generation for data access:

1. Gemini must choose from a predefined set of tool functions
2. Tool arguments are strictly typed with parameter schemas
3. Zod validates every argument before execution
4. If Gemini generates invalid arguments, Zod throws an error
5. The error is returned to Gemini, which then generates a safe error response
6. The MongoDB adapter only builds safe queries from validated parameters

Gemini cannot "make up" a MongoDB query. It can only call defined tools with valid arguments.

---

## Q7: How are mutations handled?

**Answer:**

Mutations follow a **two-phase commit** pattern:

**Phase 1 — Intent capture:**
1. User says "Update order ORD-101 to shipped"
2. Gemini calls `update_data({ entity: "orders", recordId: "ORD-101", updates: { status: "shipped" } })`
3. Backend validates with Zod
4. Backend stores the pending action with a UUID `actionId` (expires in 5 minutes)
5. Frontend renders a `ConfirmationCard` showing the change preview

**Phase 2 — Execution:**
1. User clicks "Confirm"
2. Frontend sends `POST /api/chat/confirm { actionId, confirmed: true }`
3. Backend validates: actionId exists, belongs to current user, not expired
4. MongoDB update is executed
5. AuditLog entry created
6. Success response returned

**Cancellation:** If user clicks "Cancel" or confirmation expires, the action is discarded. No data is changed.

---

## Q8: Why is this different from a normal chatbot?

**Answer:**

A normal chatbot is pre-programmed with static responses. If you ask it about orders, it returns a fixed template answer.

Universal AI is different:

| Feature | Normal Chatbot | Universal AI |
|---------|---------------|-------------|
| Data | Hardcoded or mocked | Real database query |
| Actions | Cannot modify anything | Executes real mutations |
| Analytics | Shows static images | Generates live charts |
| Intelligence | Pattern matching | Gemini LLM reasoning |
| Domains | Fixed domain | Any business domain |
| Architecture | Monolithic | Pluggable adapters |

Our system actually executes real database operations, renders live Recharts visualizations, and confirms mutations before execution. This is a production-grade system, not a chatbot demo.

---

## Q9: How is this domain-agnostic?

**Answer:**

The system is domain-agnostic because the business context is **data-driven, not code-driven**:

1. A business configures a **Project** with their collections, field types, and allowed operations
2. The system prompt is **generated dynamically** from this configuration
3. Gemini understands the domain from the system prompt alone
4. No code changes are required to support a new domain

Examples:
- **E-Commerce:** orders, products, customers, invoices
- **Hospital:** patients, appointments, prescriptions, doctors
- **Manufacturing:** materials, machines, production runs, quality reports
- **HR:** employees, payroll, leaves, departments

Same code. Different project configuration. Different domain.

---

## Q10: How do you scale it?

**Answer:**

**Current (Hackathon MVP):**
- Render (backend) — horizontally scalable Web Services
- Vercel (frontend) — edge network CDN, zero config scaling
- MongoDB Atlas — auto-scaling cluster

**Production scaling path:**
- Replace in-memory confirmation store with Redis cluster
- Add connection pooling (Mongoose already does this)
- Add response caching for read-heavy queries
- Use Gemini's streaming API for real-time responses
- Add message queue (BullMQ) for async processing
- Deploy backend on Kubernetes for fine-grained scaling

**Cost efficiency:** Gemini function calling is token-efficient because we only send the relevant project context, not the full database. System prompts are kept concise.

---

## Q11: What happens if Gemini is unavailable?

**Answer:**

The application has structured error handling at every level:

1. `runGeminiChat()` throws an error if Gemini API fails
2. `chatController` catches this error
3. Returns `{ message: "I encountered an error processing your request. Please try again.", responseType: "error" }`
4. Frontend displays the error message in the chat
5. No crash, no stack trace exposed to the user

**For production:** We would implement exponential backoff retry, fallback to cached responses for common queries, and an admin alert when Gemini error rate exceeds threshold.

---

## Q12: How are external APIs integrated?

**Architecture (not yet implemented in MVP):**

We would add an `APIAdapter` that implements `DataAdapter`:
1. Business registers an API endpoint in Project configuration
2. Gemini calls `query_data({ entity: "shipments", ... })`
3. Action Dispatcher detects this entity is mapped to an external API
4. `APIAdapter` makes a safe HTTP request with proper auth headers
5. Response is normalized and returned

The Gemini layer and React UI remain unchanged. Only the adapter changes.

---

## Q13: How do you handle sensitive business data?

**Answer:**

1. **At rest:** MongoDB Atlas encrypts data at rest by default
2. **In transit:** TLS/HTTPS enforced by Vercel and Render
3. **In prompt:** System prompt only describes structure (field names/types), never actual sensitive data values
4. **In logs:** Winston logger explicitly filters sensitive fields — never logs API keys, JWTs, or passwords
5. **In audit trail:** AuditLog stores action metadata but not raw query results
6. **Access control:** JWT authentication + project membership ensures users only see their own data

---

## Q14: Why MongoDB for the prototype?

**Answer:**

1. **No installation required** — MongoDB Atlas has a free cloud tier accessible from any browser
2. **Flexible schema** — rapid prototyping without migration scripts
3. **Mongoose** — excellent TypeScript support, clean query API
4. **Aggregation pipeline** — powerful enough for all our analytics use cases
5. **JSON-native** — data flows naturally between MongoDB, Node.js, and the React frontend
6. **Real-world relevance** — MongoDB is widely used in Indian startups and e-commerce platforms

The architecture explicitly supports SQL databases via the `DataAdapter` interface.

---

## Q15: How can the architecture support SQL databases?

**Answer:**

The `DataAdapter` interface in `server/src/adapters/DataAdapter.ts` defines the contract:

```typescript
interface DataAdapter {
  query(params: QueryParams): Promise<Record<string, unknown>[]>;
  update(params: UpdateParams): Promise<{ success: boolean; record? }>;
  count(entity: string, filters?): Promise<number>;
  aggregate(entity: string, pipeline): Promise<Record<string, unknown>[]>;
  findById(entity: string, id: string): Promise<Record<string, unknown> | null>;
}
```

A `MySQLAdapter` would:
- Convert `FilterCondition[]` → `WHERE field operator ?` with parameterized values
- Convert `aggregateFunc` → `SUM()`, `COUNT()`, `AVG()` etc.
- Use `JOIN` for entity relationships
- Use `mysql2` with prepared statements for security

The Action Dispatcher would swap adapters based on project configuration. **No other file changes required.**

---

## Demo Script — 5 Key Scenarios

### Scenario 1: Query
> **"Show me today's orders"**

Expected: Table of orders created today

### Scenario 2: Filter
> **"Show Mumbai orders above ₹5000"**

Expected: Filtered table with city=Mumbai and totalAmount > 5000

### Scenario 3: Answer
> **"What is the total unpaid invoice amount?"**

Expected: Calculated answer using `calculateInvoiceTotal` function

### Scenario 4: Analytics
> **"Generate a bar chart of revenue by region"**

Expected: Recharts BarChart with North/South/East/West/Central regions

### Scenario 5: Mutation
> **"Update order ORD-101 to shipped"**

Expected: Confirmation card → Click Confirm → Success message

---

*Prepared for Smart India Hackathon 2026 — Team Dev Dynasty — PS12*
