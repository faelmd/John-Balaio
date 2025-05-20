const express = require('express');
const router = express.Router();
const pool = require('../db');

// ---------------------------
// GET /mesas - Listar mesas com pedidos não prontos
// ---------------------------
router.get('/mesas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT mesa FROM pedidos WHERE status != "pronto"'
    );
    res.status(200).json(rows.map(r => r.mesa));
  } catch (err) {
    console.error('Erro ao buscar mesas:', err);
    res.status(500).json({ error: 'Erro ao buscar mesas' });
  }
});

// GET /?origem=cozinha|bar - Listar pedidos por origem baseada nos itens
router.get('/', async (req, res) => {
  const { origem } = req.query;

  if (!origem || !['cozinha', 'bar'].includes(origem)) {
    return res.status(400).json({ error: 'Origem inválida ou ausente' });
  }

  try {
    // Buscar todos os pedidos ainda não pagos
    const [pedidos] = await pool.query(
      'SELECT * FROM pedidos WHERE status != "pago" ORDER BY criado_em ASC'
    );

    // Buscar apenas os pedidos que tenham itens com a origem informada
    const pedidosComItens = await Promise.all(
      pedidos.map(async pedido => {
        const [itens] = await pool.query(
          'SELECT * FROM itens_pedidos WHERE id_pedido = ? AND origem = ?',
          [pedido.id, origem]
        );

        if (itens.length > 0) {
          return { ...pedido, itens };
        }
        return null; // ignora pedidos sem itens da origem informada
      })
    );

    res.status(200).json(pedidosComItens.filter(Boolean));
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// ---------------------------
// PUT /:id - Atualizar status e cozinheiro de um pedido
// ---------------------------
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, cozinheiro } = req.body;

  const validStatuses = ['pendente', 'em_preparo', 'pronto'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status inválido ou ausente' });
  }

  try {
    await pool.query(
      'UPDATE pedidos SET status = ?, nome_cozinheiro = ? WHERE id = ?',
      [status, cozinheiro, id]
    );
    res.status(200).json({ message: 'Pedido atualizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar pedido:', err);
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

// ---------------------------
// POST /itens - Adicionar item ao pedido
// ---------------------------
router.post('/itens', async (req, res) => {
  const { pedido_id, nome, quantidade, preco } = req.body;

  if (!pedido_id || !nome || !quantidade || preco == null) {
    return res.status(400).json({ error: 'Dados obrigatórios faltando' });
  }

  try {
    await pool.query(
      'INSERT INTO itens_pedidos (pedido_id, nome, quantidade, preco) VALUES (?, ?, ?, ?)',
      [pedido_id, nome, quantidade, preco]
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
  const { mesa, origem, status = 'pendente', cozinheiro = null, observacao = null } = req.body;

  if (!mesa || !origem || !['cozinha', 'bar'].includes(origem)) {
    return res.status(400).json({ error: 'Mesa e origem obrigatórios e válidos' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO pedidos (mesa, status, cozinheiro, observacao) VALUES (?, ?, ?, ?, ?)',
      [mesa, status, cozinheiro, observacao]
    );
    res.status(201).json({ message: 'Pedido criado com sucesso!', pedidoId: result.insertId });
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// ---------------------------
// GET /pedidos-prontos - Pedidos prontos para o caixa
// ---------------------------
router.get('/pedidos-prontos', async (req, res) => {
  try {
    const [pedidos] = await pool.query(
      'SELECT id, mesa, status, origem, criado_em, observacao FROM pedidos WHERE status = "pronto" ORDER BY criado_em ASC'
    );

    const pedidosComItens = await Promise.all(
      pedidos.map(async pedido => {
        const [itens] = await pool.query(
          'SELECT id, nome, quantidade, preco, pago FROM itens_pedidos WHERE pedido_id = ? ORDER BY id ASC',
          [pedido.id]
        );
        return { ...pedido, itens };
      })
    );

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
// GET /historico-pedidos - Histórico de pedidos pagos
// ---------------------------
router.get('/historico-pedidos', async (req, res) => {
  try {
    // 1. Buscar todos os pedidos com status 'pago'
    const [pedidos] = await pool.query(
      'SELECT * FROM pedidos WHERE status = "pago" ORDER BY criado_em DESC'
    );

    // 2. Para cada pedido, buscar os itens associados
    const pedidosComItens = await Promise.all(
      pedidos.map(async (pedido) => {
        const [itens] = await pool.query(
          'SELECT id, nome, quantidade, preco, pago FROM itens_pedidos WHERE pedido_id = ? ORDER BY id ASC',
          [pedido.id]
        );
        return { ...pedido, itens };
      })
    );

    // 3. Enviar para o front já agrupado
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
