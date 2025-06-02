const express = require('express');
const router = express.Router();
const pool = require('../db');

// 🔥 GET → Listar pedidos da cozinha
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id AS id_pedido,
        p.mesa,
        p.criado_em,
        p.observacao,
        i.id AS item_id,
        i.nome_produto,
        i.quantidade,
        i.origem,
        i.status,
        i.nome_cozinheiro,
        i.pago
      FROM pedidos p
      JOIN itens_pedidos i ON p.id = i.id_pedido
      WHERE i.origem = 'cozinha' AND i.status IN ('pendente', 'em_preparo', 'pronto')
      ORDER BY p.criado_em ASC
    `);

    const pedidosAgrupados = {};
    for (const item of rows) {
      if (!pedidosAgrupados[item.id_pedido]) {
        pedidosAgrupados[item.id_pedido] = {
          id: item.id_pedido,
          mesa: item.mesa,
          criado_em: item.criado_em,
          observacao: item.observacao || '',
          itens: []
        };
      }

      pedidosAgrupados[item.id_pedido].itens.push({
        id: item.item_id,
        nome_produto: item.nome_produto,
        quantidade: item.quantidade,
        status: item.status,
        pago: item.pago,
        origem: item.origem,
        nome_cozinheiro: item.nome_cozinheiro
      });
    }

    res.json(Object.values(pedidosAgrupados));
  } catch (err) {
    console.error('❌ Erro ao buscar pedidos da cozinha:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos da cozinha' });
  }
});

module.exports = router;
