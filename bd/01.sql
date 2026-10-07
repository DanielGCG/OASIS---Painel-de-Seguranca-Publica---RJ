CREATE DATABASE IF NOT EXISTS oasis_seguranca
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE oasis_seguranca;

CREATE TABLE IF NOT EXISTS ocorrencias_tiroteio (
    id INT UNSIGNED NOT NULL,
    data_hora DATETIME NOT NULL,
    ano SMALLINT UNSIGNED NOT NULL,
    mes VARCHAR(7) NOT NULL,
    dia_mes TINYINT UNSIGNED NOT NULL,
    hora TINYINT UNSIGNED NOT NULL,
    dia_semana VARCHAR(3) NOT NULL,
    periodo_do_dia VARCHAR(20) NOT NULL,
    municipio VARCHAR(120) NULL,
    bairro VARCHAR(120) NULL,
    localidade VARCHAR(180) NULL,
    area VARCHAR(180) NULL,
    sub_bairro VARCHAR(180) NULL,
    endereco_completo VARCHAR(500) NULL,
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    motivo VARCHAR(100) NULL,
    acao_policial BOOLEAN NOT NULL DEFAULT FALSE,
    presenca_agente BOOLEAN NOT NULL DEFAULT FALSE,
    chacina BOOLEAN NOT NULL DEFAULT FALSE,
    unidade_policial VARCHAR(255) NULL,
    batalhao_responsavel VARCHAR(255) NULL,
    numero_forcas TINYINT UNSIGNED NOT NULL DEFAULT 0,
    fonte VARCHAR(180) NULL,
    adicionado_no_banco_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_no_banco_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),

    INDEX indice_municipio (municipio),
    INDEX indice_bairro (bairro),
    INDEX indice_batalhao_responsavel (batalhao_responsavel)

) ENGINE=InnoDB;