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
    const [pedidos] = await pool.query(
      'SELECT id, mesa, status, criado_em FROM pedidos ORDER BY criado_em ASC'
    );

    const pedidosComItens = await Promise.all(
      pedidos.map(async pedido => {
        const [itens] = await pool.query(
          'SELECT id, nome_produto, quantidade, preco_unitario, pago, origem FROM itens_pedidos WHERE id_pedido = ? AND origem = "bar"',
          [pedido.id]
        );

        // Apenas incluir pedidos que têm itens de origem 'bar'
        if (itens.length > 0) {
          return { ...pedido, itens };
        }
        return null;
      })
    );

    res.status(200).json(pedidosComItens.filter(Boolean));
  } catch (err) {
    console.error('Erro ao buscar pedidos do bar:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos do bar' });
  }
});

module.exports = router;
