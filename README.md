# API

Este projeto fornece a estrutura inicial para uma API de gerenciamento de estabelecimentos**,** usuários, e avaliaçoes desenvolvida em **Node.js** com **Express** e **MySQL**.

---

## Objetivo da Sprint

- Implementar serviços para reaproveitamento de código (Clean Code).
- Refatorar o código, separando lógicas repetidas e criando serviços reutilizáveis.
- Criar a base para a API de estabelecimentos com autenticação de usuários e avaliações.
- Preparar a API para integração com o **Front-End em React**.

---

## Instalação do Projeto Base

Clone o repositório:

```bash
git clone <https://github.com/prieloizee/API_PROJETO.git>
cd API_PROJETO

```

1. Copie o arquivo de variáveis de ambiente:
    
    ```bash
    cp .env.example .env
    
    ```
    
    > Ajuste os valores conforme sua configuração (porta, usuário, senha do banco, etc.).
    > 
2. Suba os containers com o Docker Compose:
    
    ```bash
    docker-compose up --build
    
    ```
    
3. A API estará disponível em:
    
    ```
    http://localhost:3000
    
    ```
    

O serviço do banco de dados será criado automaticamente pelo **MySQL Docker container**, com as tabelas inicializadas a partir do script:

```
mysql-init/init.sql

```

---

## Rotas da API

### Usuários (`/user`)

- **POST /user/** → Cria um novo usuário
- **POST /user/login** → Realiza login
- **GET /user/** → Lista todos os usuários
- **GET /user/:id** → Busca usuário por ID
- **PUT /user/:id** → Atualiza dados do usuário
- **DELETE /user/:id** → Remove um usuário

### Estabelecimentos (`/estabelecimento`)

- **GET /estabelecimento/** → Lista todos
- **GET /estabelecimento/:id_place** → Busca por ID

### Avaliações (`/avaliacao`)

- **POST /avaliacao/** → Adiciona uma avaliação
- **GET /avaliacao/:id_place** → Lista avaliações de um estabelecimento
- **PUT** /**avaliacao/ →** Atualiza os dados da avaliação
- **DELETE** /**avaliacao/:id_avaliacao→** Remove a avaliação

---

## Execução sem Docker (opcional)

Caso prefira rodar localmente, instale as dependências:

```bash
npm install

```

E execute:

```bash

npm start     # Produção

```

> Lembre-se de configurar manualmente o MySQL e editar o arquivo connect.js ou .env.
> 

---

## Tecnologias Utilizadas

- **Node.js** + **Express**
- **MySQL** (inicializado via container)
- **JWT** para autenticação
- **Bcrypt** para segurança de senhas
- **Docker & Docker Compose** para orquestração dos serviços

---

## Integração

Esta API foi projetada para ser consumida pelo **Front-End em React** (projeto `Front_Sprint`).

Toda a comunicação deve ser feita via **Axios**, apontando para as rotas documentadas acima.
