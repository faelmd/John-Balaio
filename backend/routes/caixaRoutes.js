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
  try {
    const [pedidos] = await pool.query(
      `SELECT * FROM pedidos WHERE status = "pronto" ORDER BY criado_em ASC`
    );

    const pedidosComItensPendentes = await Promise.all(
      pedidos.map(async pedido => {
        const [itens] = await pool.query(
          `SELECT * FROM itens_pedidos WHERE id_pedido = ? AND pago = 0`,
          [pedido.id]
        );
        return itens.length > 0 ? { ...pedido, itens } : null;
      })
    );

    const pedidosValidos = pedidosComItensPendentes.filter(Boolean);
    res.status(200).json(pedidosValidos);
  } catch (err) {
    console.error('❌ Erro ao buscar pedidos prontos:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos prontos' });
  }
});

// ---------------------------
// GET /pedidos/itens/:pedidoId - Retorna itens de um pedido
// ---------------------------
router.get('/pedidos/itens/:pedidoId', async (req, res) => {
  const { pedidoId } = req.params;
  try {
    const [itens] = await pool.query(
      'SELECT id, nome_produto, quantidade, preco_unitario, pago FROM itens_pedidos WHERE pedido_id = ? ORDER BY id ASC',
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
          'SELECT id, nome_produto, quantidade, preco_unitario, pago FROM itens_pedidos WHERE pedido_id = ? ORDER BY id ASC',
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

router.post('/pagar-dividido/:mesa', async (req, res) => {
  const { mesa } = req.params;
  const { partes } = req.body;

  // ⚠️ Validação
  if (!mesa || isNaN(mesa)) {
    return res.status(400).json({ error: 'Número da mesa inválido.' });
  }

  if (!partes || isNaN(partes) || partes < 2) {
    return res.status(400).json({ error: 'Quantidade de partes deve ser 2 ou mais.' });
  }

  try {
    // 🔍 Buscar todos os itens não pagos da mesa
    const [itens] = await pool.query(`
      SELECT i.preco_unitario, i.quantidade
      FROM itens_pedidos i
      INNER JOIN pedidos p ON i.id_pedido = p.id
      WHERE p.mesa = ? AND i.pago = 0
    `, [mesa]);

    if (itens.length === 0) {
      return res.status(400).json({ error: 'Nenhum item pendente para esta mesa.' });
    }

    // 💰 Calcular total
    const total = itens.reduce((acc, item) => {
      return acc + (parseFloat(item.preco_unitario) * item.quantidade);
    }, 0);

    const valorPorParte = (total / partes).toFixed(2);

    res.status(200).json({
      success: true,
      total: total.toFixed(2),
      partes: parseInt(partes),
      valor_por_parte: valorPorParte
    });
  } catch (err) {
    console.error('Erro ao dividir conta:', err);
    res.status(500).json({ error: 'Erro ao dividir conta.' });
  }
});

module.exports = router;
