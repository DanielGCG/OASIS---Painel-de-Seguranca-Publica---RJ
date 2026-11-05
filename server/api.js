const express = require('express');
const api = express.Router();
const Ocorrencias_tiroteio = require('../bd/modelos/ocorrencias_tiroteio');

let cacheTiroteios = null;

api.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

api.get('/tiroteios/ocorrencias_mapa', async (req, res) => {
    if (cacheTiroteios && Date.now() - cacheTiroteios.timestamp < 1 * 24 * 3600000) {
        return res.json(cacheTiroteios);
    }

    const ocorrencias = await Ocorrencias_tiroteio.findAll({
        attributes: ['latitude', 'longitude', 'ano'],
        raw: true,
    });

    const pontosPorAno = {};
    const conjuntoAnos = new Set();

    for (const ponto of ocorrencias) {
        if (!ponto.latitude || !ponto.longitude || !ponto.ano) continue;
        const ano = Number(ponto.ano);

        conjuntoAnos.add(ano);
        if (!pontosPorAno[ano]) pontosPorAno[ano] = [];
        pontosPorAno[ano].push([Number(ponto.latitude), Number(ponto.longitude)]);
    }

    const anos = Array.from(conjuntoAnos).sort((a, b) => a - b);

    cacheTiroteios = {
        timestamp: Date.now(),
        anos,
        pontosPorAno
    };

    return res.json(cacheTiroteios);
});

module.exports = api;