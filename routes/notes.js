const notes = require('express').Router();
const fs = require('fs');
const { appendJSON, removeJSON } = require('../helpers/fsExtra');
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
    res.json('Save successful!');
});

notes.delete('/:id', (req, res) => {
    const id = req.params.id;
    const searchFunc = (element) => element.id === id;

    removeJSON('./db/db.json', searchFunc);

    res.json('Delete successful!');
});

module.exports = notes;