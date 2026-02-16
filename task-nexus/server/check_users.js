require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'task_nexus'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting:', err);
        return;
    }
    console.log('Connected to MySQL');

    connection.query('SELECT id, username, email FROM users', (err, results) => {
        if (err) {
            console.error('Error querying users:', err);
        } else {
            console.log('Current Users:', results);
        }
        connection.end();
    });
});
