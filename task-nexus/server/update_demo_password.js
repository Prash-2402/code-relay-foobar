require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

// Create connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function updateDemoPassword() {
    try {
        // Hash the demo password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash('demo123', saltRounds);

        connection.connect((err) => {
            if (err) {
                console.error('❌ Connection error:', err.message);
                process.exit(1);
            }

            console.log('✓ Connected to MySQL');

            // Update the demo user's password
            const query = 'UPDATE users SET password_hash = ? WHERE email = ?';

            connection.query(query, [hashedPassword, 'demo@tasknexus.com'], (err, results) => {
                if (err) {
                    console.error('❌ Error updating password:', err.message);
                    connection.end();
                    process.exit(1);
                }

                if (results.affectedRows === 0) {
                    console.log('⚠️  Demo user not found in database');
                } else {
                    console.log('✓ Demo user password updated successfully');
                    console.log('  Email: demo@tasknexus.com');
                    console.log('  Password: demo123');
                }

                connection.end();
            });
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateDemoPassword();
