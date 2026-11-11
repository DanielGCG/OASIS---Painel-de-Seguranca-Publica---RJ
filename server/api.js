const express = require('express');
const api = express.Router();
const Ocorrencias_tiroteio = require('../bd/modelos/ocorrencias_tiroteio');
const Evolucao_mensal_cisp = require('../bd/modelos/evolucao_mensal_cisp');
const { Sequelize } = require('sequelize');

// Variável para armazenar a resposta em cache
let MapaTiroteiosCache = null;
let MapaRoubosCache = null;
let MapaHomiCache = null;

api.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

api.get('/tiroteios/ocorrencias_mapa', async (req, res) => {
    // Verifica se a resposta está em cache e se ainda é válida (menos de 1 hora)
    if (MapaTiroteiosCache && Date.now() - MapaTiroteiosCache.timestamp < 60 * 60 * 1000) {
        return res.json(MapaTiroteiosCache);
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

// Roubos por CISP e ano
api.get('/roubos/roubo_acumulado', async (req, res) => {
    try {
        if (MapaRoubosCache && Date.now() - MapaRoubosCache.timestamp < 60 * 60 * 1000) {
            return res.json(MapaRoubosCache);
        }

        const roubos = await Evolucao_mensal_cisp.findAll({
            attributes: [
                'cisp',
                'ano',
                [Sequelize.fn('SUM', Sequelize.col('total_roubos')), 'total_roubos']
            ],
            group: ['cisp', 'ano'],
            order: [['ano', 'ASC']],
            raw: true,
        });

        const registros = roubos.map(r => ({
            cisp: r.cisp,
            ano: Number(r.ano),
            total_roubos: Number(r.total_roubos)
        }));

        const anos = [...new Set(registros.map(r => r.ano))].sort((a, b) => a - b);

        MapaRoubosCache = { timestamp: Date.now(), anos, registros };
        return res.json(MapaRoubosCache);
    } catch (error) {
        console.error('Erro ao buscar dados de roubos:', error);
        res.status(500).json({ error: 'Erro ao buscar dados de roubos' });
    }
});

// Homicidios acumulados por CISP e ano
api.get('/roubos/total_homicidios', async (req, res) => {
    try {
        if (MapaHomiCache && Date.now() - MapaHomiCache.timestamp < 60 * 60 * 1000) {
            return res.json(MapaHomiCache);
        }

        const homi = await Evolucao_mensal_cisp.findAll({
            attributes: [
                'cisp',
                'ano',
                [Sequelize.literal('SUM(hom_doloso) + SUM(hom_por_interv_policial) + SUM(hom_culposo)'), 'total_homicidios']
            ],
            group: ['cisp', 'ano'],
            order: [['ano', 'ASC']],
            raw: true,
        });

        const registros = homi.map(r => ({
            cisp: r.cisp,
            ano: Number(r.ano),
            total_homicidios: Number(r.total_homicidios)
        }));

        const anos = [...new Set(registros.map(r => r.ano))].sort((a, b) => a - b);

        MapaHomiCache = { timestamp: Date.now(), anos, registros };
        return res.json(MapaHomiCache);
    } catch (error) {
        console.error('Erro ao buscar dados de roubos:', error);
        res.status(500).json({ error: 'Erro ao buscar dados de roubos' });
    }
});

module.exports = api;
