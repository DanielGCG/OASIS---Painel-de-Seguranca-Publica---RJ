function inicializarSliderAnos(config = {}) {
    const elSlider = document.getElementById('sliderAnos');
    const anos = Array.isArray(config.anos) ? config.anos.slice() : [];
    const aoMudar = config.aoMudar;

    if (!elSlider || !anos.length) return null;

    const elRotuloInicio = document.getElementById('rotuloAnoInicio');
    const elRotuloFim = document.getElementById('rotuloAnoFim');
    const elBadgeQtd = document.getElementById('badgeQtdAnos');
    const elSpanMinAno = document.getElementById('spanMinAno');
    const elSpanMaxAno = document.getElementById('spanMaxAno');
    const botoesPreset = document.querySelectorAll('.botao-preset');

    const maxIdx = anos.length - 1;

    if (elSlider.noUiSlider) elSlider.noUiSlider.destroy();

    noUiSlider.create(elSlider, {
        start: [0, maxIdx],
        connect: true,
        behaviour: 'drag-tap',
        step: 1,
        range: { min: 0, max: Math.max(1, maxIdx) }
    });

    if (maxIdx === 0) elSlider.setAttribute('disabled', true);

    function obterIntervalo() {
        const [a, b] = elSlider.noUiSlider.get().map(v => Math.min(maxIdx, Math.round(Number(v))));
        const inicioIdx = Math.min(a, b);
        const fimIdx = Math.max(a, b);
        return {
            inicioAno: anos[inicioIdx],
            fimAno: anos[fimIdx],
            inicioIdx,
            fimIdx
        };
    }

    function alternarDestaqueBotoes(botaoAtivo) {
        botoesPreset.forEach(b => {
            b.classList.toggle('btn-dark', b === botaoAtivo);
            b.classList.toggle('btn-outline-secondary', b !== botaoAtivo);
        });
    }

    function atualizarRotulos() {
        const { inicioAno, fimAno, inicioIdx, fimIdx } = obterIntervalo();
        const qtd = fimIdx - inicioIdx + 1;
        if (elRotuloInicio) elRotuloInicio.textContent = inicioAno;
        if (elRotuloFim) elRotuloFim.textContent = fimAno;
        if (elBadgeQtd) elBadgeQtd.textContent = qtd + (qtd > 1 ? ' anos' : ' ano');
    }

    function definirIntervalo(idxInicio, idxFim, dispararCallback) {
        elSlider.noUiSlider.set([Math.min(idxInicio, idxFim), Math.max(idxInicio, idxFim)]);
        if (dispararCallback && aoMudar) {
            const { inicioAno, fimAno } = obterIntervalo();
            aoMudar(inicioAno, fimAno);
        }
    }

    if (elSpanMinAno) elSpanMinAno.textContent = anos[0];
    if (elSpanMaxAno) elSpanMaxAno.textContent = anos[maxIdx];
    const btnInicial = document.querySelector('.botao-preset[data-preset="inicial"]');
    if (btnInicial) btnInicial.textContent = anos[0];

    alternarDestaqueBotoes(document.querySelector('.botao-preset[data-preset="tudo"]'));

    elSlider.noUiSlider.on('update', atualizarRotulos);
    elSlider.noUiSlider.on('change', function () {
        alternarDestaqueBotoes(null);
        if (aoMudar) {
            const { inicioAno, fimAno } = obterIntervalo();
            aoMudar(inicioAno, fimAno);
        }
    });

    botoesPreset.forEach(btn => {
        btn.onclick = function () {
            alternarDestaqueBotoes(btn);
            let inicio = 0;
            let fim = maxIdx;

            if (btn.dataset.preset === 'ultimos3') inicio = Math.max(0, maxIdx - 2);
            else if (btn.dataset.preset === 'ultimo1') inicio = maxIdx;
            else if (btn.dataset.preset === 'inicial') fim = 0;

            definirIntervalo(inicio, fim, true);
        };
    });

    return { obterIntervalo, definirIntervalo };
}
