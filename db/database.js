const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'temperatures.db');
const db = new sqlite3.Database(dbPath);

// Create the temperatures table if it doesn't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS temperatures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT NOT NULL CHECK(length(location) >= 2 AND length(location) <= 50),
            temperature REAL NOT NULL CHECK(temperature >= -100 AND temperature <= 100),
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

module.exports = db; 