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

// ✅ PRODUCTION SAFE JWT
if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET not defined in environment variables");
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

const fluxNexusHandler = require('./database_mysql');

// ✅ Fail fast if DB not connected
fluxNexusHandler.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to taskNexus:', err);
        process.exit(1);
    }
    console.log('✅ Successfully connected to taskNexus stability layer.');
});

/* ================= AUTH ================= */

// REGISTER
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const password_hash = await bcrypt.hash(password, 10);

        fluxNexusHandler.query(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            [username, email, password_hash],
            (err, results) => {
                if (err) {
                    return res.status(400).json({ error: 'User already exists or invalid data' });
                }

                const userId = results.insertId;

                // Create default workspace
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
                            JWT_SECRET,
                            { expiresIn: "7d" }
                        );

                        res.json({ token, user: { id: userId, username, email } });
                    }
                );
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating user' });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    fluxNexusHandler.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, results) => {
            try {
                if (err) return res.status(500).json({ error: 'Database error' });
                if (!results || results.length === 0)
                    return res.status(401).json({ error: 'No account found with this email' });

                const user = results[0];
                const passwordMatch = await bcrypt.compare(password, user.password_hash);

                if (!passwordMatch)
                    return res.status(401).json({ error: 'Wrong password' });

                const token = jwt.sign(
                    { id: user.id, username: user.username, email: user.email },
                    JWT_SECRET,
                    { expiresIn: "7d" }
                );

                res.json({
                    token,
                    user: { id: user.id, username: user.username, email: user.email }
                });
            } catch (error) {
                console.error('Error during login:', error);
                res.status(500).json({ error: 'Error during login' });
            }
        }
    );
});

// VERIFY TOKEN
app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

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

/* ================= NOTIFICATIONS ================= */

app.get('/api/init-db', (req, res) => {
    const fs = require('fs');
    const path = require('path');

    const sql = fs.readFileSync(path.join(__dirname, 'database_mysql.sql')).toString();

    fluxNexusHandler.query(sql, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to initialize DB' });
        }
        res.json({ message: 'Database initialized successfully' });
    });
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
    console.log(`🚀 Nexus stability layer active on port ${PORT}`);
});
