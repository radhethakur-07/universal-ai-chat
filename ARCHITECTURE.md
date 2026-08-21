# Architecture Guide — Universal AI Chat Interface

> **Team: Dev Dynasty | SIH 2026 | PS12**

---

## Complete Request Lifecycle

```
1. User types a message in the React Chat UI
2. ChatInput sends POST /api/chat with { message, projectId, conversationId }
3. Backend: JWT verified by authenticate middleware
4. Backend: chatService loads the Project from MongoDB (with collections + functions context)
5. Backend: builds systemPrompt with project context
6. Backend: sends message + history to Gemini via runGeminiChat()
7. Gemini: understands intent and returns a function_call (e.g. query_data)
8. Backend: toolHandlers[functionName](args, userId, projectId) is called
9. Backend: Zod validates args before execution
10. Backend: MongoDBAdapter executes safe query/update/aggregate
11. Backend: result returned to Gemini as function response
12. Gemini: generates final natural-language text response
13. Backend: formats result as { type, data } (table/chart/confirmation/text)
14. Backend: saves messages to Conversation in MongoDB
15. Backend: creates AuditLog entry
16. Frontend: receives { message, responseType, responseData }
17. Frontend: MessageBubble renders text + appropriate renderer (Table/Chart/Confirmation)
```

---

## Frontend ↔ Backend Communication

All API calls go through `client/src/lib/api.ts` (Axios instance):
- Base URL: `VITE_API_BASE_URL` environment variable
- JWT token injected via request interceptor
- 401 response triggers automatic logout

**Endpoints:**
| Route | Purpose |
|-------|---------|
| `POST /api/auth/login` | Login, returns JWT |
| `POST /api/auth/register` | Register, returns JWT |
| `GET /api/auth/me` | Validate token, get user |
| `GET /api/projects` | List user's projects |
| `GET /api/conversations?projectId=` | List conversations |
| `GET /api/conversations/:id` | Get full conversation with messages |
| `POST /api/chat` | Main AI endpoint |
| `POST /api/chat/confirm` | Execute a confirmed mutation |
| `DELETE /api/conversations/:id` | Soft-delete conversation |
| `GET /api/health` | Health check |

---

## Gemini Interaction

**File:** `server/src/ai/geminiClient.ts`

The application uses **Gemini function calling** (not raw text generation):

1. Tools are declared as `FunctionDeclaration[]` with typed parameter schemas
2. Gemini model is initialized with `tools: geminiTools`
3. `model.startChat({ history })` preserves conversation context
4. After `chat.sendMessage(userMessage)`, we check `response.functionCalls()`
5. If a function call exists, we execute it via `onToolCall(name, args)`
6. The result is sent back as `{ functionResponse: { name, response: { result } } }`
7. This loop repeats up to 5 times (prevents infinite loops)
8. Final `response.text()` is the natural language answer

**Model configured via `GEMINI_MODEL` env var** — defaults to `gemini-2.0-flash`

---

## Function Calling Flow

```
Gemini returns: query_data({ entity: "orders", filters: [...] })
                           ↓
toolHandlers["query_data"](args, userId, projectId)
                           ↓
queryParamsSchema.parse(args)  ← Zod validation
                           ↓
MongoDBAdapter.query(validatedParams)
                           ↓
Mongoose find() with safe filter builder
                           ↓
Returns: Record<string, unknown>[]
                           ↓
Gemini receives result → generates natural language response
```

**Available Tools:**
| Tool Name | Purpose |
|-----------|---------|
| `query_data` | Query any registered entity with filters |
| `update_data` | Stage a mutation (creates confirmation) |
| `get_analytics` | Run aggregation pipeline for charts |
| `run_function` | Execute a registered business function |
| `get_record` | Fetch a single record by ID |

---

## Structured Output & Zod Validation

**File:** `server/src/validators/schemas.ts`

Every LLM-generated function call is validated with Zod before execution:

```typescript
// Example: query_data tool arguments
const queryParamsSchema = z.object({
  entity: z.string().min(1).max(100),
  filters: z.array(filterConditionSchema).optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  ...
});

// Usage in toolHandlers
const params = queryParamsSchema.parse(args);  // throws ZodError if invalid
```

**If Zod throws:** the error is caught, logged, and returned to Gemini as `{ error: "..." }`. Gemini then either retries or generates an error message. The application never crashes from invalid LLM output.

---

## Authorization

Currently implemented:
- **Authentication:** JWT middleware on all protected routes
- **Project access:** `Project.find({ $or: [{ owner: userId }, { members: userId }] })`
- **Entity whitelist:** `MongoDBAdapter` only allows `['orders', 'customers', 'products', 'invoices']`
- **Tool whitelist:** Only tools in `ALLOWED_TOOLS` Set can be called
- **Mutation confirmation:** `update_data` always requires user confirmation before executing

**Future enhancement:** Role-based permissions per collection (admin/user/viewer).

---

## Tool Registry

**File:** `server/src/tools/registry.ts`

```typescript
export const toolHandlers: Record<string, Handler> = {
  query_data: async (args, userId, projectId) => { ... },
  update_data: async (args, userId, projectId) => { ... },
  get_analytics: async (args, userId, projectId) => { ... },
  run_function: async (args, userId, projectId) => { ... },
  get_record: async (args, userId, projectId) => { ... },
};
```

