# AI Coding Agent Instructions — Task Nexus

## Architecture Overview

**Task Nexus** is a full-stack task management application with three-tier architecture:
- **Frontend**: React 18 + Vite in `client/` → runs on `:3000`
- **Backend**: Express.js monolith in `server/server.js` → runs on `:5000`
- **Database**: MySQL relational schema in `database.sql`

**Key constraint**: All backend routes (auth, workspaces, projects, tasks) are in a single `server.js` file (~379 lines). No middleware layer or separate route files exist.

## Critical Architecture Patterns

### Data Model Hierarchy
```
users
  ├─ workspaces (owner_id)
  │   ├─ workspace_members (role: owner/admin/member)
  │   └─ projects (workspace_id)
  │       └─ tasks (project_id)
  └─ activity_log (user_id)
```

Workspace access is **always** mediated through `workspace_members` table—verify role membership when implementing workspace-scoped features.

### Authentication Flow
- JWT tokens signed with hardcoded `JWT_SECRET = 'super-secret-key-123'` (security issue, but pattern to follow)
- Token stored in `localStorage` as `nexus_token` (client-side)
- Token passed as `Authorization: Bearer <token>` header
- Fallback to `userId = 1` if no token provided (used in `/api/workspaces` GET)

### API Endpoint Patterns
All endpoints are RESTful POST/GET/PUT/DELETE with SQL query callbacks:
```javascript
app.get('/api/workspaces', (req, res) => {
    // Extract userId from JWT
    // fluxNexusHandler.query() with callback
    // res.json(results)
})
```

**Issue to note**: SQL strings are built with string concatenation (SQL injection vulnerability). Use parameterized queries `[values]` where present.

## Critical Developer Workflows

### Local Setup
1. **Database**: `mysql -u root -p < database.sql` (no password by default)
2. **Server**: `cd server && npm install && npm start` (node server.js, or use `npm run dev` with nodemon)
3. **Client**: `cd client && npm install && npm run dev` (Vite dev server)
4. Both must run simultaneously. Ensure `.env` in `server/` has correct DB credentials.

### Build & Deployment
- **Client**: `npm run build` → outputs to `dist/` (Vite bundles React)
- **Server**: No build step; runs directly with Node
- **Lint**: Client has ESLint configured but no lint script for server

### Testing
No test framework configured. Manual testing via Postman/cURL or browser network tab is current practice.

## Client-Specific Patterns

### Component Structure
- **Pages** (`pages/*.jsx`): Route components (Login, Dashboard, Tasks, etc.)
- **Modules** (`modules/`): Shared logic
  - `context/AuthContext.jsx`: Global auth state via Context API
  - `Layout.jsx`: App shell (sidebar + navbar)
  - `TaskComponents/`: Task UI (TaskList, TaskItem)
  - `UI/`: Reusable primitives (Button, Input, Card)

### State Management
- **Auth state**: Context API via `AuthContext.useAuth()` hook
- **Other state**: Local component state with `useState()` (no Redux/Zustand)
- API calls use `axios` directly in components (no service layer)

### Routing
[App.jsx](task-nexus/client/src/App.jsx#L15) uses React Router v6:
```jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<ProtectedRoute><LayoutComponent /></ProtectedRoute>} />
  {/* nested routes inside LayoutComponent */}
</Routes>
```

### API Constants
- `API_BASE` is set from `import.meta.env.API_URL` or defaults to `http://localhost:5000`
- Both client and AuthContext hardcode `http://localhost:5000` in some calls—consolidate to `API_BASE`

### Styling
- Vanilla CSS in [App.css](task-nexus/client/src/App.css) with glassmorphism design (blurred backgrounds, light borders)
- No CSS-in-JS or Tailwind; component styles are co-located with imports
- Lucide React icons imported as needed (`import { Plus, Layout as LayoutIcon }`)

## Backend-Specific Patterns

### Environment & Startup
- [server.js](task-nexus/server/server.js#L1) loads `.env` via `dotenv`
- MySQL connection pool created on startup: `mysql.createConnection()`
- Express middleware: `app.use(express.json())`
- All routes attached directly to `app` (no `router` objects)

### Database Queries
Pattern: callback-based queries with manual SQL strings
```javascript
fluxNexusHandler.query(sqlString, [values], (err, results) => { ... })
```

When adding queries:
1. Use parameterized values `[...]` to prevent SQL injection
2. Always handle `err` callback parameter
3. Return 500 status for DB errors; 401 for auth failures

### CORS & Origin Handling
- No CORS middleware visible; client and server run on same machine locally
- In production, CORS will need explicit configuration

### Error Messages
- Errors are returned as `{ error: 'message' }` JSON
- Common patterns: `'No token'`, `'Invalid token'`, `'Nexus error'` (themed naming)

## Project-Specific Conventions

### Naming & Terminology
This codebase uses "Quantum" and "Nexus" thematic names (metaphorical, not technical):
- `fluxNexusHandler` = MySQL connection
- `quantumTasks` = task state variable
- `"Nexus communication failure"` = API error
- Avoid these names when implementing real features; use descriptive names instead

### "Legacy" Code
[TaskList.jsx](task-nexus/client/src/modules/TaskComponents/TaskLits.jsx) (note typo in filename: "TaskLits") is marked as legacy. When refactoring tasks, prefer new components in `pages/Tasks.jsx`.

### Missing Dependencies
- Server `package.json` lists `mysql2` in README but not in `package.json`—may need installation
- Client missing `axios` and `react-router-dom` in `package.json` despite use in code—verify during setup

## Common Modifications

### Adding an API endpoint
1. Add route to [server.js](task-nexus/server/server.js) before `app.listen()`
2. Extract userId from JWT in header (see `/api/auth/me` pattern)
3. Query database with parameterized values
4. Respond with `res.json()` or `res.status(code).json({})`

### Adding a new page
1. Create `client/src/pages/NewPage.jsx` with component
2. Add route to [App.jsx](task-nexus/client/src/App.jsx) inside `<Routes>`
3. Call `useAuth()` to access user context if needed
4. Use `API_BASE` + `/api/endpoint` for server calls

### Updating the database schema
1. Modify [database.sql](task-nexus/database.sql) and re-import
2. Backend queries automatically work with new columns/tables (manual mapping required)
3. Frontend may need new form fields or display logic

## Known Issues & TODOs

- **SQL Injection**: Some endpoints use string concatenation; migrate to parameterized queries
- **Password Hashing**: Currently stored as plaintext; use `bcrypt` for real deployment
- **Hardcoded JWT Secret**: Move to `.env`
- **Missing Middleware**: No authentication middleware; checks are manual per-route
- **Hardcoded Axios URLs**: Some calls hardcode `http://localhost:5000` instead of `API_BASE`
- **CORS**: Not configured; will break in cross-origin deployments
- **No Validation**: User input not validated before DB insertion
