const express = require('express');
const router = express.Router();
const pool = require('../db');
const fs = require('fs').promises;
const path = require('path');

// 🔥 GET mesas pagas
router.get('/mesas-pagas', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT p.mesa
      FROM pedidos p
      JOIN itens_pedidos i ON p.id = i.id_pedido
      GROUP BY p.mesa
      HAVING SUM(i.pago = 0) = 0
    `);
    res.json(rows.map(r => r.mesa));
  } catch (err) {
    console.error('❌ Erro ao buscar mesas pagas:', err);
    res.status(500).json({ error: 'Erro ao buscar mesas pagas' });
  }
});

// 🔥 GET itens da mesa
router.get('/mesa/:mesaId', async (req, res) => {
  const { mesaId } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.abertura,
        p.fechamento,
        i.id,
        i.nome_produto,
        i.quantidade,
        i.preco_unitario,
        i.status,
        i.pago
      FROM pedidos p
      JOIN itens_pedidos i ON p.id = i.id_pedido
      WHERE p.mesa = ? AND p.fechamento IS NULL
      ORDER BY i.id ASC
    `, [mesaId]);

    if (!rows.length) {
      return res.status(404).json({
        mesa: mesaId,
        itens: [],
        abertura: null,
        fechamento: null,
        message: 'Nenhum item encontrado'
      });
    }

    const { abertura, fechamento } = rows[0];
    const itens = rows.map(item => ({
      id: item.id,
      nome_produto: item.nome_produto,
      quantidade: item.quantidade,
      preco_unitario: parseFloat(item.preco_unitario),
      status: item.status,
      pago: item.pago === 1
    }));

    res.json({ mesa: mesaId, abertura, fechamento, itens });

  } catch (err) {
    console.error('❌ Erro ao buscar itens:', err);
    res.status(500).json({ error: 'Erro ao buscar itens da mesa' });
  }
});

// 🔥 PUT pagar itens selecionados
router.put('/pagar', async (req, res) => {
  const { itemIds } = req.body;

  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ error: 'Lista de itens inválida' });
  }

  try {
    // Atualiza os itens como pagos
    await pool.query(`UPDATE itens_pedidos SET pago = 1 WHERE id IN (?)`, [itemIds]);

    // Pega o ID da mesa a partir de qualquer item
    const [[{ mesa }]] = await pool.query(`
      SELECT p.mesa
      FROM itens_pedidos i
      JOIN pedidos p ON i.id_pedido = p.id
      WHERE i.id = ?
      LIMIT 1
    `, [itemIds[0]]);

    // Verifica se todos os itens da mesa estão pagos
    const [[{ totalNaoPago }]] = await pool.query(`
      SELECT COUNT(*) AS totalNaoPago
      FROM itens_pedidos i
      JOIN pedidos p ON i.id_pedido = p.id
      WHERE p.mesa = ? AND i.pago = 0 AND p.fechamento IS NULL
    `, [mesa]);

    // Se todos os itens pagos, encerra a mesa e gera comprovante
    if (totalNaoPago === 0) {
      await pool.query(`
        UPDATE pedidos SET fechamento = CURRENT_TIMESTAMP
        WHERE mesa = ? AND fechamento IS NULL
      `, [mesa]);

      const [itens] = await pool.query(`
        SELECT nome_produto, quantidade, preco_unitario
        FROM itens_pedidos i
        JOIN pedidos p ON i.id_pedido = p.id
        WHERE p.mesa = ?
      `, [mesa]);

      const total = itens.reduce((acc, item) =>
        acc + item.quantidade * item.preco_unitario, 0
      );

      const dataHora = new Date().toISOString().replace(/[:.]/g, '-');
      const nomeArquivo = `comprovante-mesa-${mesa}-${dataHora}.txt`;
      const caminho = path.join(__dirname, '../comprovantes', nomeArquivo);

      let conteudo = `=== COMPROVANTE DE PAGAMENTO ===\n`;
      conteudo += `Mesa: ${mesa}\nData/Hora: ${new Date().toLocaleString('pt-BR')}\n\n`;

      itens.forEach(item => {
        conteudo += `${item.nome_produto} - ${item.quantidade}x R$${item.preco_unitario.toFixed(2)}\n`;
      });

      conteudo += `\nTOTAL: R$${total.toFixed(2)}\n===============================\n`;

      await fs.mkdir(path.dirname(caminho), { recursive: true });
      await fs.writeFile(caminho, conteudo);

      return res.json({ success: true, encerrado: true, comprovante: nomeArquivo });
    }

    res.json({ success: true, encerrado: false });

  } catch (err) {
    console.error('❌ Erro no pagamento:', err);
    res.status(500).json({ error: 'Erro ao confirmar pagamento' });
  }
});

