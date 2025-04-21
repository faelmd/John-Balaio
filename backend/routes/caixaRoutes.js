const express = require('express');
const router = express.Router();
const pool = require('../db');

// ---------------------------
// GET /mesas-completas - Usado no painel do caixa para listar mesas com todos os pedidos e itens
// ---------------------------
router.get('/mesas-completas', async (req, res) => {
  try {
    // Busca todas as mesas com pedidos que ainda não estão prontos
    const [mesas] = await pool.query(
      'SELECT DISTINCT mesa FROM pedidos WHERE status != "pronto" ORDER BY mesa ASC'
    );

    const dadosMesa = await Promise.all(
      mesas.map(async ({ mesa }) => {
        const [pedidos] = await pool.query(
          'SELECT id, status, cozinheiro, origem, created_at FROM pedidos WHERE mesa = ? ORDER BY created_at ASC',
          [mesa]
        );

        const pedidosComItens = await Promise.all(
          pedidos.map(async (pedido) => {
            const [itens] = await pool.query(
              'SELECT id, nome, quantidade, preco, observacao, pago FROM itens_pedido WHERE pedido_id = ? ORDER BY id ASC',
              [pedido.id]
            );
            return { ...pedido, itens };
          })
        );

        return {
          mesa,
          pedidos: pedidosComItens,
        };
      })
    );

    res.status(200).json(dadosMesa);
  } catch (err) {
    console.error('Erro ao buscar mesas completas:', err);
    res.status(500).json({ error: 'Erro ao buscar dados do caixa' });
  }
});

// ---------------------------
// GET /pedidos?origem=cozinha|bar - Listar pedidos por origem agrupados por mesa
// ---------------------------
router.get('/pedidos', async (req, res) => {
  const { origem } = req.query;

  if (!origem || (origem !== 'cozinha' && origem !== 'bar')) {
    return res.status(400).json({ error: 'Origem inválida. Use "cozinha" ou "bar".' });
  }

  try {
    // Busca todos os pedidos com a origem desejada e que não estão prontos
    const [pedidos] = await pool.query(
      'SELECT id, mesa, status, cozinheiro, created_at FROM pedidos WHERE origem = ? AND status != "pronto" ORDER BY created_at ASC',
      [origem]
    );

    // Para cada pedido, busca os itens
    const pedidosComItens = await Promise.all(
      pedidos.map(async pedido => {
        const [itens] = await pool.query(
          'SELECT id, nome, quantidade, preco, observacao, pago FROM itens_pedido WHERE pedido_id = ? ORDER BY id ASC',
          [pedido.id]
        );
        return { ...pedido, itens };
      })
    );

    // Agrupa os pedidos por mesa
    const agrupadosPorMesa = {};
    for (const pedido of pedidosComItens) {
      if (!agrupadosPorMesa[pedido.mesa]) {
        agrupadosPorMesa[pedido.mesa] = [];
      }
      agrupadosPorMesa[pedido.mesa].push(pedido);
    }

    res.status(200).json(agrupadosPorMesa);
  } catch (err) {
    console.error('Erro ao buscar pedidos por origem:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos por origem' });
  }
});

// ---------------------------
// GET /mesas - Listar mesas com pedidos não prontos
// ---------------------------
router.get('/mesas', async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT DISTINCT mesa FROM pedidos WHERE status != "pronto"'
      );
      console.log(rows);  // Log para depuração, verifique o que está sendo retornado
      res.status(200).json(rows.map(r => r.mesa));  // Retorna apenas o ID das mesas
    } catch (err) {
      console.error('Erro ao buscar mesas:', err);
      res.status(500).json({ error: 'Erro ao buscar mesas' });
    }
  });
  

// ---------------------------
// GET /mesa/:mesa - Listar pedidos (com itens) de uma mesa
// ---------------------------
router.get('/mesa/:mesa', async (req, res) => {
  const { mesa } = req.params;
  try {
    const [pedidos] = await pool.query(
      'SELECT id, status, cozinheiro, origem, created_at FROM pedidos WHERE mesa = ? ORDER BY created_at ASC',
      [mesa]
    );
    const pedidosComItens = await Promise.all(
      pedidos.map(async pedido => {
        const [itens] = await pool.query(
          'SELECT id, nome, quantidade, preco, observacao, pago FROM itens_pedido WHERE pedido_id = ? ORDER BY id ASC',
          [pedido.id]
        );
        return { ...pedido, itens };
      })
    );
    res.status(200).json(pedidosComItens);
  } catch (err) {
    console.error('Erro ao buscar pedidos da mesa:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos da mesa' });
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
      `UPDATE itens_pedido SET pago = TRUE WHERE id IN (${placeholders})`,
      itemIds
    );
    res.status(200).json({ message: 'Itens atualizados com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar itens:', err);
    res.status(500).json({ error: 'Erro ao atualizar itens' });
  }
});

module.exports = router;
