const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db/database');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// GET endpoint to record temperature
app.get('/temperature/:location', (req, res) => {
    const location = req.params.location;
    const temperature = req.query.temp;

    if (!temperature) {
        return res.status(400).json({ error: 'Temperature query parameter (temp) is required' });
    }

    const stmt = db.prepare('INSERT INTO temperatures (location, temperature) VALUES (?, ?)');
    stmt.run(location, temperature, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, location, temperature });
    });
    stmt.finalize();
});

// GET endpoint to retrieve temperature history
app.get('/history', (req, res) => {
    db.all(`
        SELECT location, temperature, timestamp,
        ROW_NUMBER() OVER (PARTITION BY location ORDER BY timestamp DESC) as row_num
        FROM temperatures
        ORDER BY timestamp DESC
    `, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 