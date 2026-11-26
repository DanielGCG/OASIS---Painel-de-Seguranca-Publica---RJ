function criarMapaCisp({ elementoId, rotuloMetrica, tetoEstatico, urlDados, aoAtualizar }) {
    const tetoReferenciaTaxa = Number(tetoEstatico);

    const CENTRO_RJ = [-22.90351847, -43.19153696];

    const ESTILO_PADRAO = {
        weight: 1.1,
        opacity: 0.80,
        color: '#2a2a2a',
        fill: true,
        fillOpacity: 0.28,
        fillColor: '#ffffff'
    };

    const ESTILO_HOVER = {
        weight: 3,
        opacity: 1,
        color: '#d32f2f',
        fillOpacity: 0
    };

    const elTotal = document.getElementById('totalOcorrencias');
    const elRotuloTotal = document.getElementById('rotuloTotalOcorrencias');

    let camadaCisp = null;
    let dadosCache = null;
    let dadosPorCisp = {};
    let anosFiltrados = [];
    let taxaEstadualPorAno = {};
    let cispSelecionada = null;

    const formatarNumero = (n) => Number(n || 0).toLocaleString('pt-BR');

    function notificarAtualizacao() {
        if (!aoAtualizar) return;

        if (!dadosCache || anosFiltrados.length === 0) {
            aoAtualizar({ labels: [], valores: [], cispSelecionada });
            return;
        }

        const dadosCisp = cispSelecionada ? dadosPorCisp[cispSelecionada] : null;
        aoAtualizar({
            labels: anosFiltrados.map(String),
            valores: anosFiltrados.map(ano => cispSelecionada
                ? (dadosCisp?.taxaPorAno[ano] ?? 0)
                : (taxaEstadualPorAno[ano] || 0)
            ),
            cispSelecionada
        });
    }

    function limparSelecao() {
        if (!cispSelecionada) return;
        cispSelecionada = null;
        if (camadaCisp) camadaCisp.setStyle(obterEstiloCisp);
        notificarAtualizacao();
    }

    function calcularEstiloCalor(taxa, teto) {
        if (!taxa || taxa <= 0 || !teto || teto <= 0) {
            return { ...ESTILO_PADRAO };
        }

        const t = Math.pow(Math.min(1.0, taxa / teto), 1.35);
        const r = Math.round(255 - t * 65);
        const gb = Math.round(255 * (1 - t));

        return {
            ...ESTILO_PADRAO,
            fillOpacity: 0.30 + (0.58 * t),
            fillColor: `rgb(${r}, ${gb}, ${gb})`
        };
    }

    function obterEstiloCisp(feature) {
        const cisp = String(feature.properties.cisp);
        const dados = dadosPorCisp[cisp];
        const estilo = calcularEstiloCalor(dados ? dados.taxa : 0, tetoReferenciaTaxa);

        if (cispSelecionada && cisp === cispSelecionada) {
            estilo.weight = 3.5;
            estilo.opacity = 1;
            estilo.color = '#d32f2f';
        }

        return estilo;
    }

    const rendererCanvas = L.canvas({ padding: 0.5 });
    const mapa = L.map(elementoId, {
        zoomControl: false,
        preferCanvas: true,
        renderer: rendererCanvas
    }).setView(CENTRO_RJ, 11);

    L.control.zoom({ position: 'bottomright' }).addTo(mapa);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(mapa);

    // Legenda com escala
    const legenda = L.control({ position: 'bottomleft' });
    legenda.onAdd = function () {
        const div = L.DomUtil.create('div', 'bg-white bg-opacity-75 p-2 rounded-1 shadow-sm border text-dark small');
        const meio = Math.round(tetoReferenciaTaxa / 2);

        div.innerHTML = `
            <div class="fw-semibold text-uppercase mb-1" style="font-size: 0.68rem;">Taxa Média Anual / 100 mil hab.</div>
            <div class="w-100 border border-secondary-subtle rounded-1" style="height: 11px; background: linear-gradient(to right, rgba(255,255,255,0.4), rgb(235,160,160), rgb(215,80,80), rgb(190,10,10));"></div>
            <div class="w-100 d-flex justify-content-between text-muted mt-1" style="font-size: 0.65rem;">
                <span>0</span>
                <span>${formatarNumero(meio)}</span>
                <span>${formatarNumero(tetoReferenciaTaxa)}+</span>
            </div>
        `;
        return div;
    };
    legenda.addTo(mapa);

    
    function atualizarCamadaPoligonos(anoInicio, anoFim) {
        if (!camadaCisp || !dadosCache) return;

        dadosPorCisp = {};
        taxaEstadualPorAno = {};
        anosFiltrados = dadosCache.anos.filter(a => a >= anoInicio && a <= anoFim);

        let totalGeral = 0;
        const estadoPorAno = {};

        for (const reg of dadosCache.registros) {
            if (reg.ano < anoInicio || reg.ano > anoFim) continue;

            const cisp = String(reg.cisp);
            const pop = Number(reg.pop_circ) || 0;

            const item = dadosPorCisp[cisp] ||= { total: 0, somaTaxas: 0, qtdAnos: 0, somaPop: 0, qtdPop: 0, taxaPorAno: {} };
            item.total += reg.total;
            item.somaTaxas += reg.taxa;
            item.qtdAnos += 1;
            item.taxaPorAno[reg.ano] = reg.taxa;
            if (pop > 0) { item.somaPop += pop; item.qtdPop += 1; }

            const est = estadoPorAno[reg.ano] ||= { total: 0, pop: 0 };
            est.total += reg.total;
            est.pop += pop;
            totalGeral += reg.total;
        }

        for (const ano of anosFiltrados) {
            const est = estadoPorAno[ano];
            taxaEstadualPorAno[ano] = est?.pop ? Number(((est.total / est.pop) * 100000).toFixed(2)) : 0;
        }

        for (const item of Object.values(dadosPorCisp)) {
            item.taxa = Number((item.somaTaxas / item.qtdAnos).toFixed(2));
            item.pop_circ = item.qtdPop ? (item.somaPop / item.qtdPop) : 0;
        }

        camadaCisp.setStyle(obterEstiloCisp);

        elTotal.textContent = formatarNumero(totalGeral);
        const periodo = anoInicio === anoFim ? anoInicio : `${anoInicio} a ${anoFim}`;
        elRotuloTotal.textContent = `${rotuloMetrica} (${periodo})`;

        notificarAtualizacao();
    }

    async function carregarGeoJson() {
        try {
            const resposta = await fetch('/cisp.geojson');
            if (!resposta.ok) throw new Error('Não foi possível carregar cisp.geojson');

            const geojson = await resposta.json();
            geojson.features.forEach(feature => {
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
                    const cisp = String(feature.properties.cisp);

                    layer.bindTooltip(function () {
                        const dados = dadosPorCisp[cisp];
                        let corpo = '<div class="text-muted">Sem dados</div>';

                        if (dados && (dados.total > 0 || dados.taxa > 0)) {
                            const sufixo = dados.qtdAnos > 1 ? '/100k/ano' : '/100k';
                            corpo = `
                                <div>Taxa: <strong class="text-danger">${dados.taxa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> <span class="text-muted">${sufixo}</span></div>
                                <div>Total: <strong>${formatarNumero(dados.total)}</strong></div>
                                ${dados.pop_circ > 0 ? `<div class="text-muted">Pop.: ${formatarNumero(Math.round(dados.pop_circ))}</div>` : ''}
                            `;
                        } else if (dados) {
                            corpo = '<div class="text-muted">Sem ocorrências</div>';
                        }

                        return `
                            <div class="small lh-sm text-dark">
                                <div class="border-bottom pb-1 mb-1"><strong>CISP ${cisp}</strong></div>
                                ${corpo}
                            </div>
                        `;
                    }, { sticky: true, direction: 'auto', opacity: 0.96 });

                    layer.on({
                        mouseover: () => {
                            layer.setStyle(ESTILO_HOVER);
                            layer.bringToFront();
                        },
                        mouseout: () => layer.setStyle(obterEstiloCisp(feature)),
                        click: () => {
                            cispSelecionada = (cispSelecionada === cisp) ? null : cisp;
                            camadaCisp.setStyle(obterEstiloCisp);
                            if (cispSelecionada) layer.bringToFront();
                            notificarAtualizacao();
                        }
                    });
                }
            });

            camadaCisp.addTo(mapa);
        } catch (erro) {
            console.error('Erro ao carregar mapa de CISP:', erro);
        }
    }

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

    async function iniciar() {
        await carregarGeoJson();
        const dados = await carregarDadosApi();
        if (!dados) {
            notificarAtualizacao();
            return;
        }

        const slider = inicializarSliderAnos({
            anos: dados.anos,
            aoMudar: (inicio, fim) => atualizarCamadaPoligonos(inicio, fim)
        });
        const { inicioAno, fimAno } = slider.obterIntervalo();
        atualizarCamadaPoligonos(inicioAno, fimAno);
    }

    iniciar();

    return { mapa, atualizarCamadaPoligonos, limparSelecao };
}
