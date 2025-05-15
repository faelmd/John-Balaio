const express = require('express');
const router = express.Router();
const pool = require('../db');

// Rota: GET /api/cozinha
// Lista todos os itens com origem 'cozinha' e que ainda não foram pagos
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

    // Agrupar os itens por pedido
    const pedidosAgrupados = {};
    rows.forEach(item => {
      if (!pedidosAgrupados[item.id_pedido]) {
        pedidosAgrupados[item.id_pedido] = {
          pedido_id: item.id_pedido,
          mesa: item.mesa,
          criado_em: item.criado_em,
          observacao: item.observacao || "",
          itens: []
        };
      }

      pedidosAgrupados[item.id_pedido].itens.push({
        item_id: item.item_id,
        nome: item.nome_produto,
        quantidade: item.quantidade,
        observacao: item.observacao || "", // 🔍 Garante que nunca venha null
        origem: item.origem,
        status: item.status,
        pago: item.pago
      });
    });

    res.json(Object.values(pedidosAgrupados));
  } catch (err) {
    console.error('🚨 Erro ao buscar pedidos da cozinha:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos da cozinha' });
  }
});

module.exports = router;
