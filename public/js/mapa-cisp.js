function criarMapaCisp(config) {
    // 1. Configurações padrão
    const elementoId = (config && config.elementoId) ? config.elementoId : 'mapa';
    const campoMetrica = (config && config.campoMetrica) ? config.campoMetrica : 'total';
    const campoTaxa = (config && config.campoTaxa) ? config.campoTaxa : 'taxa';
    const rotuloMetrica = (config && config.rotuloMetrica) ? config.rotuloMetrica : 'ocorrências';
    const tetoEstaticoConfig = (config && config.tetoEstatico) ? Number(config.tetoEstatico) : 5000;
    const urlDados = (config && config.urlDados) ? config.urlDados : null;

    const CENTRO_RJ = [-22.90351847, -43.19153696];

    // Estilos visuais dos polígonos
    const ESTILO_PADRAO = {
        weight: 1.1,
        opacity: 0.80,
        color: '#2a2a2a',
        dashArray: '',
        fillOpacity: 0.30,
        fillColor: '#ffffff'
    };

    const ESTILO_HOVER = {
        weight: 2.5,
        color: '#000000',
        fillOpacity: 0.95
    };

    // Elementos da interface
    const elContainer = document.getElementById(elementoId);
    if (!elContainer) {
        console.warn('Contêiner do mapa não encontrado:', elementoId);
        return null;
    }

    const elTotal = document.getElementById('totalOcorrencias');
    const elRotuloTotal = document.getElementById('rotuloTotalOcorrencias');

    // Estado interno
    let mapa = null;
    let camadaCisp = null;
    let dadosCache = null;
    let dadosPorCisp = {};
    const tetoReferenciaTaxa = tetoEstaticoConfig;

    // Utilitários de formatação
    function formatarNumero(numero) {
        return Number(numero || 0).toLocaleString('pt-BR');
    }

    function formatarDecimal(numero) {
        return Number(numero || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Calcula estilo contínuo de branco para vermelho atrelado à taxa estática
    function calcularEstiloCalor(taxa, teto) {
        if (!taxa || taxa <= 0 || !teto || teto <= 0) {
            return {
                weight: ESTILO_PADRAO.weight,
                opacity: ESTILO_PADRAO.opacity,
                color: ESTILO_PADRAO.color,
                dashArray: ESTILO_PADRAO.dashArray,
                fill: true,
                fillOpacity: 0.28,
                fillColor: '#ffffff'
            };
        }

        // Fator contínuo t no intervalo [0, 1] com escala suave (expoente 1.35)
        const proporcao = Math.min(1.0, taxa / teto);
        const t = Math.pow(proporcao, 1.35);

        // Interpolação: Branco -> Vermelho
        const r = Math.round(255 - t * (255 - 190));
        const g = Math.round(255 * (1 - t));
        const b = Math.round(255 * (1 - t));

        // Opacidade: translúcido (0.30) -> opaco (0.88)
        const opacidade = 0.30 + (0.58 * t);

        return {
            weight: ESTILO_PADRAO.weight,
            opacity: ESTILO_PADRAO.opacity,
            color: ESTILO_PADRAO.color,
            dashArray: ESTILO_PADRAO.dashArray,
            fill: true,
            fillOpacity: opacidade,
            fillColor: `rgb(${r}, ${g}, ${b})`
        };
    }

    // Estilo da feature no mapa
    function obterEstiloCisp(feature) {
        const cisp = feature.properties ? String(feature.properties.cisp) : '';
        const dados = dadosPorCisp[cisp];
        const taxa = dados ? dados.taxa : 0;

        return calcularEstiloCalor(taxa, tetoReferenciaTaxa);
    }

    const rendererCanvas = L.canvas({ padding: 0.5 });

    // Inicialização do Leaflet
    mapa = L.map(elementoId, {
        zoomControl: false,
        preferCanvas: true,
        renderer: rendererCanvas
    }).setView(CENTRO_RJ, 11);

    L.control.zoom({ position: 'bottomright' }).addTo(mapa);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(mapa);

    // Legenda
    const legenda = L.control({ position: 'bottomleft' });
    legenda.onAdd = function () {
        const div = L.DomUtil.create('div', 'legenda-calor-cisp');
        div.style.background = 'rgba(255, 255, 255, 0.92)';
        div.style.padding = '8px 12px';
        div.style.borderRadius = '4px';
        div.style.boxShadow = '0 1px 5px rgba(0,0,0,0.35)';
        div.style.fontSize = '12px';
        div.style.color = '#222';
        div.style.border = '1px solid rgba(0,0,0,0.15)';

        const meio = Math.round(tetoReferenciaTaxa / 2);

        div.innerHTML = `
            <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">Taxa Média Anual / 100 mil hab.</div>
            <div style="height: 12px; width: 160px; background: linear-gradient(to right, rgba(255,255,255,0.4), rgb(235,160,160), rgb(215,80,80), rgb(190,10,10)); border: 1px solid #888; border-radius: 2px;"></div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #444; margin-top: 3px; width: 160px;">
                <span>0</span>
                <span>${formatarNumero(meio)}</span>
                <span>${formatarNumero(tetoReferenciaTaxa)}+</span>
            </div>
        `;
        return div;
    };
    legenda.addTo(mapa);

    // Atualiza agregação e cores dos polígonos
    function atualizarCamadaPoligonos(anoInicio, anoFim) {
        if (!camadaCisp) return;
        dadosPorCisp = {};
        let totalGeral = 0;

        if (dadosCache && dadosCache.registros) {
            for (let i = 0; i < dadosCache.registros.length; i++) {
                const reg = dadosCache.registros[i];

                if (anoInicio !== undefined && anoFim !== undefined) {
                    if (reg.ano < anoInicio || reg.ano > anoFim) {
                        continue;
                    }
                }

                const cisp = String(reg.cisp);
                const qtdTotal = Number(reg.total || reg[campoMetrica] || 0);
                const pop = Number(reg.pop_circ || 0);

                let taxaAno = Number(reg.taxa || reg[campoTaxa] || 0);
                if (!taxaAno && pop > 0) {
                    taxaAno = (qtdTotal / pop) * 100000;
                }

                if (!dadosPorCisp[cisp]) {
                    dadosPorCisp[cisp] = {
                        cisp: cisp,
                        total: 0,
                        taxasPorAno: [],
                        populacoes: []
                    };
                }

                dadosPorCisp[cisp].total += qtdTotal;
                dadosPorCisp[cisp].taxasPorAno.push(taxaAno);
                if (pop > 0) {
                    dadosPorCisp[cisp].populacoes.push(pop);
                }

                totalGeral += qtdTotal;
            }
        }

        // Calcula a média das taxas anuais (média das médias dos anos selecionados)
        for (const cisp in dadosPorCisp) {
            const item = dadosPorCisp[cisp];
            const qtdAnos = item.taxasPorAno.length;

            let taxaMediaAnual = 0;
            if (qtdAnos > 0) {
                const somaTaxas = item.taxasPorAno.reduce((acc, val) => acc + val, 0);
                taxaMediaAnual = somaTaxas / qtdAnos;
            }

            const mediaPop = item.populacoes.length > 0
                ? (item.populacoes.reduce((acc, val) => acc + val, 0) / item.populacoes.length)
                : 0;

            item.taxa = Number(taxaMediaAnual.toFixed(2));
            item.qtdAnos = qtdAnos;
            item.pop_circ = mediaPop;
        }

        camadaCisp.setStyle(obterEstiloCisp);

        if (elTotal) {
            elTotal.textContent = dadosCache ? formatarNumero(totalGeral) : '--';
        }

        if (elRotuloTotal) {
            if (anoInicio !== undefined && anoFim !== undefined) {
                const periodo = (anoInicio === anoFim) ? String(anoInicio) : anoInicio + ' a ' + anoFim;
                elRotuloTotal.textContent = `${rotuloMetrica} (${periodo})`;
            } else {
                elRotuloTotal.textContent = rotuloMetrica;
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

            const geojson = await resposta.json();
            geojson.features.forEach(function (feature) {
                if (feature.geometry.type === 'MultiLineString') {
                    feature.geometry = {
                        type: 'MultiPolygon',
                        coordinates: feature.geometry.coordinates.map(linha => [linha])
                    };
                }
            });

            camadaCisp = L.geoJSON(geojson, {
                renderer: rendererCanvas,
                style: obterEstiloCisp,
                onEachFeature: function (feature, layer) {
                    const cisp = feature.properties ? String(feature.properties.cisp) : '';

                    layer.bindTooltip(function () {
                        const dados = dadosPorCisp[cisp];
                        let html = '<div class="p-1 text-dark" style="font-family: system-ui, -apple-system, sans-serif; min-width: 175px;">';
                        html += '<div class="border-bottom pb-1 mb-1">';
                        html += '<strong style="font-size: 1.05rem;">CISP ' + cisp + '</strong>';
                        if (feature.properties && feature.properties.municipio) {
                            html += '<span class="text-muted small ms-2">' + feature.properties.municipio + '</span>';
                        }
                        html += '</div>';

                        if (dados && (dados.total > 0 || dados.taxa > 0)) {
                            const sufixoTaxa = (dados.qtdAnos > 1) ? '/ 100 mil hab./ano' : '/ 100 mil hab.';
                            const rotuloTaxa = (dados.qtdAnos > 1) ? 'Taxa média anual' : 'Taxa anual';

                            html += '<div style="font-size: 0.9rem; line-height: 1.45;">';
                            html += `<div>${rotuloTaxa}: <strong style="color: #b71c1c; font-size: 1rem;">${formatarDecimal(dados.taxa)}</strong> <span style="font-size: 0.8rem; color: #555;">${sufixoTaxa}</span></div>`;
                            html += `<div>Total absoluto: <strong style="color: #111;">${formatarNumero(dados.total)}</strong> <span style="font-size: 0.8rem; color: #555;">ocorrências</span></div>`;
                            if (dados.pop_circ && dados.pop_circ > 0) {
                                html += `<div style="font-size: 0.78rem; color: #666; margin-top: 2px;">Pop. média: ${formatarNumero(Math.round(dados.pop_circ))} hab.</div>`;
                            }
                            html += '</div>';
                        } else if (dados) {
                            html += '<div class="text-muted small">0 ocorrências no período</div>';
                        } else {
                            html += '<div class="text-muted small">Aguardando dados...</div>';
                        }
                        html += '</div>';
                        return html;
                    }, {
                        sticky: true,
                        direction: 'auto',
                        opacity: 0.96
                    });

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

    // Carrega dados numéricos da API
    async function carregarDadosApi() {
        if (!urlDados) return null;

        try {
            const resposta = await fetch(urlDados);
            if (!resposta.ok) return null;
            dadosCache = await resposta.json();
            return dadosCache;
        } catch (erro) {
            console.warn('API de dados indisponível:', urlDados);
            return null;
        }
    }

    // Inicialização
    async function iniciar() {
        await carregarGeoJson();
        const dados = await carregarDadosApi();
        if (!dados) return;

        if (dados.anos && typeof inicializarSliderAnos === 'function') {
            const slider = inicializarSliderAnos({
                anos: dados.anos,
                aoMudar: function (inicio, fim) {
                    atualizarCamadaPoligonos(inicio, fim);
                }
            });
            if (slider) {
                const intervalo = slider.obterIntervalo();
                atualizarCamadaPoligonos(intervalo.inicioAno, intervalo.fimAno);
                return;
            }
        }

        atualizarCamadaPoligonos();
    }

    iniciar();

    return {
        mapa: mapa,
        atualizarCamadaPoligonos: atualizarCamadaPoligonos
    };
}
