CREATE TABLE IF NOT EXISTS ocorrencias_tiroteio (
    id SERIAL PRIMARY KEY,
    data_hora TIMESTAMP NOT NULL,
    ano SMALLINT NOT NULL,
    mes VARCHAR(7) NOT NULL,
    dia_mes SMALLINT NOT NULL,
    hora SMALLINT NOT NULL,
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
    numero_forcas SMALLINT NOT NULL DEFAULT 0,
    fonte VARCHAR(180) NULL,
    adicionado_no_banco_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_no_banco_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX indice_municipio ON ocorrencias_tiroteio (municipio);
CREATE INDEX indice_bairro ON ocorrencias_tiroteio (bairro);
CREATE INDEX indice_batalhao_responsavel ON ocorrencias_tiroteio (batalhao_responsavel);
