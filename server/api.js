const express = require('express');
const api = express.Router();
const Ocorrencias_tiroteio = require('../bd/modelos/ocorrencias_tiroteio');
const Evolucao_mensal_cisp = require('../bd/modelos/evolucao_mensal_cisp');

// Variável para armazenar a resposta em cache
let MapaTiroteiosCache = null;
let MapaRoubosCache = null;

api.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

api.get('/tiroteios/ocorrencias_mapa', async (req, res) => {
    // Verifica se a resposta está em cache e se ainda é válida (menos de 1 hora)
    if (MapaTiroteiosCache && Date.now() - MapaTiroteiosCache.timestamp < 60 * 60 * 1000) {
        return res.json(MapaTiroteiosCache);
    }
    else {
        // Se não estiver em cache ou for inválida, busca os dados do banco de dados
        const ocorrencias = await Ocorrencias_tiroteio.findAll({
            attributes: ['latitude', 'longitude'],
            raw: true,
        });

        MapaTiroteiosCache = {
            timestamp: Date.now(),
            ocorrencias: ocorrencias
        };

        return res.json(MapaTiroteiosCache);
    }
});

api.get('/roubos/roubos_mapa', async (req, res) => {
    // Verifica se a resposta está em cache e se ainda é válida (menos de 1 hora)
    if (MapaRoubosCache && Date.now() - MapaRoubosCache.timestamp < 60 * 60 * 1000) {
        return res.json(MapaRoubosCache);
    }
    else {
        // Se não estiver em cache ou for inválida, busca os dados do banco de dados
        const roubos = await Evolucao_mensal_cisp.findAll({
            attributes: ['cisp', 'total_roubos', 'ano', 'mes'],
            raw: true,
        });

        MapaRoubosCache = {
            timestamp: Date.now(),
            roubos: roubos
        };

        return res.json(MapaRoubosCache);
    }
})

module.exports = api;