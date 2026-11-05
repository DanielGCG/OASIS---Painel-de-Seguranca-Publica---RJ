function inicializarSliderAnos(config) {
    const elAlcaA = document.getElementById('sliderHandleA');
    const elAlcaB = document.getElementById('sliderHandleB');
    const elProgresso = document.getElementById('sliderProgresso');
    const elRotuloInicio = document.getElementById('rotuloAnoInicio');
    const elRotuloFim = document.getElementById('rotuloAnoFim');
    const elBadgeQtd = document.getElementById('badgeQtdAnos');
    const elSpanMinAno = document.getElementById('spanMinAno');
    const elSpanMaxAno = document.getElementById('spanMaxAno');
    const botoesPreset = document.querySelectorAll('.botao-preset');

    const anos = config ? config.anos : null;
    const aoMudar = config ? config.aoMudar : null;

    if (!elAlcaA || !elAlcaB || !anos || anos.length === 0) {
        return null;
    }

    const anosDisponiveis = anos.slice();

    function obterIntervalo() {
        const idxA = Number(elAlcaA.value);
        const idxB = Number(elAlcaB.value);
        const inicioIdx = Math.min(idxA, idxB);
        const fimIdx = Math.max(idxA, idxB);

        return {
            inicioAno: anosDisponiveis[inicioIdx],
            fimAno: anosDisponiveis[fimIdx],
            inicioIdx: inicioIdx,
            fimIdx: fimIdx
        };
    }

    function alternarDestaqueBotoes(botaoAtivo) {
        for (let i = 0; i < botoesPreset.length; i++) {
            const b = botoesPreset[i];
            b.classList.toggle('btn-dark', b === botaoAtivo);
            b.classList.toggle('btn-outline-secondary', b !== botaoAtivo);
        }
    }

    function atualizarVisual() {
        if (anosDisponiveis.length === 0) return;

        const intervalo = obterIntervalo();
        const totalPassos = anosDisponiveis.length - 1;

        if (elRotuloInicio) elRotuloInicio.textContent = intervalo.inicioAno;
        if (elRotuloFim) elRotuloFim.textContent = intervalo.fimAno;

        const qtdAnos = intervalo.fimIdx - intervalo.inicioIdx + 1;
        if (elBadgeQtd) {
            elBadgeQtd.textContent = qtdAnos + (qtdAnos > 1 ? ' anos' : ' ano');
        }

        const porcentagemPasso = totalPassos > 0 ? (100 / totalPassos) : 0;
        if (elProgresso) {
            elProgresso.style.marginLeft = (intervalo.inicioIdx * porcentagemPasso) + '%';
            elProgresso.style.width = totalPassos > 0 ? ((intervalo.fimIdx - intervalo.inicioIdx) * porcentagemPasso) + '%' : '100%';
        }
    }

    function definirIntervalo(idxInicio, idxFim, dispararCallback) {
        elAlcaA.value = Math.min(idxInicio, idxFim);
        elAlcaB.value = Math.max(idxInicio, idxFim);
        atualizarVisual();

        if (dispararCallback && typeof aoMudar === 'function') {
            const intervalo = obterIntervalo();
            aoMudar(intervalo.inicioAno, intervalo.fimAno);
        }
    }

    // Configuração inicial dos limites
    const totalPassos = anosDisponiveis.length - 1;
    elAlcaA.min = 0;
    elAlcaA.max = totalPassos;
    elAlcaB.min = 0;
    elAlcaB.max = totalPassos;

    elAlcaA.value = 0;
    elAlcaB.value = totalPassos;

    if (elSpanMinAno) elSpanMinAno.textContent = anosDisponiveis[0];
    if (elSpanMaxAno) elSpanMaxAno.textContent = anosDisponiveis[totalPassos];

    const btnInicial = document.querySelector('.botao-preset[data-preset="inicial"]');
    if (btnInicial) btnInicial.textContent = anosDisponiveis[0];

    alternarDestaqueBotoes(document.querySelector('.botao-preset[data-preset="tudo"]'));
    atualizarVisual();

    // Eventos das alças do range
    const alcas = [elAlcaA, elAlcaB];
    for (let i = 0; i < alcas.length; i++) {
        const alca = alcas[i];

        alca.onpointerdown = function () {
            elAlcaA.style.zIndex = (alca === elAlcaA) ? 3 : 2;
            elAlcaB.style.zIndex = (alca === elAlcaB) ? 3 : 2;
        };

        alca.oninput = function () {
            atualizarVisual();
        };

        alca.onchange = function () {
            alternarDestaqueBotoes(null);
            atualizarVisual();
            if (typeof aoMudar === 'function') {
                const intervalo = obterIntervalo();
                aoMudar(intervalo.inicioAno, intervalo.fimAno);
            }
        };
    }

    // Eventos dos botões de atalho (presets)
    for (let i = 0; i < botoesPreset.length; i++) {
        const btn = botoesPreset[i];

        btn.onclick = function () {
            alternarDestaqueBotoes(btn);
            const passos = anosDisponiveis.length - 1;

            let inicio = 0;
            let fim = passos;

            if (btn.dataset.preset === 'ultimos3') {
                inicio = Math.max(0, passos - 2);
                fim = passos;
            } else if (btn.dataset.preset === 'ultimo1') {
                inicio = passos;
                fim = passos;
            } else if (btn.dataset.preset === 'inicial') {
                inicio = 0;
                fim = 0;
            }

            definirIntervalo(inicio, fim, true);
        };
    }

    return {
        obterIntervalo: obterIntervalo,
        definirIntervalo: definirIntervalo,
        atualizarVisual: atualizarVisual
    };
}
