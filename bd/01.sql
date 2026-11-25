-- Tabela de Ocorrências de Tiroteio
CREATE TABLE IF NOT EXISTS ocorrencias_tiroteio (
    id SERIAL PRIMARY KEY,
    data_hora TIMESTAMP NOT NULL,
    ano SMALLINT NOT NULL,
    mes SMALLINT NOT NULL,
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

CREATE INDEX IF NOT EXISTS indice_municipio ON ocorrencias_tiroteio (municipio);
CREATE INDEX IF NOT EXISTS indice_bairro ON ocorrencias_tiroteio (bairro);
CREATE INDEX IF NOT EXISTS indice_batalhao_responsavel ON ocorrencias_tiroteio (batalhao_responsavel);

-- Tabela de Evolução Mensal do CISP (Crimes, População e Taxas por 100k hab.)
CREATE TABLE IF NOT EXISTS evolucao_mensal_cisp (
    id SERIAL PRIMARY KEY,
    cisp SMALLINT NOT NULL,
    mes SMALLINT NOT NULL,
    ano SMALLINT NOT NULL,
    munic VARCHAR(120) NOT NULL,
    hom_doloso SMALLINT NOT NULL DEFAULT 0,
    lesao_corp_morte SMALLINT NOT NULL DEFAULT 0,
    latrocinio SMALLINT NOT NULL DEFAULT 0,
    cvli SMALLINT NOT NULL DEFAULT 0,
    hom_por_interv_policial SMALLINT NOT NULL DEFAULT 0,
    feminicidio SMALLINT NOT NULL DEFAULT 0,
    letalidade_violenta SMALLINT NOT NULL DEFAULT 0,
    tentat_hom SMALLINT NOT NULL DEFAULT 0,
    tentativa_feminicidio SMALLINT NOT NULL DEFAULT 0,
    lesao_corp_dolosa SMALLINT NOT NULL DEFAULT 0,
    estupro SMALLINT NOT NULL DEFAULT 0,
    hom_culposo SMALLINT NOT NULL DEFAULT 0,
    lesao_corp_culposa SMALLINT NOT NULL DEFAULT 0,
    total_roubos SMALLINT NOT NULL DEFAULT 0,
    total_furtos SMALLINT NOT NULL DEFAULT 0,
    pop_circ DECIMAL(12, 2) NULL,
    taxa_hom_doloso DECIMAL(10, 2) NOT NULL DEFAULT 0,
    taxa_cvli DECIMAL(10, 2) NOT NULL DEFAULT 0,
    taxa_letalidade_violenta DECIMAL(10, 2) NOT NULL DEFAULT 0,
    taxa_tentat_hom DECIMAL(10, 2) NOT NULL DEFAULT 0,
    taxa_lesao_corp_dolosa DECIMAL(10, 2) NOT NULL DEFAULT 0,
    taxa_estupro DECIMAL(10, 2) NOT NULL DEFAULT 0,
    taxa_total_roubos DECIMAL(10, 2) NOT NULL DEFAULT 0,
    taxa_total_furtos DECIMAL(10, 2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS indice_evolucao_cisp ON evolucao_mensal_cisp (cisp);
CREATE INDEX IF NOT EXISTS indice_evolucao_munic ON evolucao_mensal_cisp (munic);
CREATE INDEX IF NOT EXISTS indice_evolucao_ano_mes ON evolucao_mensal_cisp (ano, mes);