// 🔥 POST pagar tudo da mesa
router.post('/pagar/:mesaId', async (req, res) => {
  const { mesaId } = req.params;
  try {
    const [itens] = await pool.query(`
      SELECT 
        i.id, i.nome_produto, i.quantidade, i.preco_unitario, p.id AS pedido_id
      FROM itens_pedidos i
      INNER JOIN pedidos p ON i.id_pedido = p.id
      WHERE p.mesa = ? AND p.fechamento IS NULL AND i.pago = 0
    `, [mesaId]);

    if (!itens.length) {
      return res.status(400).json({ error: 'Nenhum item não pago na mesa' });
    }

    const total = itens.reduce(
      (acc, item) => acc + Number(item.preco_unitario) * item.quantidade,
      0
    );

    const dataHora = new Date().toISOString().replace(/[:.]/g, '-');
    const nomeArquivo = `comprovante-mesa-${mesaId}-${dataHora}.txt`;
    const caminho = path.join(__dirname, '../comprovantes', nomeArquivo);

    await fs.mkdir(path.dirname(caminho), { recursive: true });

    let conteudo = `=== COMPROVANTE DE PAGAMENTO ===\n`;
    conteudo += `Mesa: ${mesaId}\n`;
    conteudo += `Data/Hora: ${new Date().toLocaleString('pt-BR')}\n\n`;

    itens.forEach(item => {
      conteudo += `${item.nome_produto} - ${item.quantidade}x R$${Number(item.preco_unitario).toFixed(2)}\n`;
    });

    conteudo += `\nTOTAL: R$${total.toFixed(2)}\n`;
    conteudo += `===============================\n`;

    await fs.writeFile(caminho, conteudo);

    const itemIds = itens.map(item => item.id);
    await pool.query(`UPDATE itens_pedidos SET pago = 1 WHERE id IN (?)`, [itemIds]);

    const [pendentes] = await pool.query(`
      SELECT COUNT(*) as count
      FROM itens_pedidos i
      INNER JOIN pedidos p ON i.id_pedido = p.id
      WHERE p.mesa = ? AND p.fechamento IS NULL AND i.pago = 0
    `, [mesaId]);

    if (pendentes[0].count === 0) {
      await pool.query(`
        UPDATE pedidos SET fechamento = CURRENT_TIMESTAMP
        WHERE mesa = ? AND fechamento IS NULL
      `, [mesaId]);
    }

    res.json({ success: true, arquivo: nomeArquivo });

  } catch (err) {
    console.error('❌ Erro no pagamento:', err);
    res.status(500).json({ error: 'Erro no pagamento da mesa' });
  }
});

// 🔥 POST pagar dividido
router.post('/pagar-dividido/:mesaId', async (req, res) => {
  const { mesaId } = req.params;
  const { partes } = req.body;

  if (!partes || isNaN(partes) || partes < 2) {
    return res.status(400).json({ error: 'Quantidade de partes inválida' });
  }

  try {
    const [itens] = await pool.query(`
      SELECT preco_unitario, quantidade
      FROM itens_pedidos i
      INNER JOIN pedidos p ON i.id_pedido = p.id
      WHERE p.mesa = ? AND p.fechamento IS NULL AND i.pago = 0 AND i.status = 'pronto'
    `, [mesaId]);

    if (!itens.length) {
      return res.status(400).json({ error: 'Nenhum item pronto e não pago na mesa' });
    }

    const total = itens.reduce(
      (acc, item) => acc + Number(item.preco_unitario) * item.quantidade,
      0
    );

    res.json({
      success: true,
      total: total.toFixed(2),
      partes,
      valor_por_parte: (total / partes).toFixed(2)
    });

  } catch (err) {
    console.error('❌ Erro ao dividir conta:', err);
    res.status(500).json({ error: 'Erro ao dividir conta' });
  }
});

// GET /api/caixa/comprovantes
router.get('/comprovantes', async (req, res) => {
  try {
    const dir = path.join(__dirname, '../comprovantes');
    const files = await fs.readdir(dir);
    const comprovantes = files.filter(file => file.endsWith('.txt'));
    res.json(comprovantes);
  } catch (err) {
    console.error('❌ Erro ao listar comprovantes:', err);
    res.status(500).json({ error: 'Erro ao listar comprovantes' });
  }
});

// 🔥 GET baixar comprovante
router.get('/comprovantes/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../comprovantes', filename);

  res.download(filePath, err => {
    if (err) {
      console.error('❌ Erro ao baixar comprovante:', err);
      res.status(404).json({ error: 'Comprovante não encontrado' });
    }
  });
});

module.exports = router;
