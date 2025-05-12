const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/bar?origem=bar - Listar pedidos de bar com itens
router.get('/', async (req, res) => {
  const { origem } = req.query;

  if (!origem || origem !== 'bar') {
    return res.status(400).json({ error: 'Origem inválida; use origem=bar' });
  }

  try {
    // Busca pedidos
    const [pedidos] = await pool.query(
      'SELECT id, mesa, status, criado_em FROM pedidos WHERE origem = ? ORDER BY criado_em ASC',
      [origem]
    );

    // Aninha itens em cada pedido
    const pedidosComItens = await Promise.all(
      pedidos.map(async pedido => {
        const [itens] = await pool.query(
          'SELECT id, nome, quantidade, preco, observacao, pago FROM itens_pedidos WHERE pedido_id = ? ORDER BY id ASC',
          [pedido.id]
        );
        return { ...pedido, itens };
      })
    );

    res.status(200).json(pedidosComItens);
  } catch (err) {
    console.error('Erro ao buscar pedidos do bar:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos do bar' });
  }
});

module.exports = router;
