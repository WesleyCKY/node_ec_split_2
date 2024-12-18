const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 80;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

function getDate(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}:${seconds}`;
    
    const day = date.toLocaleString('en-US', { weekday: 'long' });
    const month = date.toLocaleString('en-US', { month: 'long' });
    const dateNumber = date.getDate();
    const year = date.getFullYear();
  
    return `${currentTime}, ${day}, ${month} ${dateNumber}, ${year}`;
  }

const pool = mysql.createPool({
    connectionLimit: 10, // Adjust the limit based on your needs
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});



pool.on('error', (err) => {
    console.error(getDate(new Date()), 'MySQL Pool Error:', err);
});

app.get('/', (req, res) => {
    console.log(getDate(new Date()), 'new access to index.html');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to get all names
app.get('/names', (req, res) => {
    pool.query('SELECT * FROM Members ORDER BY name;', (err, results) => {
        if (err) {
            console.log(getDate(new Date()), 'Error getting member names, ', err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        console.log(getDate(new Date()), 'Got member names from database');
        res.json(results);
    });
});

// Endpoint to create a new name
app.post('/names/create', (req, res) => {
    console.log('create req: ', req.body)
    // Check for duplicates
    pool.query('SELECT * FROM Members WHERE name = ?', [req.body['name']], (err, results) => {
        if (err) {
            console.log(getDate(new Date()), 'Insert Database query failed ' ,err)
            return res.status(500).json({ error: 'Database query failed' });
        }
        if (results.length > 0) {
            console.log(getDate(new Date()), 'Insert Database failed, record exist')
            return res.status(400).json({ error: 'Name already exists' });
        }

        // Insert new name
        pool.query('INSERT INTO Members (name) VALUES (?)', [req.body['name']], (err, results) => {
            if (err) {
                console.log(getDate(new Date()), 'Failed to insert name ', err)
                return res.status(500).json({ error: 'Failed to insert name' });
            }
            res.status(201).json({ message: 'Name created successfully ', id: results.insertId });
        });
    });
});

// Endpoint to delete a name
app.post('/names/delete', (req, res) => {
    console.log('delete req: ', req.body)
    pool.query('DELETE FROM Members WHERE id = ?', [req.body['id']], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Oh, Something wrong...(500)' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Hey, 用家不存在' });
        }
        console.log(getDate(new Date()), 'delete req ' + req.body['id'] + ' success, affecting row(s) ' + results.affectedRows )
        res.json({ message: '得咗！用家已被刪除' });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(getDate(new Date()), `Server is running on http://localhost:${PORT}`);
});