🍽️ Sistema de Reservas de Restaurante🍽️

Um sistema simples de API REST para gerenciar reservas de mesas em um restaurante.
Desenvolvido em Node.js + Express + PostgreSQL.

📌 Funcionalidades

- Criar reservas para mesas

- Listar mesas disponíveis

- Listar reservas existentes

- Cancelar reservas

CRUD básico para usuários (dependendo da sua implementação)

🛠️ Tecnologias usadas

- Node.js

- Express

- PostgreSQL

- PG (biblioteca para conectar ao banco)

- body-parser

🗄️ Banco de Dados
📌 Tabelas necessárias
Usuários
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(60),
    email VARCHAR(200) UNIQUE,
    senha VARCHAR(50),
    role VARCHAR(20)
);

Mesas
CREATE TABLE mesas (
    id SERIAL PRIMARY KEY,
    capacidade INT NOT NULL
);

Reservas
CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    mesa_id INT REFERENCES mesas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    hora TIME NOT NULL
);

▶️ Como rodar o projeto
1 - Instalar dependências
npm install

2️ - Criar o banco de dados no PostgreSQL
CREATE DATABASE restaurante;

3️ - Criar as tabelas (SQL acima)

4- configurar db

5️ -  Rodar o servidor: 
node index.js
//-----------------------------------------------------------------------------------------
Testando no Postman👨‍🚀 

Crie uma requisição POST para /reservas

Teste erros: mesa ocupada, horários iguais, usuário inexistente, etc.

Teste listagem com GET /reservas
