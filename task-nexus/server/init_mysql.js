require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// First, create connection without database to create the database if it doesn't exist
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    multipleStatements: true
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL server:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('   Make sure MySQL server is running on', process.env.DB_HOST || 'localhost');
        }
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('   Access denied. Check your username and password in .env file');
        }
        process.exit(1);
    }

    console.log('✓ Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'task_nexus';
    connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
        if (err) {
            console.error('❌ Error creating database:', err.message);
            connection.end();
            process.exit(1);
        }

        console.log(`✓ Database '${dbName}' ready`);

        // Switch to the database
        connection.query(`USE ${dbName}`, (err) => {
            if (err) {
                console.error('❌ Error selecting database:', err.message);
                connection.end();
                process.exit(1);
            }

            // Read and execute the SQL schema file
            const schemaPath = path.join(__dirname, '../database_mysql.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');

            connection.query(schema, (err) => {
                if (err) {
                    console.error('❌ Error creating tables:', err.message);
                    connection.end();
                    process.exit(1);
                }

                // Notifications Table
                const notificationsTable = `CREATE TABLE IF NOT EXISTS notifications (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    message TEXT NOT NULL,
                    read_status BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )`;

                connection.query(notificationsTable, (err) => {
                    if (err) {
                        console.error('❌ Error creating notifications table:', err.message);
                        connection.end();
                        process.exit(1);
                    }
                    console.log('✓ Notifications table ready');

                    console.log('✓ All tables created successfully');
                    console.log('✓ Seed data inserted');
                    console.log('\n🎉 Database initialization complete!');
                    console.log('\nYou can now start the server with: npm start');

                    connection.end();
                });
            });
        });
    });
});
