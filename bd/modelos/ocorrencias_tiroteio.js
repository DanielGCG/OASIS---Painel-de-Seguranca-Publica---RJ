const { DataTypes } = require('sequelize');
const banco = require('../conexao');

const Ocorrencias_tiroteio = banco.define('ocorrencias_tiroteio', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true},
    data_hora: { type: DataTypes.DATE, allowNull: false },
    ano: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    mes: { type: DataTypes.STRING(7), allowNull: false },
    dia_mes: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    hora: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    dia_semana: { type: DataTypes.STRING(3), allowNull: false },
    periodo_do_dia: { type: DataTypes.STRING(20), allowNull: false },
    municipio: { type: DataTypes.STRING(120), allowNull: true },
    bairro: { type: DataTypes.STRING(120), allowNull: true },
    localidade: { type: DataTypes.STRING(180), allowNull: true },
    area: { type: DataTypes.STRING(180), allowNull: true },
    sub_bairro: { type: DataTypes.STRING(180), allowNull: true },
    endereco_completo: { type: DataTypes.STRING(500), allowNull: true },
    latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    motivo: { type: DataTypes.STRING(100), allowNull: true },
    acao_policial: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    presenca_agente: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    chacina: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    unidade_policial: { type: DataTypes.STRING(255), allowNull: true },
    batalhao_responsavel: { type: DataTypes.STRING(255), allowNull: true },
    numero_forcas: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
    fonte: { type: DataTypes.STRING(180), allowNull: true },
    adicionado_no_banco_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    atualizado_no_banco_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
    tableName: 'ocorrencias_tiroteio',
    timestamps: false,
    indexes: [
        { fields: ['municipio'] },
        { fields: ['bairro'] },
        { fields: ['batalhao_responsavel'] },
    ],
});

module.exports = Ocorrencias_tiroteio;