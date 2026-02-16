const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'task_nexus.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    db.get("SELECT * FROM users WHERE email = 'demo@tasknexus.com'", (err, row) => {
        if (err) {
            console.error('Error querying database:', err.message);
            process.exit(1);
        }

        if (!row) {
            console.error('User demo@tasknexus.com not found');
            process.exit(1);
        }

        console.log('User found:', row.username);
        console.log('Password hash in DB:', row.password_hash);

        if (row.password_hash === 'demo123') {
            console.log('SUCCESS: Password matches expected value');
        } else {
            console.error('FAILURE: Password does not match expected value');
            console.error('Expected: demo123');
            console.error('Actual: ', row.password_hash);
            process.exit(1);
        }
    });
});

db.close();
