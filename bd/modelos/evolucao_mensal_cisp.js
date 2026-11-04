const { DataTypes } = require('sequelize');
const banco = require('../conexao');

const Evolucao_mensal_cisp = banco.define('evolucao_mensal_cisp', {
    id: { type: DataTypes.INTEGER, primaryKey:true, autoIncrement: true}, 
    cisp: { type: DataTypes.SMALLINT, allowNull: false},  
    mes: { type: DataTypes.SMALLINT, allowNull: false}, 
    ano: { type: DataTypes.SMALLINT, allowNull: false}, 
    munic: { type: DataTypes.STRING(120), allowNull: false}, 
    hom_doloso: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0}, 
    lesao_corp_morte: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0},
    latrocinio: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0},
    cvli: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0},
    hom_por_interv_policial: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0},
    feminicidio: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0},
    letalidade_violenta: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0},
    tentat_hom: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0},
    tentativa_feminicidio: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0},
    lesao_corp_dolosa: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0},
    estupro: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0},
    hom_culposo: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0},
    lesao_corp_culposa: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0},
    total_roubos: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0},
    total_furtos: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0},
}, {
    tableName: 'evolucao_mensal_cisp',
    timestamps: false,
    indexes: [
        { fields: ['cisp'] },
        { fields: ['munic'] },
        {fields: ['ano', 'mes']},
    ],
});

module.exports = Evolucao_mensal_cisp;
