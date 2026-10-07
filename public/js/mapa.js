let mapa = null;

// ======================================================
// CONFIGURAÇÕES
// ======================================================

const LADO_GRADE = 200;
const PROJECAO_WGS84 = 'EPSG:4326';
const PROJECAO_UTM23S =
    '+proj=utm +zone=23 +south +datum=SIRGAS2000 +units=m +no_defs';

// Origem fixa da grade.
// Todas as células são calculadas a partir dela.
const ORIGEM_X = 600000;
const ORIGEM_Y = 7400000;

// ======================================================
// CAMADAS
// ======================================================

let camadaGrade = null;

// ======================================================
// ESTADO
// ======================================================

let pontosAtuais = [];
let gradeAtual = new Map();

function criarMapa() {
    if (mapa) return;

    const secaoMapa = document.getElementById('secaoMapa');
    const elementoMapa = document.createElement('div');

    elementoMapa.id = 'mapa';
    elementoMapa.className = 'mapa rounded-0';
    elementoMapa.setAttribute('aria-label', 'Mapa interativo do Rio de Janeiro');

    secaoMapa.prepend(elementoMapa);

    mapa = L.map(elementoMapa, { zoomControl: false })
        .setView([-22.90351847, -43.19153696], 11);

    L.control.zoom({ position: 'bottomright' }).addTo(mapa);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(mapa);

    camadaGrade = L.layerGroup().addTo(mapa);
}

function removerMapa() {
    if (mapa) {
        mapa.remove();
        mapa = null;
    }

    camadaGrade = null;
    pontosAtuais = [];
    gradeAtual = new Map();
    document.getElementById('totalOcorrencias').textContent = '--';

    const elementoMapa = document.getElementById('mapa');
    if (elementoMapa) elementoMapa.remove();
}

// ======================================================
// AVISOS
// ======================================================

function mostrarAviso(mensagem) {
    const aviso = document.getElementById('avisoMapa');

    aviso.textContent = mensagem;
    aviso.classList.remove('d-none');
}

function esconderAviso() {
    const aviso = document.getElementById('avisoMapa');

    aviso.classList.add('d-none');
}

// ======================================================
// PROJEÇÃO
// ======================================================

function projetar(latitude, longitude) {
    const [x, y] = proj4(PROJECAO_WGS84, PROJECAO_UTM23S, [
        Number(longitude),
        Number(latitude)
    ]);

    return { x, y };
}

function desprojetar(x, y) {
    const [longitude, latitude] = proj4(
        PROJECAO_UTM23S,
        PROJECAO_WGS84,
        [x, y]
    );

    return { latitude, longitude };
}

// ======================================================
// PROJEÇÃO DOS PONTOS
// ======================================================

function projetarPontos(pontos) {
    return pontos
        .map(ponto => {
            const latitude = Number(ponto.latitude);
            const longitude = Number(ponto.longitude);

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                return null;
            }

            const projetado = projetar(latitude, longitude);

            return {
                ...ponto,
                x: projetado.x,
                y: projetado.y
            };
        })
        .filter(Boolean);
}

// ======================================================
// IDENTIFICAÇÃO DA CÉLULA
// ======================================================

function obterIndiceCelula(x, y) {
    const coluna = Math.floor((x - ORIGEM_X) / LADO_GRADE);
    const linha = Math.floor((y - ORIGEM_Y) / LADO_GRADE);

    return { linha, coluna };
}

// ======================================================
// CRIAÇÃO DA GRADE
// ======================================================

function criarGrade(pontos) {
    const grade = new Map();

    for (const ponto of pontos) {
        const { linha, coluna } = obterIndiceCelula(ponto.x, ponto.y);
        const chave = `${linha}:${coluna}`;
        let celula = grade.get(chave);

        if (!celula) {
            celula = { linha, coluna, ocorrencias: 0 };
            grade.set(chave, celula);
        }

        celula.ocorrencias++;
    }

    return grade;
}

// ======================================================
// COR DA CÉLULA
// ======================================================

function obterCor(quantidade, maximo) {
    if (maximo <= 0) return '#d9edf0';

    const intensidade = Math.log1p(quantidade) / Math.log1p(maximo);

    if (intensidade >= 0.85) return '#4a0404';
    if (intensidade >= 0.70) return '#800000';
    if (intensidade >= 0.55) return '#b71c1c';
    if (intensidade >= 0.40) return '#d9534f';
    if (intensidade >= 0.30) return '#ef8354';
    if (intensidade >= 0.20) return '#f5d094';
    if (intensidade >= 0.10) return '#eed7a3';

    return '#d9edf0';
}

// ======================================================
// LIMITES DA CÉLULA
// ======================================================

function obterBoundsCelula(celula) {
    const x1 = ORIGEM_X + celula.coluna * LADO_GRADE;
    const y1 = ORIGEM_Y + celula.linha * LADO_GRADE;
    const x2 = x1 + LADO_GRADE;
    const y2 = y1 + LADO_GRADE;
    const sudoeste = desprojetar(x1, y1);
    const nordeste = desprojetar(x2, y2);

    return [
        [sudoeste.latitude, sudoeste.longitude],
        [nordeste.latitude, nordeste.longitude]
    ];
}

// ======================================================
// DESENHO DA GRADE
// ======================================================

function desenharCelulas(grade) {
    camadaGrade.clearLayers();

    if (grade.size === 0) return;

    const maximo = Math.max(
        ...Array.from(grade.values()).map(celula => celula.ocorrencias)
    );

    const renderizador = L.canvas({ padding: 0.2 });

    for (const celula of grade.values()) {
        const cor = obterCor(celula.ocorrencias, maximo);
        const bounds = obterBoundsCelula(celula);
        const retangulo = L.rectangle(bounds, {
            renderer: renderizador,
            stroke: false,
            fillColor: cor,
            fillOpacity: 0.8
        });

        retangulo.bindTooltip(
            `${celula.ocorrencias} ocorrência${
                celula.ocorrencias === 1 ? '' : 's'
            }`,
            { sticky: true }
        );

        camadaGrade.addLayer(retangulo);
    }
}

// ======================================================
// CARREGAMENTO
// ======================================================

async function receberPontos() {
    try {
        criarMapa();
        mostrarAviso('Carregando ocorrências...');

        const resposta = await fetch('/api/tiroteios/ocorrencias_mapa');

        if (!resposta.ok) {
            throw new Error('Não foi possível carregar as ocorrências.');
        }

        const dados = await resposta.json();

        if (!mapa) return;

        const pontos = dados.ocorrencias || [];
        pontosAtuais = projetarPontos(pontos);

        document.getElementById('totalOcorrencias').textContent =
            pontosAtuais.length.toLocaleString('pt-BR');

        if (pontosAtuais.length === 0) {
            camadaGrade.clearLayers();
            mostrarAviso('Nenhuma ocorrência encontrada.');
            return;
        }

        esconderAviso();
        gradeAtual = criarGrade(pontosAtuais);
        desenharCelulas(gradeAtual);
    } catch (erro) {
        console.error('Erro ao carregar ocorrências:', erro);
        mostrarAviso(erro.message || 'Não foi possível carregar o mapa.');
    }
}

function iniciarMapaTiroteios() {
    criarMapa();
    receberPontos();
}

function limparVisualizacao() {
    removerMapa();
}
