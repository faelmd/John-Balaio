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

// ---------------------------
// GET /?origem=cozinha|bar - Listar pedidos por origem
// ---------------------------
router.get('/', async (req, res) => {
  const { origem } = req.query;

  if (!origem) {
    return res.status(400).json({ error: 'Parâmetro origem é obrigatório' });
  }
  if (!['cozinha', 'bar'].includes(origem)) {
    return res.status(400).json({ error: 'Origem inválida' });
  }

  try {
    const [result] = await pool.query(
      'SELECT * FROM pedidos WHERE origem = ? ORDER BY criado_em ASC',
      [origem]
    );
    res.status(200).json(result);
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// ---------------------------
// PUT /pagar - Marcar itens como pagos
// ---------------------------
router.put('/pagar', async (req, res) => {
  const { itemIds } = req.body;

  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ error: 'Lista de itens inválida' });
  }

  try {
    const placeholders = itemIds.map(() => '?').join(',');
    await pool.query(
      `UPDATE itens_pedidos SET pago = TRUE WHERE id IN (${placeholders})`,
      itemIds
    );
    res.status(200).json({ message: 'Itens atualizados com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar itens:', err);
    res.status(500).json({ error: 'Erro ao atualizar itens' });
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
      'UPDATE pedidos SET status = ?, cozinheiro = ? WHERE id = ?',
      [status, cozinheiro, id]
    );
    res.status(200).json({ message: 'Pedido atualizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar pedido:', err);
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

// ---------------------------
// GET /itens/:pedidoId - Listar todos os itens de um pedido
// ---------------------------
router.get('/itens/:pedidoId', async (req, res) => {
  const { pedidoId } = req.params;

  try {
    const [itens] = await pool.query(
      'SELECT id, nome, quantidade, preco, observacao, pago FROM itens_pedidos WHERE pedido_id = ? ORDER BY id ASC',
      [pedidoId]
    );
    res.status(200).json(itens);
  } catch (err) {
    console.error('Erro ao buscar itens:', err);
    res.status(500).json({ error: 'Erro ao buscar itens do pedido' });
  }
});

// ---------------------------
// GET /nao-pagos/:pedidoId - Listar itens não pagos
// ---------------------------
router.get('/nao-pagos/:pedidoId', async (req, res) => {
  const { pedidoId } = req.params;

  try {
    const [itens] = await pool.query(
      'SELECT id, nome, quantidade, preco, observacao, pago FROM itens_pedidos WHERE pedido_id = ? AND pago = FALSE ORDER BY id ASC',
      [pedidoId]
    );
    res.status(200).json(itens);
  } catch (err) {
    console.error('Erro ao buscar itens não pagos:', err);
    res.status(500).json({ error: 'Erro ao buscar itens não pagos' });
  }
});

// ---------------------------
// POST /itens - Adicionar item ao pedido
// ---------------------------
router.post('/itens', async (req, res) => {
  const { pedido_id, nome, quantidade, preco, observacao = null } = req.body;

  if (!pedido_id || !nome || !quantidade || preco == null) {
    return res.status(400).json({ error: 'Dados obrigatórios faltando' });
  }
  if (preco <= 0) {
    return res.status(400).json({ error: 'Preço inválido' });
  }

  try {
    await pool.query(
      'INSERT INTO itens_pedidos (pedido_id, nome, quantidade, preco, observacao) VALUES (?, ?, ?, ?, ?)',
      [pedido_id, nome, quantidade, preco, observacao]
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
  const { mesa, origem, status = 'pendente', cozinheiro = null } = req.body;

  if (!mesa || !origem) {
    return res.status(400).json({ error: 'Mesa e origem são obrigatórios' });
  }
  if (!['cozinha', 'bar'].includes(origem)) {
    return res.status(400).json({ error: 'Origem inválida' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO pedidos (mesa, status, cozinheiro, origem) VALUES (?, ?, ?, ?)',
      [mesa, status, cozinheiro, origem]
    );

    const novoPedidoId = result.insertId;
    res.status(201).json({ message: 'Pedido criado com sucesso!', pedidoId: novoPedidoId });
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

module.exports = router;
