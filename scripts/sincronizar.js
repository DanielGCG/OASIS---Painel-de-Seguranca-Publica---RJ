require('dotenv').config();
async function sincronizar() {
    const nomeModelo = process.argv[2];
    if (!nomeModelo) { // Erro de uso
        console.error('Uso: npm run sincronizar <nome do modelo>');
        process.exitCode = 1;
        return;
    }
    
    let modelo;
    try {
        modelo = require(`../bd/modelos/${nomeModelo}`);
    }
    catch (error) { // Erro ao carregar o modelo
        console.error(`Erro ao carregar o modelo ${nomeModelo}:`, error);
        console.error(`Verifique se existe o arquivo: bd/modelos/${nomeModelo}.js`);
        process.exitCode = 1;
        return;
    }

    try { // Erro ao sincronizar o modelo
        await modelo.sync({ alter: true });
        console.log(`Modelo ${nomeModelo} sincronizado com sucesso.`);
        process.exitCode = 0;
        return;
    }
    catch (error) {
        console.error(`Erro ao sincronizar o modelo ${nomeModelo}:`, error);
        process.exitCode = 1;
        return;
    }

}

sincronizar();