const express = require('express');
const api = express.Router();
const Ocorrencias_tiroteio = require('../bd/modelos/ocorrencias_tiroteio');

// Variável para armazenar a resposta em cache
let MapaTiroteiosCache = null;

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

        const resposta = ocorrencias.map(ocorrencia => ({
            latitude: ocorrencia.latitude,
            longitude: ocorrencia.longitude,
        }));

        MapaTiroteiosCache = {
            timestamp: new Date(),
            ocorrencias: resposta
        };

        return res.json(MapaTiroteiosCache);
    }
});

module.exports = api;