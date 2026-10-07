const { Sequelize } = require('sequelize');

const banco = new Sequelize(
    process.env.BANCO_NOME,
    process.env.BANCO_USUARIO,
    process.env.BANCO_SENHA,
    {
        host: process.env.BANCO_HOST,
        port: Number(process.env.BANCO_PORTA),
        dialect: 'mariadb',
        logging: process.env.BANCO_LOG === 'true' ? console.log : false,
        define: {
            underscored: true,
            timestamps: true,
        },
    },
);

module.exports = banco;