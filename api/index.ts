const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/', async(req, res) => {
    const currentDate = new Date();

    const day = currentDate.getDate(), 
          month = currentDate.getMonth() + 1,
          year = currentDate.getFullYear(); 
    
    console.log(`${day}/${month}/${year}`, 'new access to index.html');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to get all names
app.get('/names', (req, res) => {
    connection.query('SELECT * FROM nameList ORDER BY name;', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json(results);
    });
});

// Endpoint to create a new name
app.post('/names/create', (req, res) => {
    console.log('create req: ', req.body)
    // Check for duplicates
    connection.query('SELECT * FROM nameList WHERE name = ?', [req.body['name']], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database query failed' });
        }
        if (results.length > 0) {
            return res.status(400).json({ error: 'Name already exists' });
        }

        // Insert new name
        connection.query('INSERT INTO nameList (name) VALUES (?)', [req.body['name']], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to insert name' });
            }
            res.status(201).json({ message: 'Name created successfully', id: results.insertId });
        });
    });
});

// Endpoint to delete a name
app.post('/names/delete', (req, res) => {
    console.log('delete req: ', req.body)
    connection.query('DELETE FROM nameList WHERE id = ?', [req.body['id']], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Oh, Something wrong...(500)' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Hey, 用家不存在' });
        }
        res.json({ message: '得咗！用家已被刪除' });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});