const express = require('express');
const router = express.Router();
const pool = require('../db');

// ---------------------------
// GET /mesas - Listar mesas com pedidos que não estão prontos (status != 'pronto')
// ---------------------------
router.get('/mesas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT p.mesa FROM itens_pedidos i JOIN pedidos p ON i.id_pedido = p.id WHERE i.status != "pronto"'
    );
    res.status(200).json(rows.map(r => r.mesa));
  } catch (err) {
    console.error('Erro ao buscar mesas:', err);
    res.status(500).json({ error: 'Erro ao buscar mesas' });
  }
});

// GET /?origem=cozinha|bar - Listar pedidos por origem (baseado em itens)
router.get('/', async (req, res) => {
  const { origem } = req.query;

  if (!origem || !['cozinha', 'bar'].includes(origem)) {
    return res.status(400).json({ error: 'Origem inválida ou ausente' });
  }

  try {
    // Buscar pedidos que tenham pelo menos um item com a origem especificada e que não estejam pagos
    const [pedidos] = await pool.query(
      `SELECT DISTINCT p.*
       FROM pedidos p
       JOIN itens_pedidos i ON p.id = i.id_pedido
       WHERE i.origem = ? AND i.status != 'pago'
       ORDER BY p.criado_em ASC`,
      [origem]
    );

    // Para cada pedido, buscar os itens da origem
    const pedidosComItens = await Promise.all(
      pedidos.map(async pedido => {
        const [itens] = await pool.query(
          'SELECT * FROM itens_pedidos WHERE id_pedido = ? AND origem = ?',
          [pedido.id, origem]
        );
        return { ...pedido, itens };
      })
    );

    res.status(200).json(pedidosComItens);
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// ---------------------------
// PUT /:id - Atualizar status e cozinheiro de um item_pedido
// ---------------------------
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, cozinheiro } = req.body;

  const validStatuses = ['pendente', 'em_preparo', 'pronto', 'pago'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status inválido ou ausente' });
  }

  try {
    await pool.query(
      'UPDATE itens_pedidos SET status = ?, nome_cozinheiro = ? WHERE id = ?',
      [status, cozinheiro, id]
    );
    res.status(200).json({ message: 'Item do pedido atualizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar item do pedido:', err);
    res.status(500).json({ error: 'Erro ao atualizar item do pedido' });
  }
});

// ---------------------------
// POST /itens - Adicionar item ao pedido
// ---------------------------
router.post('/itens', async (req, res) => {
  const { id_pedido, nome, quantidade, preco, origem } = req.body;

  if (!id_pedido || !nome || !quantidade || preco == null || !origem) {
    return res.status(400).json({ error: 'Dados obrigatórios faltando' });
  }

  try {
    await pool.query(
      'INSERT INTO itens_pedidos (id_pedido, nome, quantidade, preco, origem, status) VALUES (?, ?, ?, ?, ?, "pendente")',
      [id_pedido, nome, quantidade, preco, origem]
    );
    res.status(201).json({ message: 'Item adicionado com sucesso!' });
  } catch (err) {
    console.error('Erro ao adicionar item:', err);
    res.status(500).json({ error: 'Erro ao adicionar item' });
  }
});

// ---------------------------
// POST / - Criar novo pedido
// ---------------------------
router.post('/', async (req, res) => {
  const { mesa, status = 'pendente', observacao = null } = req.body;

  if (!mesa) {
    return res.status(400).json({ error: 'Mesa é obrigatória' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO pedidos (mesa, status, observacao) VALUES (?, ?, ?)',
      [mesa, status, observacao]
    );
    res.status(201).json({ message: 'Pedido criado com sucesso!', pedidoId: result.insertId });
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// ---------------------------
// GET /pedidos-prontos - Pedidos prontos para o caixa (status 'pronto')
// ---------------------------
router.get('/pedidos-prontos', async (req, res) => {
  try {
    const [pedidos] = await pool.query(
      `SELECT DISTINCT p.id, p.mesa, p.status, p.criado_em, p.observacao
       FROM pedidos p
       JOIN itens_pedidos i ON p.id = i.id_pedido
       WHERE i.status = 'pronto'
       ORDER BY p.criado_em ASC`
    );

    const pedidosComItens = await Promise.all(
      pedidos.map(async pedido => {
        const [itens] = await pool.query(
          'SELECT id, nome, quantidade, preco, pago, status FROM itens_pedidos WHERE id_pedido = ? ORDER BY id ASC',
          [pedido.id]
        );
        return { ...pedido, itens };
      })
    );

    // Agrupar por mesa
    const agrupados = {};
    for (const pedido of pedidosComItens) {
      if (!agrupados[pedido.mesa]) agrupados[pedido.mesa] = [];
      agrupados[pedido.mesa].push(pedido);
    }

    res.status(200).json(agrupados);
  } catch (err) {
    console.error('Erro ao buscar pedidos prontos:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos prontos' });
  }
});

// ---------------------------
// GET /historico-pedidos - Histórico de pedidos pagos (status 'pago')
// ---------------------------
router.get('/historico-pedidos', async (req, res) => {
  try {
    // Buscar pedidos que tenham itens pagos
    const [pedidos] = await pool.query(
      `SELECT DISTINCT p.*
       FROM pedidos p
       JOIN itens_pedidos i ON p.id = i.id_pedido
       WHERE i.status = 'pago'
       ORDER BY p.criado_em DESC`
    );

    const pedidosComItens = await Promise.all(
      pedidos.map(async pedido => {
        const [itens] = await pool.query(
          'SELECT id, nome, quantidade, preco, pago, status FROM itens_pedidos WHERE id_pedido = ? ORDER BY id ASC',
          [pedido.id]
        );
        return { ...pedido, itens };
      })
    );

    res.status(200).json(pedidosComItens);
  } catch (err) {
    console.error('Erro ao buscar histórico de pedidos:', err);
    res.status(500).json({
      error: 'Erro ao buscar histórico de pedidos',
      detalhe: err.message,
    });
  }
});

module.exports = router;
