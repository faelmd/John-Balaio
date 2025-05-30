const express = require('express');
const router = express.Router();
const pool = require('../db');

// ✅ GET /api/bar?origem=bar → Listar pedidos com itens do bar
router.get('/', async (req, res) => {
  const { origem } = req.query;

  if (origem !== 'bar') {
    return res.status(400).json({ error: 'Origem inválida; use origem=bar' });
  }

  try {
    const [pedidos] = await pool.query('SELECT id, mesa, criado_em, observacao, nome_cozinheiro FROM pedidos ORDER BY criado_em ASC');

    const pedidosComItens = await Promise.all(
      pedidos.map(async pedido => {
        const [itens] = await pool.query(
          'SELECT id, nome_produto, quantidade, preco_unitario, pago, origem, status FROM itens_pedidos WHERE id_pedido = ? AND origem = "bar"',
          [pedido.id]
        );
        return itens.length > 0 ? { ...pedido, itens } : null;
      })
    );

    res.status(200).json(pedidosComItens.filter(Boolean));
  } catch (err) {
    console.error('❌ Erro ao buscar pedidos do bar:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos do bar' });
  }
});

module.exports = router;
