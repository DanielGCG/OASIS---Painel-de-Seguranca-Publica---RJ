function criarMapaCisp(config) {
    // 1. Configurações padrão
    const elementoId = (config && config.elementoId) ? config.elementoId : 'mapa';
    const campoMetrica = (config && config.campoMetrica) ? config.campoMetrica : null;
    const urlDados = (config && config.urlDados) ? config.urlDados : null;

    const CENTRO_RJ = [-22.90351847, -43.19153696];

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

    // Estilo padrão dos polígonos
    const ESTILO_PADRAO = {
        weight: 1.5,
        opacity: 1,
        color: '#000000',
        dashArray: '',
        fillOpacity: 0.82,
        fillColor: '#181818'
    };

    const ESTILO_HOVER = {
        weight: 1.5,
        color: '#000000',
        fillOpacity: 0.50
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

    // Formata números no padrão brasileiro
    function formatarNumero(numero) {
        return Number(numero || 0).toLocaleString('pt-BR');
    }

    // Obtém a cor de acordo com a intensidade do valor
    function obterCorCalor(valor, maximo) {
        if (valor <= 0 || maximo <= 0) {
            return '#181818';
        }

        const intensidade = Math.log1p(valor) / Math.log1p(maximo);

        for (let i = 0; i < TABELA_CORES.length; i++) {
            if (intensidade >= TABELA_CORES[i].ints) {
                return TABELA_CORES[i].cor;
            }
        }

        return '#f8e5c5';
    }

    // Retorna o estilo de uma área de um CISP de acordo com o dado
    function obterEstiloCisp(feature) {
        const cisp = feature.properties ? String(feature.properties.cisp) : '';
        const qtd = totaisPorCisp[cisp] || 0;
        const cor = obterCorCalor(qtd, maximoAtual);

        return {
            weight: ESTILO_PADRAO.weight,
            opacity: ESTILO_PADRAO.opacity,
            color: ESTILO_PADRAO.color,
            dashArray: ESTILO_PADRAO.dashArray,
            fill: true,
            fillOpacity: ESTILO_PADRAO.fillOpacity,
            fillColor: cor
        };
    }
    const rendererCanvas = L.canvas({ padding: 0.5 });

    // Inicializa o mapa Leaflet
    mapa = L.map(elementoId, {
        zoomControl: false,
        preferCanvas: true,
        renderer: rendererCanvas
    }).setView(CENTRO_RJ, 11);
    L.control.zoom({ position: 'bottomright' }).addTo(mapa);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(mapa);

    // Atualiza os dados e as cores dos polígonos
    function atualizarCamadaPoligonos(anoInicio, anoFim) {
        if (!camadaCisp) return;
        totaisPorCisp = {};
        let totalGeral = 0;

        // Calcula os totais por CISP
        if (dadosCache && dadosCache.registros && campoMetrica) {
            for (let i = 0; i < dadosCache.registros.length; i++) {
                const reg = dadosCache.registros[i];
                // Filtro por período
                if (anoInicio !== undefined && anoFim !== undefined) {
                    if (reg.ano < anoInicio || reg.ano > anoFim) {
                        continue;
                    }
                }

                const qtd = Number(reg[campoMetrica] || 0);
                const cisp = String(reg.cisp);

                if (totaisPorCisp[cisp] !== undefined) {
                    totaisPorCisp[cisp] += qtd;
                } else {
                    totaisPorCisp[cisp] = qtd;
                }

                totalGeral += qtd;
            }
        }

        // Calcula o valor máximo
        maximoAtual = 0;
        for (const cisp in totaisPorCisp) {
            if (totaisPorCisp[cisp] > maximoAtual) {
                maximoAtual = totaisPorCisp[cisp];
            }
        }

        // Preenche cada área
        camadaCisp.setStyle(obterEstiloCisp);

        // Atualiza o contador geral
        if (elTotal) {
            elTotal.textContent = (dadosCache && campoMetrica) ? formatarNumero(totalGeral) : '--';
        }

        // Atualiza o rótulo do período
        if (elRotuloTotal) {
            if (anoInicio !== undefined && anoFim !== undefined) {
                const periodo = (anoInicio === anoFim) ? String(anoInicio) : anoInicio + ' a ' + anoFim;
                elRotuloTotal.textContent = 'registros (' + periodo + ')';
            } else {
                elRotuloTotal.textContent = 'registros';
            }
        }
    }

    // Carrega o GeoJSON das delegacias
    async function carregarGeoJson() {
        try {
            const resposta = await fetch('/cisp.geojson');
            if (!resposta.ok) {
                throw new Error('Não foi possível carregar cisp.geojson');
            }

            geojsonCache = await resposta.json();
            geojsonCache.features.forEach(function (feature) {
                if (feature.geometry.type === 'MultiLineString') {
                    feature.geometry = {
                        type: 'MultiPolygon',
                        coordinates: feature.geometry.coordinates.map(function (linha) {
                            return [linha];
                        })
                    };
                }
            });

            camadaCisp = L.geoJSON(geojsonCache, {
                renderer: rendererCanvas,
                style: obterEstiloCisp,
                // Configura os eventos de cada polígono
                onEachFeature: function (feature, layer) {
                    const cisp = feature.properties ? String(feature.properties.cisp) : '';

                    // Tooltip com informações do CISP
                    layer.bindTooltip(function () {
                        const qtd = totaisPorCisp[cisp];
                        let texto = '<strong>CISP ' + cisp + '</strong>';

                        if (qtd !== undefined && campoMetrica) {
                            texto += '<br><strong class="text-warning">' + formatarNumero(qtd) + '</strong> registros';
                        } else {
                            texto += '<br><span class="small text-muted">' + 'Aguardando dados' + '</span>';
                        }
                        return texto;
                    }, {
                        sticky: true,
                        direction: 'auto',
                        opacity: 0.95
                    });

                    // Hover sobre o interior do polígono
                    layer.on({
                        mouseover: function () {
                            layer.setStyle(ESTILO_HOVER);
                            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                layer.bringToFront();
                            }
                        },
                        mouseout: function () {
                            layer.setStyle(obterEstiloCisp(feature));
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

    // Carrega os dados numéricos da API
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

    // Inicializa o mapa
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
