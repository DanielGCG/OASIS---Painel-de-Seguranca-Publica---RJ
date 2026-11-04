const express = require('express');
const api = express.Router();
const Ocorrencias_tiroteio = require('../bd/modelos/ocorrencias_tiroteio');
const Evolucao_mensal_cisp = require('../bd/modelos/evolucao_mensal_cisp');
const { Sequelize } = require('sequelize');

// Variável para armazenar a resposta em cache
let MapaTiroteiosCache = null;
let MapaRoubosCache = {};

api.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

api.get('/tiroteios/ocorrencias_mapa', async (req, res) => {
    // Verifica se a resposta está em cache e se ainda é válida (menos de 1 hora)
    if (MapaTiroteiosCache && Date.now() - MapaTiroteiosCache.  timestamp < 60 * 60 * 1000) {
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

// Consulta de numero de roubos acumulado por ano, agrupado por CISP
api.get('/roubos/roubo_acumulado/:ano', async (req, res) => {
    const anoEscolhido = req.params.ano;
    try {
        // Verifica se a resposta está em cache e se ainda é válida (menos de 1 hora)
        if (MapaRoubosCache[anoEscolhido] && Date.now() - MapaRoubosCache[anoEscolhido].timestamp < 60 * 60 * 1000) {
            return res.json(MapaRoubosCache[anoEscolhido]);
        }
        else {
            // Se não estiver em cache ou for inválida, busca os dados do banco de dados
            const roubos = await Evolucao_mensal_cisp.findAll({
                attributes: [
                    'cisp',
                    [Sequelize.fn('SUM', Sequelize.col('total_roubos')), 'soma_roubos'], 
                    'ano'
                ],
                where: { ano: anoEscolhido },
                group: ['cisp', 'ano'], 
                raw: true,
            });

            MapaRoubosCache[anoEscolhido] = {
                timestamp: Date.now(),
                ano: anoEscolhido,
                roubos: roubos
            };

            return res.json(MapaRoubosCache[anoEscolhido]);
        }
    }
    catch (error) {
        console.error('Erro ao buscar dados de roubos do ano ${anoEscolhido}:', error);
        res.status(500).json({ error: 'Erro ao buscar dados de roubos do ano', anoEscolhido: anoEscolhido });
    }
})

module.exports = api;