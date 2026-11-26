function criarGraficoRanking(config = {}) {
    const elCanvas = document.getElementById(config.canvasId || 'graficoRanking');
    if (!elCanvas) return null;

    const elContainer = document.getElementById(config.containerId || 'containerCanvasRanking');
    const elAviso = document.getElementById(config.avisoId || 'avisoRanking');
    const ALTURA_POR_BARRA = 28;
    let grafico = null;

    function ajustarAltura(qtdItens) {
        if (!elContainer) return;
        elContainer.style.height = qtdItens ? `${Math.max(180, qtdItens * ALTURA_POR_BARRA)}px` : '100%';
    }

    function atualizar({ labels = [], valores = [] } = {}) {
        if (!labels.length) {
            if (grafico) {
                grafico.destroy();
                grafico = null;
            }
            ajustarAltura(0);
            if (elAviso) {
                elAviso.textContent = 'Dados ainda não disponíveis.';
                elAviso.classList.remove('d-none');
            }
            return;
        }

        if (elAviso) elAviso.classList.add('d-none');
        ajustarAltura(labels.length);

        if (grafico) {
            grafico.data.labels = labels;
            grafico.data.datasets[0].data = valores;
            grafico.resize();
            grafico.update();
            return;
        }

        Chart.defaults.color = '#d4cfc5';
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

        grafico = new Chart(elCanvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Taxa (/100 mil hab.)',
                    data: valores,
                    backgroundColor: '#fed085',
                    barThickness: 16
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true },
                    y: { ticks: { autoSkip: false } }
                }
            }
        });
    }

    atualizar();

    return { atualizar };
}
