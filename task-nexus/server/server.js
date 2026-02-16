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

const JWT_SECRET = 'super-secret-key-123';

const fluxNexusHandler = require('./database_mysql');

fluxNexusHandler.connect((err) => {
    if (err) {
        console.error('Error connecting to taskNexus:', err);
        return;
    }
    console.log('Successfully connected to taskNexus stability layer.');
});

/* ================= AUTH ================= */

// REGISTER
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Hash the password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const query = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";

        fluxNexusHandler.query(query, [username, email, password_hash], (err, results) => {
            if (err) {
                return res.status(400).json({ error: 'User already exists or invalid data' });
            }

            const userId = results.insertId;

            fluxNexusHandler.query(
                "INSERT INTO workspaces (name, description, owner_id) VALUES (?, ?, ?)",
                [`${username} Workspace`, 'Default workspace', userId],
                (err2, wsResults) => {
                    if (wsResults) {
                        fluxNexusHandler.query(
                            "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)",
                            [wsResults.insertId, userId, 'owner']
                        );

                        fluxNexusHandler.query(
                            "INSERT INTO projects (name, description, workspace_id) VALUES (?, ?, ?)",
                            ['My First Project', 'Default project', wsResults.insertId]
                        );
                    }

                    const token = jwt.sign(
                        { id: userId, username, email },
                        JWT_SECRET
                    );

                    res.json({ token, user: { id: userId, username, email } });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const query = "SELECT * FROM users WHERE email = ?";

    fluxNexusHandler.query(query, [email], async (err, results) => {
        try {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!results || results.length === 0) {
                return res.status(401).json({ error: 'No account found with this email' });
            }

            const user = results[0];

            // Compare hashed password
            const passwordMatch = await bcrypt.compare(password, user.password_hash);

            if (!passwordMatch) {
                return res.status(401).json({ error: 'Wrong password' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, email: user.email },
                JWT_SECRET
            );

            res.json({
                token,
                user: { id: user.id, username: user.username, email: user.email }
            });
        } catch (error) {
            console.error('Error during login:', error);
            res.status(500).json({ error: 'Error during login' });
        }
    });
});

// VERIFY TOKEN
app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        fluxNexusHandler.query(
            'SELECT id, username, email FROM users WHERE id = ?',
            [decoded.id],
            (err, results) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.json(results[0]);
            }
        );
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// ANALYTICS
app.get('/api/analytics/dashboard', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        // Parallel queries for stats
        const queries = {
            totalTasks: "SELECT COUNT(*) as count FROM tasks WHERE created_by = ?",
            completedTasks: "SELECT COUNT(*) as count FROM tasks WHERE created_by = ? AND status = 'done'",
            inProgressTasks: "SELECT COUNT(*) as count FROM tasks WHERE created_by = ? AND status = 'in_progress'",
            overdueTasks: "SELECT COUNT(*) as count FROM tasks WHERE created_by = ? AND due_date < NOW() AND status != 'done'",
            totalProjects: "SELECT COUNT(*) as count FROM projects WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = ?)",
            totalWorkspaces: "SELECT COUNT(*) as count FROM workspace_members WHERE user_id = ?",
            tasksByStatus: "SELECT status, COUNT(*) as count FROM tasks WHERE created_by = ? GROUP BY status",
            tasksByPriority: "SELECT priority, COUNT(*) as count FROM tasks WHERE created_by = ? GROUP BY priority"
        };

        const stats = {};
        let completedQueries = 0;
        const totalQueries = Object.keys(queries).length;

        Object.entries(queries).forEach(([key, sql]) => {
            fluxNexusHandler.query(sql, [userId], (err, results) => {
                if (err) {
                    console.error(`Error fetching ${key}:`, err);
                    stats[key] = key.includes('By') ? [] : 0;
                } else {
                    if (key.includes('By')) {
                        stats[key] = results;
                    } else {
                        stats[key] = results[0]?.count || 0;
                    }
                }

                completedQueries++;
                if (completedQueries === totalQueries) {
                    res.json(stats);
                }
            });
        });

    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// LIST MEMBERS
app.get('/api/workspaces/:id/members', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    fluxNexusHandler.query(
        `SELECT u.id, u.username, u.email, wm.role 
         FROM workspace_members wm 
         JOIN users u ON wm.user_id = u.id 
         WHERE wm.workspace_id = ?`,
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json(results);
        }
    );
});

// INVITE MEMBER
app.post('/api/workspaces/:id/invite', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const { email } = req.body;
    const workspaceId = req.params.id;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    // 1. Find user by email
    fluxNexusHandler.query('SELECT id FROM users WHERE email = ?', [email], (err, users) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const userId = users[0].id;

        // 2. Check if already member
        fluxNexusHandler.query(
            'SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, userId],
            (err2, existing) => {
                if (err2) return res.status(500).json({ error: 'Database error' });
                if (existing.length > 0) return res.status(400).json({ error: 'User already in workspace' });

                // 3. Add member
                fluxNexusHandler.query(
                    'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
                    [workspaceId, userId, 'member'],
                    (err3, result) => {
                        if (err3) return res.status(500).json({ error: 'Failed to add member' });
                        res.json({ message: 'Member added successfully', userId });
                    }
                );
            }
        );
    });
});

