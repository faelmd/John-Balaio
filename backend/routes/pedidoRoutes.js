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
        p.mesa,
        p.criado_em,
        p.observacao,
        i.nome_cozinheiro
      FROM itens_pedidos i
      JOIN pedidos p ON p.id = i.id_pedido
      WHERE i.origem = ?
      ORDER BY p.criado_em ASC
    `, [origem]);

    res.json(itens);
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
      SET status = ?, nome_cozinheiro = ?
      WHERE id = ?
    `, [status, nome_cozinheiro || null, id]);

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

module.exports = router;
