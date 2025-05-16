const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/cozinha
router.get('/', async (req, res) => {
  console.log("🔍 Rota /api/cozinha foi chamada!");
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id AS id_pedido,
        p.mesa,
        p.criado_em,
        i.id AS item_id,
        i.nome_produto,
        i.quantidade,
        p.observacao,
        i.origem,
        p.status,
        i.pago
      FROM pedidos p
      JOIN itens_pedidos i ON p.id = i.id_pedido
      WHERE i.origem = 'cozinha' AND i.pago = 0
      ORDER BY p.criado_em ASC
    `);

    // Agrupando por pedido
    const pedidosAgrupados = {};
    for (const item of rows) {
      if (!pedidosAgrupados[item.id_pedido]) {
        pedidosAgrupados[item.id_pedido] = {
          id: item.id_pedido,
          mesa: item.mesa,
          criado_em: item.criado_em,
          observacao: item.observacao || '',
          status: item.status,
          itens: []
        };
      }

      pedidosAgrupados[item.id_pedido].itens.push({
        item_id: item.item_id,
        nome_produto: item.nome_produto,
        quantidade: item.quantidade,
        pago: item.pago,
        origem: item.origem
      });
    }

    res.status(200).json(Object.values(pedidosAgrupados));
  } catch (err) {
    console.error('🚨 Erro ao buscar pedidos da cozinha:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos da cozinha' });
  }
});

module.exports = router;
