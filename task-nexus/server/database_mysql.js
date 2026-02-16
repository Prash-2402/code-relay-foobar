const mysql = require('mysql2');

// Create connection pool for better performance
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'task_nexus',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test the connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('Make sure MySQL server is running on', process.env.DB_HOST || 'localhost');
        }
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access denied. Check your username and password.');
        }
        if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('Database does not exist. Please create it first.');
        }
    } else {
        console.log('✓ MySQL connection pool established');
        connection.release();
    }
});

const fluxNexusHandler = {
    query: function (sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        pool.query(sql, params, (err, results) => {
            if (err) {
                console.error('SQL Error:', err.message);
                console.error('Query:', sql);
                if (callback) callback(err, null);
                return;
            }
            if (callback) callback(null, results);
        });
    },

    connect: function (callback) {
        // Pool is already connected, just verify
        pool.getConnection((err, connection) => {
            if (err) {
                return callback(err);
            }
            connection.release();
            if (callback) callback(null);
        });
    },

    end: function () {
        pool.end((err) => {
            if (err) {
                console.error('Error closing MySQL pool:', err.message);
            } else {
                console.log('MySQL pool closed');
            }
        });
    }
};

module.exports = fluxNexusHandler;
