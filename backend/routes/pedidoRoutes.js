const express = require('express');
const router = express.Router();
const pool = require('../db');
const fs = require('fs').promises;
const path = require('path');

// 🔥 GET /mesas - Listar mesas com pedidos abertos
router.get('/mesas', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT p.mesa 
      FROM pedidos p
      JOIN itens_pedidos i ON i.id_pedido = p.id
      WHERE i.pago = 0
    `);
    res.status(200).json(rows.map(r => r.mesa));
  } catch (err) {
    console.error('❌ Erro ao buscar mesas:', err);
    res.status(500).json({ error: 'Erro ao buscar mesas' });
  }
});

// 🔥 GET /?origem=cozinha|bar - Listar itens pendentes por origem
router.get('/', async (req, res) => {
  const { origem } = req.query;
  if (!origem) {
    return res.status(400).json({ error: 'Origem obrigatória' });
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

    res.status(200).json(itens);
  } catch (err) {
    console.error('❌ Erro ao buscar itens:', err);
    res.status(500).json({ error: 'Erro ao buscar itens' });
  }
});

// 🔥 PUT /itens/:id/status - Atualizar status de um item
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
    `, [status, nome_cozinheiro, id]);

    res.json({ success: true, message: 'Status atualizado' });
  } catch (err) {
    console.error('❌ Erro ao atualizar status:', err);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// 🔥 POST / - Criar novo pedido
router.post('/', async (req, res) => {
  const { mesa, observacao } = req.body;

  if (!mesa) {
    return res.status(400).json({ error: 'Mesa é obrigatória' });
  }

  try {
    const [result] = await pool.query(`
      INSERT INTO pedidos (mesa, observacao) VALUES (?, ?)
    `, [mesa, observacao]);

    res.status(201).json({ message: 'Pedido criado', pedidoId: result.insertId });
  } catch (err) {
    console.error('❌ Erro ao criar pedido:', err);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// 🔥 POST /itens - Adicionar item ao pedido
router.post('/itens', async (req, res) => {
  const { id_pedido, nome_produto, quantidade, preco_unitario, origem, categoria, observacao } = req.body;

  if (!id_pedido || !nome_produto || !quantidade || !preco_unitario) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  try {
    await pool.query(`
      INSERT INTO itens_pedidos 
      (id_pedido, nome_produto, quantidade, preco_unitario, origem, categoria, observacao, status, pago) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', 0)
    `, [id_pedido, nome_produto, quantidade, preco_unitario, origem, categoria, observacao]);

    res.status(201).json({ message: 'Item adicionado' });
  } catch (err) {
    console.error('❌ Erro ao adicionar item:', err);
    res.status(500).json({ error: 'Erro ao adicionar item' });
  }
});

// 🔥 GET /historico - Itens pagos (histórico)
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

    res.status(200).json(itens);
  } catch (err) {
    console.error('❌ Erro ao buscar histórico:', err);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

module.exports = router;
