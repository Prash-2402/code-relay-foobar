const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'task_nexus.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');
    }
});

const fluxNexusHandler = {
    query: function (sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        // Convert MySQL ? placeholders to SQLite ? placeholders (same syntax, usually)
        // But for things like INSERT/UPDATE, we need to defer to db.run
        // For SELECT, we use db.all

        const trimmedSql = sql.trim().toUpperCase();

        if (trimmedSql.startsWith('SELECT') || trimmedSql.startsWith('PRAGMA')) {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    // console.error('SQL Error:', err.message, 'Query:', sql);
                    return callback(err, null);
                }
                callback(null, rows);
            });
        } else {
            db.run(sql, params, function (err) {
                if (err) {
                    // console.error('SQL Error:', err.message, 'Query:', sql);
                    return callback(err, null);
                }
                // Mimic MySQL results object
                const results = {
                    insertId: this.lastID,
                    affectedRows: this.changes
                };
                callback(null, results);
            });
        }
    },
    connect: function (callback) {
        // SQLite connects immediately/on creation, so just callback
        if (callback) callback(null);
    },
    end: function () {
        db.close();
    }
};

module.exports = fluxNexusHandler;