**Security rule:** The LLM can only call tools in this map. Any unknown tool name throws an error.

Registered business functions:
| Function | Description |
|----------|-------------|
| `getOrderSummary` | Order counts by status |
| `calculateInvoiceTotal` | Total invoice amount by status |
| `getTopProducts` | Top N products by revenue (unwinds order items) |
| `calculateRevenueByRegion` | Revenue grouped by region |

---

## Action Dispatcher

**File:** `server/src/services/chatService.ts`

`processChat()` is the orchestrator:
1. Validates input with `chatMessageSchema`
2. Loads project + builds system prompt
3. Loads/creates conversation
4. Calls `runGeminiChat()` with an `onToolCall` callback
5. Inside `onToolCall`:
   - Checks tool is in `ALLOWED_TOOLS`
   - Executes `toolHandlers[toolName](args, userId, projectId)`
   - Creates `AuditLog` entry
   - Captures UI response data from first significant tool result
6. Saves messages to Conversation
7. Returns final response

---

## MongoDB DataAdapter

**File:** `server/src/adapters/MongoDBAdapter.ts`

Implements the `DataAdapter` interface:
```typescript
interface DataAdapter {
  query(params: QueryParams): Promise<Record<string, unknown>[]>;
  update(params: UpdateParams): Promise<{ success: boolean; record? }>;
  count(entity: string, filters?): Promise<number>;
  aggregate(entity: string, pipeline): Promise<Record<string, unknown>[]>;
  findById(entity: string, id: string): Promise<Record<string, unknown> | null>;
}
```

**Safe query builder:** `buildMongoFilter()` maps filter operators to MongoDB operators (`$eq`, `$gt`, `$regex`, etc.) — never exposes raw query objects to Gemini.

---

## Analytics Pipeline

For `get_analytics`:
1. Zod validates: entity, chartType, groupBy, aggregateField, aggregateFunc
2. Backend builds MongoDB aggregation pipeline:
   ```js
   [{ $match: filters }, { $group: { _id: "$groupBy", value: $aggFunc } }, { $sort }, { $limit }]
   ```
3. Result: `[{ region: "North", value: 450000 }, ...]`
4. Frontend receives `{ type: "chart", chartType: "bar", data, xKey, yKey }`
5. `ChartRenderer.tsx` renders via Recharts `<BarChart>`, `<LineChart>`, or `<PieChart>`

**The LLM never touches chart rendering logic.** It only selects what to aggregate.

---

## Confirmation Flow (Mutation Safety)

```
User: "Update order ORD-101 to shipped"
          ↓
Gemini: update_data({ entity: "orders", recordId: "ORD-101", updates: { status: "shipped" } })
          ↓
toolHandlers.update_data():
  - Zod validates params
  - Generates actionId (UUID)
  - Stores pending confirmation in memory Map (expires in 5 min)
  - Returns { requiresConfirmation: true, actionId, description, previewData }
          ↓
Frontend: renders <ConfirmationCard>
          ↓
User clicks "Confirm"
          ↓
POST /api/chat/confirm { actionId, confirmed: true }
          ↓
executeConfirmedAction():
  - Validates actionId exists and belongs to userId
  - Checks not expired
  - Calls MongoDBAdapter.update()
  - Deletes pending confirmation
  - Creates AuditLog
          ↓
Frontend: shows success state
```

**Key safety rule:** Mutations are NEVER executed without this confirmation step.

---

## Security Architecture

| Layer | Measure |
|-------|---------|
| Secrets | API keys only in server env vars |
| Transport | HTTPS in production (Vercel/Render handle TLS) |
| Auth | JWT signed with HS256, verified on every request |
| CORS | Restricted to known CLIENT_URL |
| Rate Limiting | Global: 100 req/15min, Chat: 30 req/15min |
| Input Validation | Zod on all API inputs + LLM outputs |
| DB Security | Entity whitelist, parameterized Mongoose queries |
| LLM Security | Tool whitelist, no dynamic code execution |
| Headers | Helmet (XSS, CSP, HSTS, etc.) |
| Logging | Winston — no secrets ever logged |
| Audit | Every tool call → AuditLog document |
| Mutation | Always requires user confirmation |

---

## Future SQL Adapter Architecture

To support MySQL/PostgreSQL, implement the `DataAdapter` interface:

```typescript
// server/src/adapters/SQLAdapter.ts
import { DataAdapter } from './DataAdapter';

export class SQLAdapter implements DataAdapter {
  async query(params: QueryParams): Promise<Record<string, unknown>[]> {
    // Build parameterized SQL: SELECT ... WHERE ... ORDER BY ... LIMIT ...
    // Use parameterized queries (never string interpolation)
    const sql = buildSafeSQL(params);
    return db.query(sql, params.values);
  }

  async update(params: UpdateParams): Promise<...> { ... }
  async aggregate(entity, pipeline): Promise<...> { ... }
  // ...
}
```

Then in Action Dispatcher, swap adapters based on project config:
```typescript
const adapter = project.adapterType === 'sql'
  ? new SQLAdapter(project.connectionConfig)
  : new MongoDBAdapter();
```

**The React chat UI, Gemini layer, Zod validators, and tool registry remain unchanged.**
Only the adapter changes — this is the database-agnostic design.
