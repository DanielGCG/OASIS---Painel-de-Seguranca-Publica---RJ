const express = require('express');
const router = express.Router();

const FONTE_ISP = 'Fonte: ISP RJ • Divisões Territoriais por CISP (Delegacias)';

const ANALISES_CISP = {
    roubos: {
        slug: 'roubos',
        nome: 'Roubos',
        title: 'Roubos - Painel de Segurança Pública RJ',
        rotuloMetrica: 'roubos registrados',
        fonte: FONTE_ISP,
        tetoEstatico: 5000,
        urlDados: '/api/roubos/roubo_acumulado'
    },
    homicidios: {
        slug: 'homicidios',
        nome: 'Homicídios',
        title: 'Homicídios - Painel de Segurança Pública RJ',
        rotuloMetrica: 'homicídios registrados',
        fonte: FONTE_ISP,
        tetoEstatico: 200,
        urlDados: '/api/roubos/total_homicidios'
    },
    furto: {
        slug: 'furto',
        nome: 'Furto',
        title: 'Furto - Painel de Segurança Pública RJ',
        rotuloMetrica: 'furtos registrados',
        fonte: FONTE_ISP,
        tetoEstatico: 0,
        urlDados: null
    },
    feminicidio: {
        slug: 'feminicidio',
        nome: 'Feminicídio',
        title: 'Feminicídio - Painel de Segurança Pública RJ',
        rotuloMetrica: 'feminicídios registrados',
        fonte: FONTE_ISP,
        tetoEstatico: 0,
        urlDados: null
    },
    'apreensao-armas': {
        slug: 'apreensao-armas',
        nome: 'Apreensão de Armas',
        title: 'Apreensão de Armas - Painel de Segurança Pública RJ',
        rotuloMetrica: 'apreensões de armas registradas',
        fonte: FONTE_ISP,
        tetoEstatico: 0,
        urlDados: null
    },
    'apreensao-drogas': {
        slug: 'apreensao-drogas',
        nome: 'Apreensão de Drogas',
        title: 'Apreensão de Drogas - Painel de Segurança Pública RJ',
        rotuloMetrica: 'apreensões de drogas registradas',
        fonte: FONTE_ISP,
        tetoEstatico: 0,
        urlDados: null
    }
};

const ITENS_NAVEGACAO = [
    { slug: 'tiroteios', nome: 'Tiroteios', href: '/tiroteios' },
    ...Object.values(ANALISES_CISP).map(analise => ({
        slug: analise.slug,
        nome: analise.nome,
        href: `/${analise.slug}`
    }))
];

// Disponibiliza os itens de navegação para todas as views
router.use((req, res, next) => {
    res.locals.itensNavegacao = ITENS_NAVEGACAO;
    next();
});

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

// Rota para todas as análises por CISP
router.get('/:analise', (req, res, next) => {
    const analise = ANALISES_CISP[req.params.analise];
    if (!analise) {
        return next();
    }

    res.render('pages/analise-cisp', {
        title: analise.title,
        crimeAtual: analise.slug,
        analise
    });
});

module.exports = router;
