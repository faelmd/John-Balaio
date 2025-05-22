# 🍻 John Balaio - Sistema de Gestão de Pedidos

Sistema completo para controle de pedidos em restaurantes, bares, lanchonetes e estabelecimentos gastronômicos. Permite gerenciar pedidos da cozinha, bar, caixa e administração, com geração de relatórios e acompanhamento em tempo real.

---

## 🚀 Funcionalidades Principais

- 🔥 **Setor Cozinha & Bar**
  - Visualização dos pedidos separados por origem.
  - Atualização de status: `pendente` ➡️ `em preparo` ➡️ `pronto`.
  - Gestão individual de cada item.
  - Visualização por setores (Cozinha e Bar de forma separada).

- 💰 **Setor Caixa**
  - Listagem das mesas abertas e seus pedidos.
  - Seleção de itens individuais para pagamento.
  - Pagamento total da conta da mesa.
  - Controle de mesas já pagas (histórico).

- 🛠️ **Administrador**
  - Cadastro, edição, ativação/desativação e remoção de produtos.
  - Encerramento de expediente com geração automática de relatório `.txt`.
  - Acesso à aba **Relatórios**, onde ficam armazenados os registros do expediente.

---

## 🗄️ Estrutura do Banco de Dados

### 🔹 Tabela `produtos`
| Coluna      | Tipo           | Descrição                                     |
|--------------|----------------|-----------------------------------------------|
| id           | int (PK)       | Identificador único do produto.              |
| nome         | varchar(255)   | Nome do produto.                             |
| descricao    | text           | Descrição detalhada.                         |
| preco        | decimal(10,2)  | Preço do produto.                            |
| imagem       | varchar(255)   | Caminho ou nome do arquivo da imagem.         |
| disponivel   | tinyint(1)     | Disponível (1) ou não (0).                   |
| origem       | varchar(50)    | Origem (Cozinha ou Bar).                     |
| categoria    | varchar(50)    | Categoria do produto (ex.: Bebidas, Carnes). |

---

### 🔹 Tabela `pedidos`
| Coluna          | Tipo                                          | Descrição                                  |
|-----------------|-----------------------------------------------|--------------------------------------------|
| id              | int (PK)                                      | Identificador do pedido.                   |
| mesa            | int                                           | Número da mesa.                            |
| status          | enum(pendente, em_preparo, pronto, pago)      | Status do pedido.                          |
| nome_cozinheiro | varchar(255)                                  | Nome do cozinheiro (se aplicável).         |
| criado_em       | timestamp                                     | Data/hora de criação.                      |
| atualizado_em   | timestamp                                     | Data/hora de última atualização.           |
| observacao      | text                                          | Observações adicionais.                    |

---

### 🔹 Tabela `itens_pedidos`
| Coluna          | Tipo           | Descrição                                |
|-----------------|-----------------|-------------------------------------------|
| id              | int (PK)        | Identificador do item.                   |
| id_pedido       | int (FK)        | ID do pedido associado.                  |
| nome_produto    | varchar(255)    | Nome do produto.                         |
| quantidade      | int             | Quantidade do item no pedido.            |
| preco_unitario  | decimal(10,2)   | Preço unitário.                          |
| pago            | tinyint(1)      | Item pago (1) ou não pago (0).           |
| origem          | varchar(50)     | Origem do item (Cozinha ou Bar).         |

---

## 🔧 Instalação e Execução

### 📦 Dependências

- Node.js
- MySQL
- React

---
