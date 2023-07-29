const notes = require('express').Router();
const fs = require('fs');
const { appendJSON } = require('../helpers/fsExtra');
const { v4: uuidv4 } = require('uuid');

notes.get('/', (req, res) => {
    fs.readFile('./db/db.json', 'utf-8', (error, data) => {
        if (error) console.error(`\u001b[31m Could not read db.json. Error: ${error}`);
        
        else {
            data = JSON.parse(data);
            res.json(data);
        }
    });
});

notes.post('/', (req, res) => {
    const { title, text } = req.body;
    if (!title || !text) {
        console.error(`\u001b[31m Request body must have title and text!\nRequest Body:\n${req.body}`);
        return;
    }

    const note = {
        title: title,
        text: text,
        id: uuidv4()
    }

    appendJSON('./db/db.json', note);
});

module.exports = notes;