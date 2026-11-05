# OÁSIS — Painel de Segurança Pública do Rio de Janeiro

Aplicação web para visualização de ocorrências de segurança pública no estado do Rio de Janeiro. Atualmente, o painel exibe ocorrências de tiroteios em um mapa interativo.

## Tecnologias

- **Node.js** e **Express**: servidor HTTP e rotas da aplicação.
- **EJS** e **express-ejs-layouts**: renderização das páginas.
- **Sequelize**: conexão e acesso ao banco de dados.
- **PostgreSQL**: banco de dados relacional.
- **PostGIS**: extensão do postgre para dados geoespaciais
- **Leaflet**: mapa interativo.
- **GeoJSON**: representação das divisões entre áreas CISP.
- **Proj4**: conversão de coordenadas geográficas para UTM.
- **csv-parse**: leitura e conversão dos arquivos CSV.
- **Bootstrap**: componentes e estilos da interface.

## Pré-requisitos

[Docker Desktop](https://www.docker.com/products/docker-desktop/) (versão desktop recomendada, mas é possível utilizar a versão CLI).

#### Principais fontes de dados:
- [Fogocruzado](https://api.fogocruzado.org.br/search)
- [Ispdados](https://www.ispdados.rj.gov.br/estatistica.html)

## Instalação
Clone ou copie o projeto e entre na pasta raiz:

```bash
git clone https://github.com/DanielGCG/OASIS---Painel-de-Seguranca-Publica---RJ.git
```

Abra o terminal do docker na pasta do projeto, rode o seguinte comando para criar os containers:

```bash
docker compose -f .\docker-compose-dev.yml up
```
OBS: Caso queira apenas rodar o site, utilize:
```bash
docker compose up
```
O comando cria os containers dockers e instala automaticamente as dependencias do banco de dados (no container db) e as do site (no container painel)

## Configuração do ambiente

Crie um arquivo `.env` na raiz do projeto. Ele deve conter as credenciais do PostgreSQL e a porta usada pelo servidor:

```env
PORT=3000

BANCO_NOME=oasis_seguranca
BANCO_USUARIO=oasis2_user
BANCO_SENHA=oasis22026
BANCO_HOST=db
BANCO_PORTA=5432

# Opcional: use true para exibir no console as consultas SQL do Sequelize.
BANCO_LOG=false
```

### Variáveis disponíveis

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `PORT` | Não | Porta HTTP da aplicação. O padrão é `3000`. |
| `BANCO_NOME` | Sim | Nome do banco PostgreSQL. |
| `BANCO_USUARIO` | Sim | Usuário usado pelo Sequelize. |
| `BANCO_SENHA` | Sim | Senha do usuário do banco. |
| `BANCO_HOST` | Sim | Endereço do servidor PostgreSQL. |
| `BANCO_PORTA` | Sim | Porta do PostgreSQl, normalmente `5432`. |
| `BANCO_LOG` | Não | Quando definido como `true`, habilita o log das consultas SQL. |

Não publique o `.env` nem inclua credenciais reais no repositório. Crie um novo arquivo com os valores correspondentes ao seu ambiente, mas tenha em mente que também deve modificar os arquivos docker-compose com as novas variáveis de ambiente.

## Banco de dados

O script `importar` é utilizado para popular o banco com os dados presentes nos datasets, que **devem estar no diretório raíz** do projeto. 

Execute o script no terminal do docker com o seguinte comando:

```bash
docker compose exec painel npm run importar -- <modelo> <dataset>.csv
```

Caso queira sincronizar os modelos em Sequelize com o banco de dados utilize o script `sincronizar` com o comando:

```bash
docker compose exec painel npm run sincronizar <modelo>
```

## Modelo do banco e Sequelize

O acesso ao banco está organizado nestes arquivos:

- [`bd/conexao.js`](./bd/conexao.js): cria a instância do Sequelize usando as variáveis do `.env`, configura o dialeto `postgresql`, host, porta e logging.
- [`bd/modelos/ocorrencias_tiroteio.js`](./bd/modelos/ocorrencias_tiroteio.js): define o modelo `ocorrencias_tiroteio`, seus tipos, campos obrigatórios, valores padrão e índices.
- [`bd/01.sql`](./bd/01.sql): define fisicamente o banco e a tabela no PostgreSQL.

O modelo usa `timestamps: false` porque a tabela possui os campos próprios `adicionado_no_banco_em` e `atualizado_no_banco_em`. A opção `underscored: true` está configurada globalmente na conexão para manter o padrão de nomes com `_`.

## Importação dos dados CSV

O arquivo [`scripts/importar-csv.js`](./scripts/importar-csv.js) importa um CSV para qualquer modelo existente em `bd/modelos`.

### Formato do CSV

O CSV deve:

- possuir a primeira linha com os nomes das colunas;
- usar nomes compatíveis com os atributos do modelo Sequelize;
- conter uma linha por ocorrência;
- usar UTF-8;
- usar valores vazios para campos sem informação;
- representar booleanos como `true` ou `false` (a conversão não diferencia maiúsculas de minúsculas).

Os arquivos para importação devem ser deixados na pasta raíz para que o script o encontre. Colunas presentes no CSV que não existem no modelo são informadas no console e ignoradas. Colunas do modelo ausentes no CSV não são adicionadas ao registro importado.

### Comando de importação

Na raiz do projeto, execute:

```bash
npm run importar -- nome_do_modelo nome-do-arquivo.csv
```

O primeiro argumento (`nome_do_modelo`) é o nome do arquivo do modelo sem o `.js`. O segundo argumento é o caminho do CSV.

Durante a importação, o script:

1. carrega o modelo informado em `bd/modelos`;
2. valida se o arquivo CSV existe;
3. lê o CSV e ignora linhas vazias;
4. mantém somente colunas existentes no modelo;
5. Trata valors vazios e `true`/`false` para booleanos;
6. atualiza registros existentes com o mesmo `id`;
7. exibe no console as colunas, os lotes e o resultado da operação.

Em registros repetidos, as colunas atualizadas são todas as colunas do modelo, exceto `id` e `adicionado_no_banco_em`. Portanto, o campo `id` precisa ser único e compatível com a chave primária da tabela.

## Funcionalidades atuais

- Página principal com o título do painel e mapa do Rio de Janeiro.
- Carregamento das ocorrências de tiroteios a partir da API.
- Cache da resposta de ocorrências do mapa por até uma hora.


Os botões de **Roubos**, **Homicídios** e **Outros crimes** estão presentes na interface, mas suas visualizações ainda não foram implementadas.

## Rotas e API

As rotas do servidor são registradas em [`server.js`](./server.js):

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/` | Renderiza o painel principal. |
| `GET` | `/api/ping` | Retorna `{ "message": "pong" }` para verificar se a API está disponível. |
| `GET` | `/api/tiroteios/ocorrencias_mapa` | Retorna latitude e longitude das ocorrências, com cache de uma hora. |
| `GET` | `/api/roubos/roubo_acumulado/<ano>` | Retorna a quantia acumulada (soma) de roubos agrupados por CISP e ano.|
| `GET` | `/cisp.geojson` | Arquivo estático com as divisões geográficas e os números reais das CISP. |


Exemplo:

```bash
curl http://localhost:3000/api/tiroteios/ocorrencias_mapa
```

O endpoint do mapa retorna uma estrutura semelhante a:

```json
{
  "timestamp": "2026-10-07T20:00:00.000Z",
  "ocorrencias": [
    {
      "latitude": -22.8389187,
      "longitude": -43.374176
    }
  ]
}
```

## Estrutura do projeto

```text
.
├── bd/
│   ├── 01.sql                         # Criação do banco e da tabela
│   ├── conexao.js                     # Conexão Sequelize/PostgreSQL
│   └── modelos/
│       └── ocorrencias_tiroteio.js    # Modelo Sequelize das ocorrências
|       └── evolucao_mensal_cisp.js    # Modelo Sequelize das ocorrências
├── dados_estaticos/
│   └── ocorrencias_limpas.csv
│   └── evolucao_mensal_cisp.csv
├── public/
│   ├── css/index.css                  # Estilos do painel
│   ├── js/mapa.js                     # Mapa, projeção e grade de ocorrências
│   └── cisp.geojson                   # Divisões e números das áreas CISP
├── scripts/
│   └── importar-csv.js                # Importador genérico de CSV
├── server/
│   ├── api.js                         # Endpoints da API
│   └── router.js                      # Rotas HTML
├── views/
│   ├── layout/main.ejs                # Layout base
│   └── pages/index.ejs                # Página principal
├── server.js                          # Inicialização do Express
├── package.json                       # Scripts e dependências
└── .env                               # Configurações locais (não versionar)
```
