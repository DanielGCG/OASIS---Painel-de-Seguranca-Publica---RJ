function criarMapaCisp(config) {
    // 1. Configurações padrão
    const elementoId = (config && config.elementoId) ? config.elementoId : 'mapa';
    const campoMetrica = (config && config.campoMetrica) ? config.campoMetrica : null;
    const urlDados = (config && config.urlDados) ? config.urlDados : null;

    const CENTRO_RJ = [-22.90351847, -43.19153696];

    // Tabela de cores da menor para a maior intensidade
    const TABELA_CORES = [
        { min: 0.85, cor: '#4a0404' },
        { min: 0.70, cor: '#800000' },
        { min: 0.55, cor: '#b71c1c' },
        { min: 0.40, cor: '#d9534f' },
        { min: 0.30, cor: '#ef8354' },
        { min: 0.20, cor: '#f5d094' },
        { min: 0.10, cor: '#f8e5c5' }
    ];

    const ESTILO_PADRAO = {
        weight: 1.5,
        opacity: 1,
        color: '#000000',      // Borda preta
        dashArray: '',         // Linha sólida
        fillOpacity: 0.82,     // Opacidade do preenchimento
        fillColor: '#181818'   // Mais escuro que o fundo do mapa
    };

    // Destaque do hover: altera apenas a área do CISP, mantendo a borda preta
    const ESTILO_HOVER = {
        color: '#000000',      // Borda permanece preta
        weight: 1.5,           // Espessura da borda inalterada
        fillOpacity: 0.50      // Efeito visual na área interna do CISP
    };

    // Elementos da tela
    const elContainer = document.getElementById(elementoId);
    if (!elContainer) {
        console.warn('Contêiner do mapa não encontrado:', elementoId);
        return null;
    }

    const elTotal = document.getElementById('totalOcorrencias');
    const elRotuloTotal = document.getElementById('rotuloTotalOcorrencias');

    // Variáveis internas
    let mapa = null;
    let camadaCisp = null;
    let geojsonCache = null;
    let dadosCache = null;
    let totaisPorCisp = {};
    let maximoAtual = 0;

    function formatarNumero(numero) {
        return Number(numero || 0).toLocaleString('pt-BR');
    }

    // Calcula a cor com base no valor e no valor máximo
    function obterCorCalor(valor, maximo) {
        if (valor <= 0 || maximo <= 0) {
            return '#181818'; // Cor escura para CISPs sem dados / valor zero
        }

        const intensidade = Math.log1p(valor) / Math.log1p(maximo);

        for (let i = 0; i < TABELA_CORES.length; i++) {
            if (intensidade >= TABELA_CORES[i].min) {
                return TABELA_CORES[i].cor;
            }
        }

        return '#f8e5c5';
    }

    // Inicializa o Leaflet
    mapa = L.map(elementoId, { zoomControl: false }).setView(CENTRO_RJ, 11);
    L.control.zoom({ position: 'bottomright' }).addTo(mapa);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(mapa);

    // Renderiza ou atualiza as cores dos polígonos das delegacias
    function atualizarCamadaPoligonos(anoInicio, anoFim) {
        if (!camadaCisp) return;

        totaisPorCisp = {};
        let totalGeral = 0;

        // Se houver dados carregados, soma os valores do período
        if (dadosCache && dadosCache.registros && campoMetrica) {
            for (let i = 0; i < dadosCache.registros.length; i++) {
                const reg = dadosCache.registros[i];

                if (anoInicio !== undefined && anoFim !== undefined) {
                    if (reg.ano < anoInicio || reg.ano > anoFim) {
                        continue;
                    }
                }

                const qtd = Number(reg[campoMetrica] || 0);
                const cisp = String(reg.cisp);

                if (totaisPorCisp[cisp]) {
                    totaisPorCisp[cisp] = totaisPorCisp[cisp] + qtd;
                } else {
                    totaisPorCisp[cisp] = qtd;
                }

                totalGeral = totalGeral + qtd;
            }
        }

        // Calcula o máximo com loop simples (sem operador ...)
        maximoAtual = 0;
        for (const cisp in totaisPorCisp) {
            if (totaisPorCisp[cisp] > maximoAtual) {
                maximoAtual = totaisPorCisp[cisp];
            }
        }

        // Aplica o novo estilo e cores aos polígonos
        camadaCisp.setStyle(function (feature) {
            const cisp = feature.properties ? String(feature.properties.cisp) : '';
            const qtd = totaisPorCisp[cisp] || 0;
            const cor = obterCorCalor(qtd, maximoAtual);

            return {
                weight: ESTILO_PADRAO.weight,
                opacity: ESTILO_PADRAO.opacity,
                color: ESTILO_PADRAO.color,
                dashArray: ESTILO_PADRAO.dashArray,
                fillOpacity: ESTILO_PADRAO.fillOpacity,
                fillColor: cor
            };
        });

        // Atualiza os contadores na tela se existirem
        if (elTotal) {
            elTotal.textContent = (dadosCache && campoMetrica) ? formatarNumero(totalGeral) : '--';
        }

        if (elRotuloTotal) {
            if (anoInicio && anoFim) {
                const periodo = (anoInicio === anoFim) ? String(anoInicio) : (anoInicio + ' a ' + anoFim);
                elRotuloTotal.textContent = 'registros' + ' (' + periodo + ')';
            } else {
                elRotuloTotal.textContent = 'registros';
            }
        }
    }

    // Carrega o arquivo geográfico cisp.geojson e monta a camada
    async function carregarGeoJson() {
        try {
            const resposta = await fetch('/cisp.geojson');
            if (!resposta.ok) {
                throw new Error('Não foi possível carregar cisp.geojson');
            }

            geojsonCache = await resposta.json();

            camadaCisp = L.geoJSON(geojsonCache, {
                style: function () {
                    return ESTILO_PADRAO;
                },
                onEachFeature: function (feature, layer) {
                    const cisp = feature.properties ? String(feature.properties.cisp) : '';

                    layer.bindTooltip(function () {
                        const qtd = totaisPorCisp[cisp];
                        let texto = '<strong>CISP ' + cisp + '</strong>';

                        if (qtd !== undefined && campoMetrica) {
                            texto = texto + '<br><strong class="text-warning">' + formatarNumero(qtd) + '</strong> ' + 'registros';
                        } else {
                            texto = texto + '<br><span class="small text-muted">Aguardando dados</span>';
                        }

                        return texto;
                    }, { sticky: true });

                    layer.on({
                        mouseover: function () {
                            layer.setStyle(ESTILO_HOVER);
                        },
                        mouseout: function () {
                            camadaCisp.resetStyle(layer);
                        }
                    });
                }
            });

            camadaCisp.addTo(mapa);
            atualizarCamadaPoligonos();

        } catch (erro) {
            console.error('Erro ao carregar mapa territorial (CISP):', erro);
        }
    }

    // Carrega os dados numéricos da API se fornecida
    async function carregarDadosApi() {
        if (!urlDados) return null;

        try {
            const resposta = await fetch(urlDados);
            if (!resposta.ok) {
                return null;
            }
            dadosCache = await resposta.json();
            return dadosCache;
        } catch (erro) {
            console.warn('API de dados ainda não disponível para este crime:', urlDados);
            return null;
        }
    }

    // Inicia tudo
    async function iniciar() {
        await carregarGeoJson();
        const dados = await carregarDadosApi();

        if (dados && dados.anos && typeof inicializarSliderAnos === 'function') {
            const slider = inicializarSliderAnos({
                anos: dados.anos,
                aoMudar: function (inicio, fim) {
                    atualizarCamadaPoligonos(inicio, fim);
                }
            });

            if (slider) {
                const intervalo = slider.obterIntervalo();
                atualizarCamadaPoligonos(intervalo.inicioAno, intervalo.fimAno);
            }
        }
    }

    iniciar();

    return {
        mapa: mapa,
        atualizarCamadaPoligonos: atualizarCamadaPoligonos
    };
}

