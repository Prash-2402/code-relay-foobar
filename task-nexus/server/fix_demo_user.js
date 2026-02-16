require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'task_nexus'
});

connection.connect(async (err) => {
    if (err) {
        console.error('Error connecting:', err);
        return;
    }
    console.log('Connected to MySQL');

    const password = 'demo123';
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    connection.query('UPDATE users SET password_hash = ? WHERE username = ?', [hash, 'demo'], (err, results) => {
        if (err) {
            console.error('Error updating user:', err);
        } else {
            console.log('Updated demo user password hash.');
            console.log('Rows affected:', results.affectedRows);
        }
        connection.end();
    });
});
