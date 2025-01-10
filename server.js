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
        console.log(getDate(new Date()), 'Got member names from database', results.length);
        res.json(results);
    });
});

// Endpoint to create a new name
app.post('/names/create', (req, res) => {
    console.log('create req: ', req.body)
    var insertedId = null
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
            console.log(getDate(new Date()), "insert id: ", results.insertId)
            insertedId = results.insertId
            if (insertedId == null | undefined) {
                return res.status(500).json({ error: 'Failed to insert name' });
            }

            pool.query('INSERT INTO TeamMembersRelation (team_id, id, join_date) VALUES (0, ' +  insertedId + ', NOW() )', (err, results) => {
                if (err) {
                    console.log(getDate(new Date()), 'Failed to insert TeamMemberRelation  ', err)
                    return res.status(500).json({ error: 'Failed to insert TeamMemberRelation'});
                }
            })
        })

        return res.status(201).json({ message: 'Name created successfully ', id: insertedId });
        
    });
});

// Endpoint to delete a name
app.post('/names/delete', (req, res) => {
    console.log('delete req: ', req.body)
    pool.query('DELETE FROM TeamMembersRelation where id = ?', [req.body['id']], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Oh, Something wrong...(500) ', err });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Hey, TeamMembersRelation 用家不存在' });
        }

        pool.query('DELETE FROM Members WHERE id = ?', [req.body['id']], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Oh, Something wrong...(500) ', err });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Hey, Members 用家不存在' });
            }
            console.log(getDate(new Date()), 'delete req ' + req.body['id'] + ' success, affecting row(s) ' + results.affectedRows )
            res.json({ message: '得咗！用家已被刪除' });
        });
    })
});

// req: team_id, payer_member_id, total_amount, remarks, details
app.post('/bill/create', (req, res) => {
    console.log('/bill/create', req.body['team_id'], req.body['payer_member_id'], req.body['total_amount'], req.body['remarks'], req.body['details'])
    var team_id = req.body['team_id'];
    var payer_member_id = req.body['payer_member_id'];
    var total_amount = req.body['total_amount'];
    var remarks = req.body['remarks'];
    var details = req.body['details'];
    // insert into bill
    var sql = 'INSERT INTO Bills (team_id, payer_member_id, total_amount, remarks, bill_date) VALUES (?, ?, ?, ?, ?)';
    pool.execute(sql, [team_id, payer_member_id, total_amount, remarks, new Date()], (err, results)=>{
        if (err) {
            console.log(getDate(new Date()), 'Failed to insert Bill ', err)
            return res.status(500).json({ error: 'Failed to insert Bill'});
        }
        console.log(getDate(new Date()), results)
        var bill_id = results['insertId']
        sql = 'INSERT INTO BillMemberRelation (bill_id, member_id, amount, settled, lastModifiedDate, createdDate) VALUES (?, ?, ?, ?, ?, ?)';
        // get the bill_id
        // loop from details array, check if member id == payer_member_id
        const promises = Object.entries(details).map(([member_id, amount]) => {
            return new Promise((resolve, reject) => {
                var settled = (payer_member_id == member_id) ? true : false; 
                pool.execute(sql, [bill_id, member_id, amount, settled, new Date(), new Date()], (error, results) => {
                    if (error) {
                        console.log(getDate(new Date()), error)
                        return reject(error);
                    }
                    resolve(results);
                });
            });
        });

        Promise.all(promises).then(results => {
            console.log('Rows inserted:', results.insertId);
        }).catch(error => {
            console.error('Error inserting rows:', error);
        })

        return res.status(200).json({message: 'bill created successfully', result: results})
    })
    // insert into bill member relation

    
});

app.post('/bill/update_bill_pay_status', (req, res) => {
    console.log('bill/update', req.body['bill_id'], req.body['member_id'], req.body['status'])
    var bill_id = req.body['bill_id'];
    var member_id = req.body['member_id'];
    var status = req.body['status']
    var sql = `UPDATE BillMemberRelation 
                SET settled = ? 
                WHERE member_id = ? AND bill_id = ?`;
    pool.execute(sql, [status, member_id, bill_id], (error, results) => {
        if(error){
            return res.status(500).json({"error": error})
        }
        console.log(getDate(new Date()), 'bill status updated');
        res.status(200).json({"messgae":"update success", "results": results});
    });

})

app.get('/bill/get', (req, res) => {
    console.log('/bill/get', req.query.bill_id);
    var bill_id = req.query.bill_id;
    const sql = `
        SELECT 
            b.bill_id,
            b.bill_date,
            b.total_amount,
            b.remarks,
            bm.bill_member_id,
            bm.member_id,
            m.name AS member_name,
            bm.amount,
            bm.settled,
            bm.lastModifiedDate,
            bm.createdDate
        FROM 
            Bills b
        JOIN 
            BillMemberRelation bm ON b.bill_id = bm.bill_id
        JOIN 
            Members m ON bm.member_id = m.id
        WHERE 
            b.bill_id = ?;
    `;

    pool.query(sql, [bill_id], (error, results) => {
        if (error) {
            return callback(error, null);
        }
        const bill_details = results.map(row => ({
            billId: row.bill_id,
            billDate: row.bill_date,
            totalAmount: row.total_amount,
            remarks: row.remarks,
            billMemberId: row.bill_member_id,
            memberId: row.member_id,
            memberName: row.member_name,
            amount: row.amount,
            settled: row.settled,
            lastModifiedDate: row.lastModifiedDate,
            createdDate: row.createdDate
        }));

        res.status(200).json({"result": results.length, "bill": bill_details})
    })
});

// Start the server
app.listen(PORT, () => {
    console.log(getDate(new Date()), `Server is running on http://localhost:${PORT}`);
});