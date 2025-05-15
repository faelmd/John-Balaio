const express = require('express');
const router = express.Router();
const pool = require('../db');

// ---------------------------
// GET /mesas-completas - Listar mesas com todos os pedidos e itens (painel do caixa)
// ---------------------------
router.get('/mesas-completas', async (req, res) => {
  try {
    const [mesas] = await pool.query(
      'SELECT DISTINCT mesa FROM pedidos WHERE status != "pronto" ORDER BY mesa ASC'
    );

    const dadosMesa = await Promise.all(
      mesas.map(async ({ mesa }) => {
        const [pedidos] = await pool.query(
          'SELECT id, status, nome_cozinheiro, origem, criado_em FROM pedidos WHERE mesa = ? ORDER BY criado_em ASC',
          [mesa]
        );

        const pedidosComItens = await Promise.all(
          pedidos.map(async (pedido) => {
            const [itens] = await pool.query(
              'SELECT id, nome, quantidade, preco, observacao, pago FROM itens_pedidos WHERE pedido_id = ? ORDER BY id ASC',
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

  if (!origem || (origem !== 'cozinha' && origem !== 'bar' && origem !== 'caixa')) {
    return res.status(400).json({ error: 'Origem inválida. Use "cozinha", "bar" ou "caixa".' });
  }

  try {
    const statusCond = origem === 'caixa' ? '!= "pronto"' : 'IN ("pendente", "em preparo")';
    const [pedidos] = await pool.query(
      `SELECT id, mesa, status, nome_cozinheiro, criado_em FROM pedidos WHERE origem = ? AND status ${statusCond} ORDER BY criado_em ASC`,
      [origem]
    );

    const pedidosComItens = await Promise.all(
      pedidos.map(async pedido => {
        const [itens] = await pool.query(
          'SELECT id, nome, quantidade, preco, observacao, pago FROM itens_pedidos WHERE pedido_id = ? ORDER BY id ASC',
          [pedido.id]
        );
        return { ...pedido, itens };
      })
    );

    if (origem === 'caixa') {
      res.status(200).json(pedidosComItens);
    } else {
      const agrupadosPorMesa = {};
      for (const pedido of pedidosComItens) {
        if (!agrupadosPorMesa[pedido.mesa]) {
          agrupadosPorMesa[pedido.mesa] = [];
        }
        agrupadosPorMesa[pedido.mesa].push(pedido);
      }

      res.status(200).json(agrupadosPorMesa);
    }
  } catch (err) {
    console.error('Erro ao buscar pedidos por origem:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos por origem' });
  }
});

// ---------------------------
// GET /pedidos/itens/:pedidoId - Retorna itens de um pedido
// ---------------------------
router.get('/pedidos/itens/:pedidoId', async (req, res) => {
  const { pedidoId } = req.params;
  try {
    const [itens] = await pool.query(
      'SELECT id, nome, quantidade, preco, pago FROM itens_pedidos WHERE pedido_id = ? ORDER BY id ASC',
      [pedidoId]
    );
    res.status(200).json(itens);
  } catch (err) {
    console.error('Erro ao buscar itens do pedido:', err);
    res.status(500).json({ error: 'Erro ao buscar itens do pedido' });
  }
});

// ---------------------------
// PUT /pedidos/pagar - Pagar itens selecionados
// ---------------------------
router.put('/pedidos/pagar', async (req, res) => {
  const { itemIds } = req.body;

  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ error: 'Lista de itens inválida.' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE itens_pedidos SET pago = 1 WHERE id IN (?)`,
      [itemIds]
    );
    res.status(200).json({ success: true, updated: result.affectedRows });
  } catch (err) {
    console.error('Erro ao atualizar pagamento:', err);
    res.status(500).json({ error: 'Erro ao confirmar pagamento.' });
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
    res.status(200).json(rows.map(r => r.mesa));
  } catch (err) {
    console.error('Erro ao buscar mesas:', err);
    res.status(500).json({ error: 'Erro ao buscar mesas' });
  }
});

// ---------------------------
// GET /mesa/:mesa - Listar todos os pedidos de uma mesa
// ---------------------------
router.get('/mesa/:mesa', async (req, res) => {
  const { mesa } = req.params;
  try {
    const [pedidos] = await pool.query(
      'SELECT id, status, nome_cozinheiro, origem, criado_em FROM pedidos WHERE mesa = ? ORDER BY criado_em ASC',
      [mesa]
    );

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
    console.error('Erro ao buscar pedidos da mesa:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos da mesa' });
  }
});

module.exports = router;
