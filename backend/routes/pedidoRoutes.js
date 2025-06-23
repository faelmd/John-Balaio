const express = require('express');
const router = express.Router();
const pool = require('../db');

// ✅ GET /mesas → Listar mesas com pedidos abertos
router.get('/mesas', async (req, res) => {
  try {
    const [mesas] = await pool.query(`
      SELECT 
        p.mesa, 
        MIN(p.abertura) AS abertura,
        MAX(p.fechamento) AS fechamento,
        CASE 
          WHEN SUM(i.pago = 0) = 0 THEN 'paga'
          ELSE 'aberta'
        END AS status
      FROM pedidos p
      JOIN itens_pedidos i ON p.id = i.id_pedido
      GROUP BY p.mesa
      ORDER BY p.mesa ASC
    `);

    res.status(200).json(mesas);
  } catch (err) {
    console.error('❌ Erro ao buscar mesas:', err);
    res.status(500).json({ error: 'Erro ao buscar mesas' });
  }
});

// ✅ GET / → Listar itens pendentes por origem (cozinha ou bar)
router.get('/', async (req, res) => {
  const { origem } = req.query;
  if (!origem) {
    return res.status(400).json({ error: 'Origem obrigatória (cozinha ou bar)' });
  }

  try {
    const [itens] = await pool.query(`
      SELECT 
        i.id,
        i.nome_produto,
        i.quantidade,
        i.preco_unitario,
        i.status,
        i.pago,
        i.origem,
        i.nome_cozinheiro, 
        p.id AS pedido_id,
        p.mesa,
        p.criado_em,
        p.observacao
      FROM itens_pedidos i
      JOIN pedidos p ON p.id = i.id_pedido
      WHERE i.origem = ?
      ORDER BY p.criado_em ASC
    `, [origem]);

    const pedidosMap = {};

    itens.forEach(item => {
      const pedidoId = item.pedido_id;
      if (!pedidosMap[pedidoId]) {
        pedidosMap[pedidoId] = {
          id: pedidoId,
          mesa: item.mesa,
          criado_em: item.criado_em,
          observacao: item.observacao,
          nome_cozinheiro: item.nome_cozinheiro,
          itens: []
        };
      }

      pedidosMap[pedidoId].itens.push({
        id: item.id,
        nome_produto: item.nome_produto,
        quantidade: item.quantidade,
        status: item.status,
        preco_unitario: item.preco_unitario,
        pago: item.pago,
        origem: item.origem,
        nome_cozinheiro: item.nome_cozinheiro // 🔥 GARANTIR QUE ESTÁ AQUI
      });
    });

    const pedidos = Object.values(pedidosMap);

    res.json(pedidos);
  } catch (err) {
    console.error('❌ Erro ao buscar itens:', err);
    res.status(500).json({ error: 'Erro ao buscar itens' });
  }
});

// ✅ PUT /itens/:id/status → Atualizar status de um item
router.put('/itens/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, nome_cozinheiro } = req.body;

  const validStatuses = ['pendente', 'em_preparo', 'pronto'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  try {
    await pool.query(`
      UPDATE itens_pedidos 
      SET 
        status = ?, 
        nome_cozinheiro = COALESCE(NULLIF(?, ''), nome_cozinheiro)
      WHERE id = ?
    `, [status, nome_cozinheiro, id]);

    res.json({ success: true, message: 'Status do item atualizado' });
  } catch (err) {
    console.error('❌ Erro ao atualizar status:', err);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// ✅ POST / → Criar novo pedido
router.post('/', async (req, res) => {
  const { mesa, observacao } = req.body;

  if (!mesa) {
    return res.status(400).json({ error: 'Mesa é obrigatória' });
  }

  try {
    const [result] = await pool.query(`
      INSERT INTO pedidos (mesa, observacao) VALUES (?, ?)
    `, [mesa, observacao || null]);

    res.status(201).json({ message: 'Pedido criado', pedidoId: result.insertId });
  } catch (err) {
    console.error('❌ Erro ao criar pedido:', err);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// ✅ POST /itens → Adicionar item ao pedido
router.post('/itens', async (req, res) => {
  const { id_pedido, nome_produto, quantidade, preco_unitario, origem, categoria, observacao } = req.body;

  if (![id_pedido, nome_produto, quantidade, preco_unitario, origem].every(Boolean)) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  try {
    await pool.query(`
      INSERT INTO itens_pedidos 
      (id_pedido, nome_produto, quantidade, preco_unitario, origem, categoria, observacao, status, pago) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', 0)
    `, [
      id_pedido,
      nome_produto,
      quantidade,
      preco_unitario,
      origem,
      categoria || null,
      observacao || null
    ]);

    res.status(201).json({ message: 'Item adicionado ao pedido' });
  } catch (err) {
    console.error('❌ Erro ao adicionar item:', err);
    res.status(500).json({ error: 'Erro ao adicionar item' });
  }
});

// ✅ GET /historico → Buscar itens pagos (histórico)
router.get('/historico', async (req, res) => {
  try {
    const [itens] = await pool.query(`
      SELECT 
        i.id,
        i.nome_produto,
        i.quantidade,
        i.preco_unitario,
        i.status,
        i.pago,
        p.mesa,
        p.criado_em,
        i.nome_cozinheiro
      FROM itens_pedidos i
      JOIN pedidos p ON p.id = i.id_pedido
      WHERE i.pago = 1
      ORDER BY p.criado_em DESC
    `);

    res.json(itens);
  } catch (err) {
    console.error('❌ Erro ao buscar histórico:', err);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

//---------------Arthur mexeu daqui para baixo

router.post("/criar-pedido", async (req, res) => {
  const {
    mesa,
    observacao,
    itens,
    status = "pendente",
    nome_cozinheiro = null,
  } = req.body;

  // 🔍 Validação de entrada
  if (!mesa || !Array.isArray(itens) || itens.length === 0) {
    return res
      .status(400)
      .json({ erro: "Informe a mesa e os itens corretamente." });
  }

  try {
    // 🧾 Inserir pedido
    const [pedidoResult] = await pool.query(
      "INSERT INTO pedidos (mesa, observacao, status, nome_cozinheiro) VALUES (?, ?, ?, ?)",
      [mesa, observacao, status, nome_cozinheiro || null]
    );

    const idPedido = pedidoResult.insertId;

    const bebidas = [
      "Bebidas",
      "Sucos",
      "Sodas Italianas",
      "Cervejas",
      "Para Brindar",
      "Doses e Shots",
    ];

    // 🛒 Inserir cada item do pedido
    for (const { nome, quantidade, preco, categoria, pago = false } of itens) {
      if (!nome || !quantidade || !preco || !categoria) {
        throw new Error("Item inválido. Campos obrigatórios ausentes.");
      }
      const origem = bebidas.includes(categoria) ? "bar" : "cozinha";

      await pool.query(
        `INSERT INTO itens_pedidos 
         (id_pedido, nome_produto, quantidade, preco_unitario, origem, pago)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [idPedido, nome, quantidade, preco, origem, pago]
      );
    }

    res.status(201).json({
      mensagem: "Pedido criado com sucesso!",
      id_pedido: idPedido,
    });
  } catch (err) {
    console.error("Erro ao criar pedido com itens:", err.message);
    res.status(500).json({ erro: "Erro ao processar o pedido." });
  }
});


module.exports = router;
