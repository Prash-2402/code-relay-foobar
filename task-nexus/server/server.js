require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

app.use(express.json());

/* ================= ENV CHECK ================= */

if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET not defined");
    process.exit(1);
}

if (!process.env.MYSQL_URL) {
    console.error("❌ MYSQL_URL not defined");
    process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const fluxNexusHandler = require('./database_mysql');

/* ================= AUTH MIDDLEWARE ================= */

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token" });

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
}

/* ================= AUTH ================= */

app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
        return res.status(400).json({ error: "All fields required" });

    try {
        const password_hash = await bcrypt.hash(password, 10);

        fluxNexusHandler.query(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            [username, email, password_hash],
            (err, result) => {
                if (err) return res.status(400).json({ error: "User exists" });

                const userId = result.insertId;

                fluxNexusHandler.query(
                    "INSERT INTO workspaces (name, description, owner_id) VALUES (?, ?, ?)",
                    [`${username} Workspace`, "Default workspace", userId],
                    (err2, wsResult) => {

                        const workspaceId = wsResult.insertId;

                        fluxNexusHandler.query(
                            "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)",
                            [workspaceId, userId, "owner"]
                        );

                        fluxNexusHandler.query(
                            "INSERT INTO projects (name, description, workspace_id) VALUES (?, ?, ?)",
                            ["My First Project", "Default project", workspaceId]
                        );

                        const token = jwt.sign(
                            { id: userId, username, email },
                            JWT_SECRET,
                            { expiresIn: "7d" }
                        );

                        res.json({ token, user: { id: userId, username, email } });
                    }
                );
            }
        );

    } catch {
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: "Email & password required" });

    fluxNexusHandler.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, results) => {
            if (err) return res.status(500).json({ error: "DB error" });
            if (!results.length)
                return res.status(401).json({ error: "No account found" });

            const user = results[0];
            const match = await bcrypt.compare(password, user.password_hash);
            if (!match)
                return res.status(401).json({ error: "Wrong password" });

            const token = jwt.sign(
                { id: user.id, username: user.username, email: user.email },
                JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
        }
    );
});

app.get('/api/auth/me', authenticate, (req, res) => {
    fluxNexusHandler.query(
        "SELECT id, username, email FROM users WHERE id = ?",
        [req.user.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: "DB error" });
            res.json(results[0]);
        }
    );
});

/* ================= WORKSPACES ================= */

app.get('/api/workspaces', authenticate, (req, res) => {
    fluxNexusHandler.query(
        `SELECT w.*, wm.role 
         FROM workspaces w
         JOIN workspace_members wm ON w.id = wm.workspace_id
         WHERE wm.user_id = ?`,
        [req.user.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: "DB error" });
            res.json(results);
        }
    );
});

app.post('/api/workspaces', authenticate, (req, res) => {
    const { name, description } = req.body;

    fluxNexusHandler.query(
        "INSERT INTO workspaces (name, description, owner_id) VALUES (?, ?, ?)",
        [name, description, req.user.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: "DB error" });

            const workspaceId = result.insertId;

            fluxNexusHandler.query(
                "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)",
                [workspaceId, req.user.id, "owner"]
            );

            res.json({ id: workspaceId, name, description, role: "owner" });
        }
    );
});

app.delete('/api/workspaces/:id', authenticate, (req, res) => {
    fluxNexusHandler.query(
        "DELETE FROM workspaces WHERE id = ?",
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: "DB error" });
            res.json({ success: true });
        }
    );
});

app.get('/api/workspaces/:id/members', authenticate, (req, res) => {
    fluxNexusHandler.query(
        `SELECT u.id, u.username, u.email, wm.role
         FROM workspace_members wm
         JOIN users u ON wm.user_id = u.id
         WHERE wm.workspace_id = ?`,
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: "DB error" });
            res.json(results);
        }
    );
});

app.post('/api/workspaces/:id/invite', authenticate, (req, res) => {
    const { email } = req.body;

    fluxNexusHandler.query(
        "SELECT id FROM users WHERE email = ?",
        [email],
        (err, users) => {
            if (err) return res.status(500).json({ error: "DB error" });
            if (!users.length)
                return res.status(404).json({ error: "User not found" });

            fluxNexusHandler.query(
                "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)",
                [req.params.id, users[0].id, "member"],
                (err2) => {
                    if (err2) return res.status(400).json({ error: "Already member" });
                    res.json({ success: true });
                }
            );
        }
    );
});

/* ================= PROJECTS ================= */

app.get('/api/projects/workspace/:workspaceId', authenticate, (req, res) => {
    fluxNexusHandler.query(
        "SELECT * FROM projects WHERE workspace_id = ?",
        [req.params.workspaceId],
        (err, results) => {
            if (err) return res.status(500).json({ error: "DB error" });
            res.json(results);
        }
    );
});

app.post('/api/projects', authenticate, (req, res) => {
    const { name, description, color, workspaceId } = req.body;

    fluxNexusHandler.query(
        "INSERT INTO projects (name, description, color, workspace_id) VALUES (?, ?, ?, ?)",
        [name, description, color, workspaceId],
        (err, result) => {
            if (err) return res.status(500).json({ error: "DB error" });
            res.json({ id: result.insertId, name, description, color, workspace_id: workspaceId });
        }
    );
});

/* ================= TASKS ================= */

app.get('/api/tasks', authenticate, (req, res) => {
    fluxNexusHandler.query(
        "SELECT * FROM tasks WHERE project_id = ?",
        [req.query.projectId],
        (err, results) => {
            if (err) return res.status(500).json({ error: "DB error" });
            res.json(results);
        }
    );
});

app.post('/api/tasks', authenticate, (req, res) => {
    const { title, description, priority, due_date, project_id } = req.body;

    fluxNexusHandler.query(
        "INSERT INTO tasks (title, description, priority, due_date, project_id, created_by) VALUES (?, ?, ?, ?, ?, ?)",
        [title, description, priority, due_date, project_id, req.user.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: "DB error" });
            res.json({ id: result.insertId, title, description, priority, due_date, project_id, status: "todo" });
        }
    );
});

/* ================= NOTIFICATIONS ================= */

app.get('/api/notifications', authenticate, (req, res) => {
    fluxNexusHandler.query(
        "SELECT * FROM notifications WHERE user_id = ?",
        [req.user.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: "DB error" });
            res.json(results);
        }
    );
});

app.put('/api/notifications/:id/read', authenticate, (req, res) => {
    fluxNexusHandler.query(
        "UPDATE notifications SET read_status = TRUE WHERE id = ?",
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: "DB error" });
            res.json({ success: true });
        }
    );
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Nexus stability layer active on port ${PORT}`);
});
