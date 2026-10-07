# OÁSIS — Painel de Segurança Pública do Rio de Janeiro

Aplicação web para visualização de ocorrências de segurança pública no estado do Rio de Janeiro. Atualmente, o painel exibe ocorrências de tiroteios em um mapa interativo.

## Tecnologias

- **Node.js** e **Express**: servidor HTTP e rotas da aplicação.
- **EJS** e **express-ejs-layouts**: renderização das páginas.
- **Sequelize**: conexão e acesso ao banco de dados.
- **MariaDB**: banco de dados relacional.
- **Leaflet**: mapa interativo.
- **Proj4**: conversão de coordenadas geográficas para UTM.
- **csv-parse**: leitura e conversão dos arquivos CSV.
- **Bootstrap**: componentes e estilos da interface.

## Pré-requisitos

Instale os seguintes componentes antes de iniciar:

1. [Node.js](https://nodejs.org/) (versão LTS recomendada).
2. [MariaDB](https://mariadb.org/) em execução.
3. Um cliente MariaDB/MySQL, como o `mariadb`, `mysql` ou uma ferramenta gráfica.

Verifique as instalações:

```bash
node --version
npm --version
mariadb --version
```

## Instalação

Clone ou copie o projeto e entre na pasta raiz:

```bash
git clone https://github.com/DanielGCG/OASIS---Painel-de-Seguranca-Publica---RJ.git
```

Instale as dependências definidas em `package.json`:

```bash
npm install
```

O comando instala, entre outras, as dependências do Express, Sequelize, driver MariaDB, parser de CSV, EJS, Leaflet relacionado ao frontend e o Nodemon para desenvolvimento.

## Configuração do ambiente

Crie um arquivo `.env` na raiz do projeto. Ele deve conter as credenciais do MariaDB e a porta usada pelo servidor:

```env
PORT=3000

BANCO_NOME=oasis_seguranca
BANCO_USUARIO=oasis_app
BANCO_SENHA=sua_senha
BANCO_HOST=localhost
BANCO_PORTA=3306

# Opcional: use true para exibir no console as consultas SQL do Sequelize.
BANCO_LOG=false
```

### Variáveis disponíveis

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `PORT` | Não | Porta HTTP da aplicação. O padrão é `3000`. |
| `BANCO_NOME` | Sim | Nome do banco MariaDB. |
| `BANCO_USUARIO` | Sim | Usuário usado pelo Sequelize. |
| `BANCO_SENHA` | Sim | Senha do usuário do banco. |
| `BANCO_HOST` | Sim | Endereço do servidor MariaDB. |
| `BANCO_PORTA` | Sim | Porta do MariaDB, normalmente `3306`. |
| `BANCO_LOG` | Não | Quando definido como `true`, habilita o log das consultas SQL. |

Não publique o `.env` nem inclua credenciais reais no repositório. Crie um novo arquivo com os valores correspondentes ao seu ambiente.

## Banco de dados

O script [`bd/01.sql`](./bd/01.sql) cria o banco `oasis_seguranca` e a tabela `ocorrencias_tiroteio`.

Execute o script com um usuário que tenha permissão para criar banco e tabela:

```bash
mariadb -u root -p < bd/01.sql
```

Se o usuário configurado no `.env` ainda não existir, crie-o no MariaDB e conceda acesso ao banco:

```sql
CREATE USER 'oasis_app'@'localhost' IDENTIFIED BY 'sua_senha';
GRANT ALL PRIVILEGES ON oasis_seguranca.* TO 'oasis_app'@'localhost';
FLUSH PRIVILEGES;
```

O projeto ainda não executa migrações automaticas nem chama `sequelize.sync()`: a estrutura deve ser criada pelo script SQL.

## Modelo do banco e Sequelize

O acesso ao banco está organizado nestes arquivos:

- [`bd/conexao.js`](./bd/conexao.js): cria a instância do Sequelize usando as variáveis do `.env`, configura o dialeto `mariadb`, host, porta e logging.
- [`bd/modelos/ocorrencias_tiroteio.js`](./bd/modelos/ocorrencias_tiroteio.js): define o modelo `ocorrencias_tiroteio`, seus tipos, campos obrigatórios, valores padrão e índices.
- [`bd/01.sql`](./bd/01.sql): define fisicamente o banco e a tabela no MariaDB.

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

Os arquivos para importação devem ser deixados em `./dados_estaticos/nome-do-aquivo.csv` para que o script o encontre. Colunas presentes no CSV que não existem no modelo são informadas no console e ignoradas. Colunas do modelo ausentes no CSV não são adicionadas ao registro importado.

### Comando de importação

Na raiz do projeto, execute:

```bash
npm run importar -- nome_do_modelo dados_estaticos/nome-do-aquivo.csv
```

No Windows, também é possível informar o caminho completo entre aspas:

```powershell
npm run importar -- nome_do_modelo "C:\caminho\para\nome-do-aquivo.csv"
```

O primeiro argumento (`nome_do_modelo`) é o nome do arquivo do modelo sem o `.js`. O segundo argumento é o caminho do CSV.

Durante a importação, o script:

1. carrega o modelo informado em `bd/modelos`;
2. valida se o arquivo CSV existe;
3. lê o CSV e ignora linhas vazias;
4. mantém somente colunas existentes no modelo;
5. converte valores vazios para `null` e `true`/`false` para booleanos;
6. atualiza registros existentes com o mesmo `id`;
7. exibe no console as colunas, os lotes e o resultado da operação.

Em registros repetidos, as colunas atualizadas são todas as colunas do modelo, exceto `id` e `adicionado_no_banco_em`. Portanto, o campo `id` precisa ser único e compatível com a chave primária da tabela.

## Executando a aplicação

### Ambiente de desenvolvimento

```bash
npm run dev
```

Esse comando inicia o servidor com Nodemon, que reinicia a aplicação quando os arquivos são alterados.

### Execução direta

```bash
node server.js
```

Com o `.env` configurado e o banco disponível, acesse:

```text
http://localhost:PORT
```

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
│   ├── conexao.js                     # Conexão Sequelize/MariaDB
│   └── modelos/
│       └── ocorrencias_tiroteio.js    # Modelo Sequelize das ocorrências
├── dados_estaticos/
│   └── ocorrencias_limpas.csv         # CSV de exemplo
├── public/
│   ├── css/index.css                  # Estilos do painel
│   └── js/mapa.js                     # Mapa, projeção e grade de ocorrências
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