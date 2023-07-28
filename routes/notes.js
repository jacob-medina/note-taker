const notes = require('express').Router();
const fs = require('fs');

notes.get('/', (req, res) => {
    fs.readFile('./db/db.json', 'utf-8', (error, data) => {
        if (error) console.error(`\u001b[31m Could not read db.json. Error: ${error}`);
        
        else {
            data = JSON.parse(data);
            res.json(data);
        }
    })
})

module.exports = notes;