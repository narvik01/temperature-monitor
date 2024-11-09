const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser')
const db = require('./database');

const app = express();
const port = 3000;

// Configure Morgan for logging
morgan.token('temperature', (req) => {
    if (req.path.startsWith('/temperature')) {
        const headers = JSON.stringify(req.headers, null, 2);
        if (req.method === 'GET') {
            return `\nHeaders: ${headers}\nlocation: ${req.params.location}, temp: ${req.query.temp}`;
        } else if (req.method === 'POST') {
            return `\nHeaders: ${headers}\ntemp: ${req.query.temp}, body: ${req.body}`;
        }
    }
    return '';
});

// Custom format for temperature endpoint logging
const temperatureFormat = '\n=== Request ===\n:date[iso] :method :url :status :response-time ms :temperature\n==============\n';

// Use Morgan only for temperature endpoints
app.use('/temperature', morgan(temperatureFormat));

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Validation function for temperature
function isValidTemperature(temp) {
    const number = parseFloat(temp);
    return !isNaN(number) && 
           Number.isFinite(number) && 
           number >= -100 && 
           number <= 100;
}

// Validation function for location
function isValidLocation(location) {
    const locationRegex = /^[a-zA-Z0-9-_]{2,50}$/;
    return locationRegex.test(location);
}

// POST endpoint that logs and responds OK
app.post('/temperature/:location', bodyParser.text({type: '*/*'}), (req, res) => {
    const location = req.params.location;
    const temperature = req.query.temp;
    
    res.json({ 
        success: true, 
        message: 'Temperature logged',
        location,
        temperature
    });
});

// GET endpoint to record temperature
app.get('/temperature/:location', (req, res) => {
    const location = req.params.location;
    const temperature = req.query.temp;

    // Validate location
    if (!isValidLocation(location)) {
        return res.status(400).json({ 
            error: 'Invalid location format. Use only letters, numbers, dashes, and underscores (2-50 characters).' 
        });
    }

    // Validate temperature
    if (!temperature) {
        return res.status(400).json({ 
            error: 'Temperature query parameter (temp) is required' 
        });
    }

    if (!isValidTemperature(temperature)) {
        return res.status(400).json({ 
            error: 'Invalid temperature value. Must be a number between -100°C and 100°C' 
        });
    }

    const parsedTemperature = parseFloat(temperature);

    const stmt = db.prepare('INSERT INTO temperatures (location, temperature) VALUES (?, ?)');
    stmt.run(location, parsedTemperature, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ 
            success: true, 
            location, 
            temperature: parsedTemperature 
        });
    });
    stmt.finalize();
});

// GET endpoint to retrieve temperature history
app.get('/history', (req, res) => {
    db.all(`
        WITH RankedTemperatures AS (
            SELECT 
                id,
                location, 
                ROUND(temperature, 2) as temperature, 
                timestamp,
                ROW_NUMBER() OVER (PARTITION BY location ORDER BY timestamp DESC) as row_num
            FROM temperatures
        )
        SELECT *
        FROM RankedTemperatures
        ORDER BY location, row_num
    `, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// DELETE endpoint to remove a temperature record
app.delete('/temperature/:id', (req, res) => {
    const id = req.params.id;
    
    const stmt = db.prepare('DELETE FROM temperatures WHERE id = ?');
    stmt.run(id, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ 
            success: true, 
            message: 'Temperature record deleted' 
        });
    });
    stmt.finalize();
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 