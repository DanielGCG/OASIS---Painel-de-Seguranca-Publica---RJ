function criarMapaMunic({ elementoId }) {

    const CENTRO_RJ = [-22.90351847, -43.19153696];

    let camadaMunic = null;
    let municSelecionado = null;

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

}