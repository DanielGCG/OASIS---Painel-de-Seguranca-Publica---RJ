function criarGraficoEvolucao(config = {}) {
    const elCanvas = document.getElementById(config.canvasId || 'graficoEvolucao');
    if (!elCanvas) return null;

    const elTitulo = document.getElementById(config.tituloId || 'tituloGraficoEvolucao');
    const elBotaoLimpar = document.getElementById(config.botaoLimparId || 'btnLimparCisp');
    const elAviso = document.getElementById(config.avisoId || 'avisoGrafico');

    let grafico = null;

    if (elBotaoLimpar && config.aoLimparSelecao) {
        elBotaoLimpar.addEventListener('click', config.aoLimparSelecao);
    }

    function atualizar({ labels = [], valores = [], cispSelecionada } = {}) {
        if (elTitulo) {
            elTitulo.textContent = cispSelecionada
                ? `Evolução anual da taxa — CISP ${cispSelecionada}`
                : 'Evolução anual da taxa — Estado do Rio de Janeiro';
        }
        if (elBotaoLimpar) {
            elBotaoLimpar.classList.toggle('d-none', !cispSelecionada);
        }

        if (!labels.length) {
            if (grafico) {
                grafico.destroy();
                grafico = null;
            }
            if (elAviso) {
                elAviso.textContent = 'Dados ainda não disponíveis para este indicador.';
                elAviso.classList.remove('d-none');
            }
            return;
        }

        if (elAviso) elAviso.classList.add('d-none');

        const cor = cispSelecionada ? '#ef5350' : '#fed085';
        const label = cispSelecionada ? `CISP ${cispSelecionada} (/100 mil hab.)` : 'Estado do RJ (/100 mil hab.)';

        if (grafico) {
            grafico.data.labels = labels;
            grafico.data.datasets[0].label = label;
            grafico.data.datasets[0].data = valores;
            grafico.data.datasets[0].borderColor = cor;
            grafico.update();
            return;
        }

        Chart.defaults.color = '#d4cfc5';
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

        grafico = new Chart(elCanvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label,
                    data: valores,
                    borderColor: cor,
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    return { atualizar };
}
