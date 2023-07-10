<h1 align="center">PARC</h1>

## 📖 Descrição do Projeto

O produto PARC tem por principal fundamento de funcionamento um sistema de gestão de bolsas, como importância no auxílio da gestão de bolsas oferecidas pelo estado e na parceira de colaboração no regime de colaboração entre estados e municípios. O software conta com módulos de criação de planos de trabalho e criação de relatórios mensais que irão compor a jornada do bolsista. A plataforma conta também com funcionalidades que acompanham os órgãos que apoiam as operações nos estados, e auxilia no processo de emissão de remessas de pagamento. O projeto conta com a entrega de 2 produtos (SITE ADM PARC / SITE DO ESTADO), sendo o SITE DO ESTADO a principal entrega do produto.

## 📱 Funcionalidade

Responsavel pelo armazenamento e manipulação dos dados do projeto alem de disponibilizar a API para ser utilizada pelo site, permitindo buscar, criar e alterar os dados e se comunicar com o banco de dados, assim como realiza ações automáticas de processamento dos dados.

## 🛠 Tecnologias

As seguintes ferramentas foram usadas na construção do projeto:  

- [NodeJs](https://nodejs.org/en/)
- [TypeScript](https://www.typescriptlang.org/)
- [TypeOrm](https://typeorm.io/#/)
- [MySql](https://www.mysql.com/)
- [Nestjs](https://nestjs.com/)
- [Swagger](https://swagger.io/)

<h1>📱 Como usar? </h1> 

### Pré-requisitos

Primeiramente, você precisa ter instalado em sua máquina as seguintes ferramentas:
[Git](https://git-scm.com), e o instalador de pacotes [yarn](https://yarnpkg.com/) e o [Docker](https://www.docker.com/). 
E lógico é bom ter um editor para trabalhar com o código como [VSCode](https://code.visualstudio.com/).

### 🎲 Rodando a aplicação

```bash
# Clone este repositório
$ git clone <https://github.com/desenvolvedorabc/BOLSAS-SERVIDOR>

# Após instalar o docker execute no terminal/cmd
$ docker run --name "nome-que-quiser" -e MYSQL_ROOT_PASSWORD=docker -p 3306:3306 mysql:latest

# Use qualquer gerenciar de banco de dados e crie uma database no mysql:
$ nome da database: parc
$ port: 3306

# Acesse a pasta do projeto 
$ cd BOLSAS-SERVIDOR

# Instale as dependências 
$ yarn

# Utilize a env.example e configure o projeto
$ env.example

# Execute a aplicação
$ yarn start:dev

## Prontinho você terá acesso a aplicação!!! 
```


### 👀  Acessando o Swagger

Para ter acesso as rotas da aplicação, utilize o swagger. Com a aplicação rodando, utilize a porta configurada nas variáveis de ambiente.

```bash
# Example
$ PORT=3333

# Acesse a URL
$ http://localhost:3333/v1/swagger

## Prontinho você terá acesso a rotas da aplicação.
```

### 📚 Dicionário de Dados

Para ter acesso ao Dicionário de Dados basta acessar o **data-dictionary.html** contido na raiz do projeto.

### 🧶 Modelo Entidade Relacionamento (MER)

![PARC-MER](https://github.com/desenvolvedorabc/BOLSAS-SERVIDOR/blob/main/parc-mer.png)

### ⛓ Diagrama Entidade Relacionamento (DER)

![PARC-DER](https://github.com/desenvolvedorabc/BOLSAS-SERVIDOR/blob/main/parc-der.png)

### 🌐 Tecnologias de sustentação/hospedagem:
O projeto opera em sua totalidade, em cloud, especificamente na GCP (Google Cloud Platform), a qual mantém os serviços, imagens Docker, e o executável da aplicação.
Os principais serviços para atender as requisições provisionadas centro lógico de processamento e gravação de dados na Cloud são:
 - CloudRun 
 - CloudBuild
 - CloudSQL
 - Cloud Functions
 - Região: south america - east 1 (São Paulo)

Além do GCP, são provisionados também aplicações para o hosteamento e troca de informações entre usuários, conforme abaixo:
 - Firebase Hosting
 - Cloud Functions


### ⚙️ Configurações de máquina:
Todos dados da PARC são armazenados em um banco MySQL 8.0.26, altamente disponível por região, com as seguintes configurações:

#### API:

 - vCPUs: 1
 - Memória: 512 MiB
 - Storage: Escalável
 - Backups: 1x por dia (03h00 à 07h00)


#### Banco De Dados: 

- vCPUs: 1
- Memória Ram: 3.75 GiB
- Disco: SSD - 20GB (obs. sem auto scaling)
- Região: southamerica-east1 (São Paulo)
