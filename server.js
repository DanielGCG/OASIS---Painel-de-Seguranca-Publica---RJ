require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

app.use(expressLayouts);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('layout', 'layout/main');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', require('./server/api'));
app.use('/', require('./server/router'));

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});