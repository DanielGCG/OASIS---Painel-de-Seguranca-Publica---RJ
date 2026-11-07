(function () {
    // 1. Configurações básicas
    const CENTRO_RJ = [-22.90351847, -43.19153696];
    const TAMANHO_LAT = 0.0018;  // aprox 200 metros em latitude
    const TAMANHO_LON = 0.00195; // aprox 200 metros em longitude

    // Escala de cores do mapa de calor
    const TABELA_CORES = [
        { ints: 0.85, cor: '#4a0404' },
        { ints: 0.70, cor: '#800000' },
        { ints: 0.55, cor: '#b71c1c' },
        { ints: 0.40, cor: '#d9534f' },
        { ints: 0.30, cor: '#ef8354' },
        { ints: 0.20, cor: '#f5d094' },
        { ints: 0.10, cor: '#f8e5c5' }
    ];

    // Elementos da tela
    const elTotal = document.getElementById('totalOcorrencias');
    const elRotuloTotal = document.getElementById('rotuloTotalOcorrencias');
    const elAviso = document.getElementById('avisoMapa');

    // Variáveis do mapa Leaflet
    let mapa = null;
    let camadaGrade = null;
    let renderizadorCanvas = null;
    let dadosCache = null;

    // Formata número com pontos
    function formatarNumero(numero) {
        return Number(numero || 0).toLocaleString('pt-BR');
    }

    // Exibe ou oculta a caixinha de aviso no centro do mapa
    function exibirAviso(mensagem) {
        if (elAviso) {
            elAviso.textContent = mensagem;
            elAviso.classList.remove('d-none');
        }
    }

    function ocultarAviso() {
        if (elAviso) {
            elAviso.classList.add('d-none');
        }
    }

    // Escolhe a cor com base no valor e no valor máximo
    function obterCorCalor(valor, maximo) {
        if (valor <= 0 || maximo <= 0) {
            return '#d9edf0';
        }

        const intensidade = Math.log1p(valor) / Math.log1p(maximo);

        for (let i = 0; i < TABELA_CORES.length; i++) {
            if (intensidade >= TABELA_CORES[i].ints) {
                return TABELA_CORES[i].cor;
            }
        }

        return '#d9edf0';
    }

    // Converte latitude e longitude em um identificador (ex: "123:456")
    function calcularChaveGrade(lat, lon) {
        const linha = Math.floor(lat / TAMANHO_LAT);
        const coluna = Math.floor(lon / TAMANHO_LON);
        return linha + ':' + coluna;
    }

    // Converte o identificador (ex: "123:456") nas coordenadas dos 4 cantos
    function calcularBoundsGrade(chave) {
        const partes = chave.split(':');
        const linha = Number(partes[0]);
        const coluna = Number(partes[1]);

        const sul = linha * TAMANHO_LAT;
        const norte = sul + TAMANHO_LAT;
        const oeste = coluna * TAMANHO_LON;
        const leste = oeste + TAMANHO_LON;

        return [
            [sul, oeste],
            [norte, leste]
        ];
    }

    // Inicializa o mapa leaflet
    function inicializarMapa() {
        mapa = L.map('mapa', { zoomControl: false }).setView(CENTRO_RJ, 11);
        L.control.zoom({ position: 'bottomright' }).addTo(mapa);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(mapa);

        camadaGrade = L.layerGroup().addTo(mapa);
        renderizadorCanvas = L.canvas({ padding: 0.2 });
    }

    // Desenha os quadrados de tiroteios no mapa para o intervalo
    function renderizarGrade(anoInicio, anoFim) {
        if (!camadaGrade || !dadosCache) return;

        camadaGrade.clearLayers();

        const contagem = {};
        let total = 0;

        // 1. Soma as ocorrências por quadrante
        for (let ano = anoInicio; ano <= anoFim; ano++) {
            const pontos = dadosCache.pontosPorAno[ano];
            if (!pontos) continue;

            total = total + pontos.length;

            for (let i = 0; i < pontos.length; i++) {
                const ponto = pontos[i];
                const lat = ponto[0];
                const lon = ponto[1];
                const chave = calcularChaveGrade(lat, lon);

                if (contagem[chave]) {
                    contagem[chave] = contagem[chave] + 1;
                } else {
                    contagem[chave] = 1;
                }
            }
        }

        // 2. Encontra o valor máximo
        let maximo = 0;
        for (const chave in contagem) {
            if (contagem[chave] > maximo) {
                maximo = contagem[chave];
            }
        }

        // 3. Desenha cada retângulo colorido no mapa
        for (const chave in contagem) {
            const qtd = contagem[chave];

            // Descarta células com apenas 1 registro
            if (qtd <= 1) continue;

            const limites = calcularBoundsGrade(chave);
            const cor = obterCorCalor(qtd, maximo);

            const retangulo = L.rectangle(limites, {
                renderer: renderizadorCanvas,
                stroke: false,
                fillColor: cor,
                fillOpacity: 0.85
            });

            retangulo.bindTooltip(formatarNumero(qtd) + ' registros', { sticky: true });
            retangulo.addTo(camadaGrade);
        }

        // 4. Atualiza o número total na tela
        if (elTotal) {
            elTotal.textContent = formatarNumero(total);
        }

        if (elRotuloTotal) {
            const periodo = (anoInicio === anoFim) ? String(anoInicio) : (anoInicio + ' a ' + anoFim);
            elRotuloTotal.textContent = 'registros (' + periodo + ')';
        }
    }

    // Busca os dados da API
    async function carregarDados() {
        exibirAviso('Carregando dados de tiroteios...');
        try {
            const resposta = await fetch('/api/tiroteios/ocorrencias_mapa');
            if (!resposta.ok) {
                throw new Error('Não foi possível obter dados da API.');
            }
            dadosCache = await resposta.json();
            ocultarAviso();
            return dadosCache;
        } catch (erro) {
            console.error('Erro ao carregar dados de tiroteios:', erro);
            exibirAviso('Erro ao carregar dados de tiroteios.');
            throw erro;
        }
    }

    // Inicialização da página
    async function iniciar() {
        inicializarMapa();

        try {
            const dados = await carregarDados();
            if (!dados || !dados.anos || dados.anos.length === 0) {
                exibirAviso('Nenhum dado encontrado para o período.');
                return;
            }

            const slider = inicializarSliderAnos({
                anos: dados.anos,
                aoMudar: function (anoInicio, anoFim) {
                    renderizarGrade(anoInicio, anoFim);
                }
            });

            if (slider) {
                const intervalo = slider.obterIntervalo();
                renderizarGrade(intervalo.inicioAno, intervalo.fimAno);
            }
        } catch (e) {
            console.error('Falha na inicialização da página de tiroteios:', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
