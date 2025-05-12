const express = require('express');
const router = express.Router();
const pool = require('../db');

// Rota: GET /api/cozinha
// Lista todos os pedidos da origem 'cozinha', com itens ainda não pagos
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
        i.observacao,
        p.origem,
        p.status,
        i.pago
      FROM pedidos p
      JOIN itens_pedidos i ON p.id = i.id_pedido
      WHERE p.origem = 'cozinha' AND i.pago = 0
      ORDER BY p.criado_em ASC
    `);

    // Agrupar os itens por pedido
    const pedidosAgrupados = {};
    rows.forEach(item => {
      if (!pedidosAgrupados[item.id_pedido]) {  // Corrigido para id_pedido
        pedidosAgrupados[item.id_pedido] = {
          pedido_id: item.id_pedido,             // Usando id_pedido corretamente
          mesa: item.mesa,
          criado_em: item.criado_em,
          itens: []
        };
      }

      pedidosAgrupados[item.id_pedido].itens.push({  // Corrigido para id_pedido
        item_id: item.item_id,
        nome: item.nome_produto,                    // Corrigido para nome_produto
        quantidade: item.quantidade,
        observacao: item.observacao,
        origem: item.origem,
        status: item.status,
        pago: item.pago
      });
    });

    res.json(Object.values(pedidosAgrupados)); // Retorna os pedidos agrupados
  } catch (err) {
    console.error('Erro ao buscar pedidos da cozinha:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos da cozinha' });
  }
});

module.exports = router;