/* ================= WORKSPACES ================= */

// GET WORKSPACES
app.get('/api/workspaces', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        fluxNexusHandler.query(
            `SELECT w.*, wm.role 
             FROM workspaces w 
             JOIN workspace_members wm ON w.id = wm.workspace_id 
             WHERE wm.user_id = ?`,
            [decoded.id],
            (err, results) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.json(results);
            }
        );
    } catch (e) { res.status(401).json({ error: 'Invalid token' }); }
});

// GET SINGLE WORKSPACE
app.get('/api/workspaces/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    fluxNexusHandler.query(
        'SELECT * FROM workspaces WHERE id = ?',
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length === 0) return res.status(404).json({ error: 'Workspace not found' });
            res.json(results[0]);
        }
    );
});

// CREATE WORKSPACE
app.post('/api/workspaces', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        const { name, description } = req.body;

        fluxNexusHandler.query(
            'INSERT INTO workspaces (name, description, owner_id) VALUES (?, ?, ?)',
            [name, description, decoded.id],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                const workspaceId = result.insertId;

                // Add owner as member
                fluxNexusHandler.query(
                    'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
                    [workspaceId, decoded.id, 'owner'],
                    (err2) => {
                        if (err2) return res.status(500).json({ error: 'Failed to add member' });
                        res.json({ id: workspaceId, name, description, role: 'owner' });
                    }
                );
            }
        );
    } catch (e) { res.status(401).json({ error: 'Invalid token' }); }
});

// DELETE WORKSPACE
app.delete('/api/workspaces/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    fluxNexusHandler.query(
        'DELETE FROM workspaces WHERE id = ?', // Cascading delete handles related data
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true });
        }
    );
});

/* ================= PROJECTS ================= */

// GET PROJECTS FOR WORKSPACE
app.get('/api/projects/workspace/:workspaceId', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    fluxNexusHandler.query(
        `SELECT p.*, 
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as completed_count
        FROM projects p WHERE workspace_id = ?`,
        [req.params.workspaceId],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json(results);
        }
    );
});

// GET SINGLE PROJECT
app.get('/api/projects/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    fluxNexusHandler.query(
        'SELECT * FROM projects WHERE id = ?',
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length === 0) return res.status(404).json({ error: 'Project not found' });
            res.json(results[0]);
        }
    );
});

// CREATE PROJECT
app.post('/api/projects', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const { name, description, color, workspaceId } = req.body;

    fluxNexusHandler.query(
        'INSERT INTO projects (name, description, color, workspace_id) VALUES (?, ?, ?, ?)',
        [name, description, color, workspaceId],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ id: result.insertId, name, description, color, workspace_id: workspaceId, task_count: 0, completed_count: 0 });
        }
    );
});

// DELETE PROJECT
app.delete('/api/projects/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    fluxNexusHandler.query(
        'DELETE FROM projects WHERE id = ?',
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true });
        }
    );
});

/* ================= TASKS ================= */

// GET TASKS
app.get('/api/tasks', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const { projectId } = req.query;

    fluxNexusHandler.query(
        'SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC',
        [projectId],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json(results);
        }
    );
});

// CREATE TASK
app.post('/api/tasks', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        const { title, description, priority, due_date, project_id } = req.body;

        fluxNexusHandler.query(
            'INSERT INTO tasks (title, description, priority, due_date, project_id, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, priority, due_date, project_id, decoded.id],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.json({
                    id: result.insertId, title, description, priority, due_date, project_id, status: 'todo'
                });
            }
        );
    } catch (e) { res.status(401).json({ error: 'Invalid token' }); }
});

// UPDATE TASK
app.put('/api/tasks/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const { status } = req.body;

    fluxNexusHandler.query(
        'UPDATE tasks SET status = ? WHERE id = ?',
        [status, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true });
        }
    );
});

// DELETE TASK
app.delete('/api/tasks/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    fluxNexusHandler.query(
        'DELETE FROM tasks WHERE id = ?',
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true });
        }
    );
});

/* ================= START SERVER ================= */

app.get('/api/notifications', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        fluxNexusHandler.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [decoded.id],
            (err, results) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.json(results);
            }
        );
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

app.put('/api/notifications/:id/read', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    fluxNexusHandler.query(
        'UPDATE notifications SET read_status = TRUE WHERE id = ?',
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true });
        }
    );
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Nexus stability layer active on port ${PORT}`);
});
