require('dotenv').config();
const mysql = require('mysql2');

// 🚀 Use full MYSQL_URL from environment
if (!process.env.MYSQL_URL) {
    console.error("❌ MYSQL_URL not defined in environment variables");
    process.exit(1);
}

const pool = mysql.createPool(process.env.MYSQL_URL);

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error connecting to MySQL database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ MySQL connection pool established');
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
                console.error('❌ SQL Error:', err.message);
                console.error('Query:', sql);
                if (callback) callback(err, null);
                return;
            }
            if (callback) callback(null, results);
        });
    },

    connect: function (callback) {
        pool.getConnection((err, connection) => {
            if (err) return callback(err);
            connection.release();
            callback(null);
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
