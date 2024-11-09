const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Validation function for temperature
function isValidTemperature(temp) {
    // Convert to number and check if it's a valid temperature
    const number = parseFloat(temp);
    
    // Check if it's a valid number and within reasonable range (-100°C to 100°C)
    return !isNaN(number) && 
           Number.isFinite(number) && 
           number >= -100 && 
           number <= 100;
}

// Validation function for location
function isValidLocation(location) {
    // Only allow alphanumeric characters, dashes, and underscores
    // Length between 2 and 50 characters
    const locationRegex = /^[a-zA-Z0-9-_]{2,50}$/;
    return locationRegex.test(location);
}

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

    // Convert to number for storage
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