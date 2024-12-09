const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const config = require('./config');

// Create an express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Create a MySQL connection
const connection = mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database
});

// Connect to the database
connection.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database');
});

// Endpoint to get all names
app.get('/names', (req, res) => {
    connection.query('SELECT * FROM nameList', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json(results);
    });
});

// Endpoint to create a new name
app.post('/names', (req, res) => {
    const { name } = req.body;

    // Check for duplicates
    connection.query('SELECT * FROM nameList WHERE name = ?', [name], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database query failed' });
        }
        if (results.length > 0) {
            return res.status(400).json({ error: 'Name already exists' });
        }

        // Insert new name
        connection.query('INSERT INTO nameList (name) VALUES (?)', [name], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to insert name' });
            }
            res.status(201).json({ message: 'Name created successfully', id: results.insertId });
        });
    });
});

// Endpoint to delete a name
app.post('/names/delete', (req, res) => {
    const { name_to_be_deleted } = req.body;

    connection.query('DELETE FROM nameList WHERE name = ?', [name_to_be_deleted], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete name' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Name not found' });
        }
        res.json({ message: 'Name deleted successfully' });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});