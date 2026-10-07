const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
require('dotenv').config();

const banco = require('../bd/conexao');

async function importar() {
    const [, , nomeModel, arquivoCsv] = process.argv;

    if (!nomeModel || !arquivoCsv) {
        console.error('Uso: npm run importar -- <model> <arquivo.csv>');
        process.exitCode = 1;
        return;
    }

    // Tenta carregar o modelo informado
    let Model;

    try {
        Model = require(`../bd/modelos/${nomeModel}`);
    } catch (erro) {
        console.error(`Não foi possível carregar o modelo "${nomeModel}".`);
        console.error(`Verifique se existe o arquivo: bd/modelos/${nomeModel}.js`);

        process.exitCode = 1;
        return;
    }

    const arquivo = path.resolve(arquivoCsv);

    if (!fs.existsSync(arquivo)) {
        console.error(`Arquivo não encontrado: ${arquivo}`);
        process.exitCode = 1;
        return;
    }

    console.log(`Model: ${nomeModel}`);
    console.log(`CSV:   ${arquivo}`);

    // Lê o CSV
    const conteudo = fs.readFileSync(arquivo, 'utf8');

    const linhas = parse(conteudo, {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        trim: true
    });

    if (linhas.length === 0) {
        console.log('Nenhuma linha encontrada no CSV.');
        return;
    }

    console.log(`Linhas encontradas: ${linhas.length}`);

    // Obtém as colunas definidas no model Sequelize
    const colunasModel = Object.keys(Model.rawAttributes);

    console.log('\nColunas do model:');
    console.log(colunasModel.join(', '));

    // Colunas presentes no CSV
    const colunasCsv = Object.keys(linhas[0]);

    // Mostra colunas que existem no CSV mas não no model
    const colunasIgnoradas = colunasCsv.filter(coluna => !colunasModel.includes(coluna));

    if (colunasIgnoradas.length > 0) {
        console.log('\nColunas ignoradas do CSV:');
        console.log(colunasIgnoradas.join(', '));
    }

    // Converte valores do CSV
    function converterValor(valor) {
        if (valor === '') {
            return null;
        }

        if (typeof valor === 'string') {
            const valorNormalizado = valor.trim().toLowerCase();

            if (valorNormalizado === 'true') {
                return true;
            }

            if (valorNormalizado === 'false') {
                return false;
            }
        }

        return valor;
    }

    // Mantém somente as colunas existentes no model
    const registros = linhas.map(linha => {
        const registro = {};

        for (const coluna of colunasModel) {
            if (Object.prototype.hasOwnProperty.call(linha, coluna)) {
                registro[coluna] = converterValor(linha[coluna]);
            }
        }

        return registro;
    });

    // Colunas que serão atualizadas caso o ID já exista
    const colunasAtualizaveis = colunasModel.filter(
        coluna => coluna !== 'id' && coluna !== 'adicionado_no_banco_em'
    );

    const tamanhoLote = 5000;
    const totalLotes = Math.ceil(registros.length / tamanhoLote);

    console.log('\nIniciando importação...\n');

    for (let indice = 0; indice < registros.length; indice += tamanhoLote) {
        const lote = registros.slice(indice, indice + tamanhoLote);

        await Model.bulkCreate(lote, {
            updateOnDuplicate: colunasAtualizaveis
        });

        const numeroLote = Math.floor(indice / tamanhoLote) + 1;

        console.log(
            `Lote ${numeroLote}/${totalLotes} importado ` +
            `(${lote.length} registros).`
        );
    }

    console.log(`\nImportação concluída: ${registros.length} registros.`);
}

importar()
    .catch(erro => {
        console.error('\nFalha na importação:');
        console.error(erro);
        process.exitCode = 1;
    })
    .finally(async () => {
        await banco.close();
    });