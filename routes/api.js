const express = require('express');
const cells = require('./cells');

const app = express();

app.use('/cells', cells);

module.exports = app;