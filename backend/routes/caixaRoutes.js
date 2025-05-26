const express = require('express');
const router = express.Router();
const pool = require('../db');
const fs = require('fs').promises;
const path = require('path');

// ✅ GET /caixa/mesas-pagas
router.get('/mesas-pagas', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT p.mesa
      FROM pedidos p
      JOIN itens_pedidos i ON p.id = i.id_pedido
      GROUP BY p.mesa
      HAVING SUM(i.pago = 0) = 0
    `);
    res.status(200).json(rows.map(r => r.mesa));
  } catch (err) {
    console.error('Erro ao buscar mesas pagas:', err);
    res.status(500).json({ error: 'Erro ao buscar mesas pagas' });
  }
});

// ✅ GET /caixa/mesa/:mesaId → Listar todos os itens da mesa
router.get('/mesa/:mesaId', async (req, res) => {
  const { mesaId } = req.params;

  try {
    const [itens] = await pool.query(`
      SELECT 
        i.id,
        i.nome_produto,
        i.quantidade,
        i.preco_unitario,
        i.status,
        i.pago
      FROM pedidos p
      JOIN itens_pedidos i ON p.id = i.id_pedido
      WHERE p.mesa = ?
      ORDER BY i.id ASC
    `, [mesaId]);

    res.status(200).json(itens);
  } catch (err) {
    console.error('❌ Erro ao buscar itens da mesa:', err);
    res.status(500).json({ error: 'Erro ao buscar itens da mesa' });
  }
});

// ✅ PUT /caixa/pagar → Pagar itens selecionados
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

// ✅ POST /caixa/pagar/:mesaId → Pagar tudo da mesa (só itens prontos)
router.post('/pagar/:mesaId', async (req, res) => {
  const { mesaId } = req.params;

  try {
    const [itens] = await pool.query(
      `SELECT i.id, i.nome_produto, i.quantidade, i.preco_unitario 
       FROM itens_pedidos i
       INNER JOIN pedidos p ON i.id_pedido = p.id
       WHERE p.mesa = ? AND i.status = 'pronto' AND i.pago = 0`,
      [mesaId]
    );

    if (itens.length === 0) {
      return res.status(400).json({ error: 'Nenhum item PRONTO e NÃO PAGO para esta mesa.' });
    }

    const total = itens.reduce(
      (acc, item) => acc + item.preco_unitario * item.quantidade,
      0
    );

    // 🧾 Gerar comprovante
    const dataHora = new Date().toISOString().replace(/[:.]/g, '-');
    const nomeArquivo = `comprovante-mesa-${mesaId}-${dataHora}.txt`;
    const caminho = path.join(__dirname, '../comprovantes', nomeArquivo);

    let conteudo = `=== COMPROVANTE DE PAGAMENTO ===\n`;
    conteudo += `Mesa: ${mesaId}\n`;
    conteudo += `Data/Hora: ${new Date().toLocaleString('pt-BR')}\n\n`;

    itens.forEach((item) => {
      conteudo += `${item.nome_produto} - ${item.quantidade}x R$${item.preco_unitario.toFixed(2)}\n`;
    });

    conteudo += `\nTOTAL: R$${total.toFixed(2)}\n`;
    conteudo += `===============================\n`;

    await fs.mkdir(path.join(__dirname, '../comprovantes'), { recursive: true });
    await fs.writeFile(caminho, conteudo);

    // 💰 Atualizar itens como pagos
    const itemIds = itens.map(item => item.id);
    await pool.query(
      `UPDATE itens_pedidos SET pago = 1 WHERE id IN (?)`,
      [itemIds]
    );

    res.status(200).json({ success: true, message: 'Pagamento efetuado', arquivo: nomeArquivo });

  } catch (err) {
    console.error('Erro no pagamento:', err);
    res.status(500).json({ error: 'Erro ao processar pagamento.' });
  }
});

// ✅ GET /caixa/comprovantes/:filename → Download do comprovante
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

// ✅ POST /caixa/pagar-dividido/:mesaId → Dividir a conta
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
      WHERE p.mesa = ? AND i.pago = 0 AND i.status = 'pronto'
    `, [mesaId]);

    if (itens.length === 0) {
      return res.status(400).json({ error: 'Nenhum item PRONTO e NÃO PAGO nesta mesa.' });
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
