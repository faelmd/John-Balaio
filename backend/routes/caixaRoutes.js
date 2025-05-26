// src/routes/caixa.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /caixa/mesas-pagas
router.get('/mesas-pagas', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT mesa 
      FROM pedidos 
      WHERE status = 'pago'
      ORDER BY mesa ASC
    `);
    res.status(200).json(rows.map(r => r.mesa));
  } catch (err) {
    console.error('Erro ao buscar mesas pagas:', err);
    res.status(500).json({ error: 'Erro ao buscar mesas pagas' });
  }
});


// ---------------------------
// GET /caixa/mesa/:mesaId - Lista todos os itens não pagos da mesa
// ---------------------------
router.get('/mesa/:mesaId', async (req, res) => {
  const { mesaId } = req.params;

  try {
    const [itens] = await pool.query(`
      SELECT 
        i.id,
        i.nome_produto,
        i.quantidade,
        i.preco_unitario,
        i.pago
      FROM pedidos p
      JOIN itens_pedidos i ON p.id = i.id_pedido
      WHERE p.mesa = ? AND p.status = 'pronto'
      ORDER BY i.id ASC
    `, [mesaId]);

    res.status(200).json(itens);
  } catch (err) {
    console.error('Erro ao buscar itens da mesa:', err);
    res.status(500).json({ error: 'Erro ao buscar itens da mesa' });
  }
});

// ---------------------------
// PUT /caixa/pagar - Pagar itens selecionados
// ---------------------------
router.put('/pagar', async (req, res) => {
  const { itemIds } = req.body;

  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ error: 'Lista de itens inválida.' });
  }

  try {
    const [result] = await pool.query(`
      UPDATE itens_pedidos 
      SET pago = 1 
      WHERE id IN (?)
    `, [itemIds]);

    res.status(200).json({ success: true, updated: result.affectedRows });
  } catch (err) {
    console.error('Erro ao confirmar pagamento:', err);
    res.status(500).json({ error: 'Erro ao confirmar pagamento.' });
  }
});

// ---------------------------
// POST /caixa/pagar/:mesaId - Pagar tudo da mesa
// ---------------------------
router.post('/pagar/:mesaId', async (req, res) => {
  const { mesaId } = req.params;

  try {
    // 🔍 Buscar itens não pagos da mesa e status 'pronto'
    const [itens] = await pool.query(
      `
      SELECT i.id, i.nome AS nome, i.quantidade, i.preco, p.id AS pedido_id
      FROM itens_pedidos i
      INNER JOIN pedidos p ON i.id_pedido = p.id
      WHERE p.mesa = ? AND i.pago = 0 AND p.status = 'pronto'
    `,
      [mesaId]
    );

    if (itens.length === 0) {
      return res.status(400).json({ error: 'Nenhum item pendente para essa mesa.' });
    }

    // 💰 Calcular total
    const total = itens.reduce(
      (acc, item) => acc + item.quantidade * item.preco,
      0
    );

    // 📝 Gerar comprovante TXT
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nomeArquivo = `comprovante-mesa-${mesaId}-${timestamp}.txt`;
    const dir = path.join(__dirname, '../comprovantes');
    await fs.mkdir(dir, { recursive: true });

    let conteudo = `===== COMPROVANTE DE PAGAMENTO =====\n`;
    conteudo += `Mesa: ${mesaId}\n`;
    conteudo += `Data: ${new Date().toLocaleString('pt-BR')}\n\n`;

    itens.forEach((item) => {
      const subtotal = (item.preco * item.quantidade).toFixed(2);
      conteudo += `Pedido #${item.pedido_id} - ${item.quantidade}x ${item.nome} - R$${item.preco} cada - Subtotal: R$${subtotal}\n`;
    });

    conteudo += `\nTOTAL: R$${total.toFixed(2)}\n`;
    conteudo += `======================================\n`;

    const caminho = path.join(dir, nomeArquivo);
    await fs.writeFile(caminho, conteudo);

    // ✅ Atualizar itens como pagos
    const idsItens = itens.map((i) => i.id);
    await pool.query(
      `UPDATE itens_pedidos SET pago = 1 WHERE id IN (${idsItens.join(',')})`
    );

    res.status(200).json({
      success: true,
      message: `Itens da mesa ${mesaId} pagos.`,
      comprovante: nomeArquivo,
    });
  } catch (err) {
    console.error('Erro ao pagar tudo:', err);
    res.status(500).json({ error: 'Erro ao pagar a mesa por completo.' });
  }
});

router.get('/comprovantes/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../comprovantes', filename);
  res.download(filePath, (err) => {
    if (err) {
      console.error('Erro ao baixar comprovante:', err);
      res.status(500).json({ error: 'Erro ao baixar comprovante' });
    }
  });
});

// ---------------------------
// POST /caixa/pagar-dividido/:mesaId - Calcular divisão da conta
// ---------------------------
router.post('/pagar-dividido/:mesaId', async (req, res) => {
  const { mesaId } = req.params;
  const { partes } = req.body;

  if (!partes || isNaN(partes) || partes < 2) {
    return res.status(400).json({ error: 'Quantidade de partes inválida.' });
  }

  try {
    const [itens] = await pool.query(`
      SELECT preco_unitario, quantidade 
      FROM itens_pedidos i
      INNER JOIN pedidos p ON i.id_pedido = p.id
      WHERE p.mesa = ? AND i.pago = 0
    `, [mesaId]);

    if (itens.length === 0) {
      return res.status(400).json({ error: 'Nenhum item pendente nesta mesa.' });
    }

    const total = itens.reduce((acc, item) =>
      acc + parseFloat(item.preco_unitario) * item.quantidade, 0
    );

    res.status(200).json({
      success: true,
      total: total.toFixed(2),
      partes,
      valor_por_parte: (total / partes).toFixed(2)
    });
  } catch (err) {
    console.error('Erro ao dividir conta:', err);
    res.status(500).json({ error: 'Erro ao dividir conta.' });
  }
});

module.exports = router;