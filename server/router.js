const express = require('express');
const router = express.Router();

// Rota raiz
router.get('/', (req, res) => {
    res.redirect('/tiroteios');
});

// Tiroteios
router.get('/tiroteios', (req, res) => {
    res.render('pages/tiroteios', {
        title: 'Tiroteios - Painel de Segurança Pública RJ',
        crimeAtual: 'tiroteios'
    });
});

// Roubos
router.get('/roubos', (req, res) => {
    res.render('pages/roubos', {
        title: 'Roubos - Painel de Segurança Pública RJ',
        crimeAtual: 'roubos'
    });
});

// Homicídios
router.get('/homicidios', (req, res) => {
    res.render('pages/homicidios', {
        title: 'Homicídios - Painel de Segurança Pública RJ',
        crimeAtual: 'homicidios'
    });
});

// Outros Crimes
router.get('/outros', (req, res) => {
    res.render('pages/outros', {
        title: 'Outros Crimes - Painel de Segurança Pública RJ',
        crimeAtual: 'outros'
    });
});

module.exports = router;