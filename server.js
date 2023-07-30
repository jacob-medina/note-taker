const express = require('express');
const path = require('path');
const api = require('./routes/api');

const PORT = process.env.PORT || 3001;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static('public'));

// api routes
app.use('/api', api);

// static page routes
app.get('/cells', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/cells.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// listen
app.listen(PORT, () => {
    console.info(`\u001b[33m Server listening on http://localhost:${PORT}`);
});