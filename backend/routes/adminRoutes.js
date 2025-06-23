const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const pool = require('../db');
const PDFDocument = require('pdfkit');

const pastaRelatorios = path.join(__dirname, '../relatorios');

// 🔥 POST → /api/relatorios/finalizar-expediente
router.post('/finalizar-expediente', async (req, res) => {
  const { token } = req.body;
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const dataHora = new Date().toISOString().replace(/[:.]/g, '-');
    const nomeArquivo = `relatorio-${dataHora}.pdf`;
    const caminho = path.join(pastaRelatorios, nomeArquivo);

    const [pedidos] = await pool.query('SELECT * FROM pedidos ORDER BY mesa ASC');
    if (pedidos.length === 0) {
      return res.status(400).json({ error: 'Não há pedidos para encerrar.' });
    }

    await fs.mkdir(pastaRelatorios, { recursive: true });

    const doc = new PDFDocument();
    doc.pipe(fsSync.createWriteStream(caminho));

    doc.fontSize(18).text('Relatório de Expediente - John Balaio', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Data de encerramento: ${new Date().toLocaleString('pt-BR')}`);
    doc.moveDown();

    let totalGeral = 0;

    for (const pedido of pedidos) {
      const [itens] = await pool.query(
        `SELECT nome_produto, quantidade, preco_unitario, pago, status, nome_cozinheiro
         FROM itens_pedidos
         WHERE id_pedido = ?`,
        [pedido.id]
      );

      const abertura = pedido.abertura
        ? new Date(pedido.abertura).toLocaleString('pt-BR')
        : 'N/A';
      const fechamento = pedido.fechamento
        ? new Date(pedido.fechamento).toLocaleString('pt-BR')
        : 'Em aberto';

      doc.fontSize(14).text(`Mesa: ${pedido.mesa}`, { underline: true });
      doc.fontSize(10).text(`Abertura: ${abertura}`);
      doc.fontSize(10).text(`Fechamento: ${fechamento}`);
      doc.fontSize(10).text(`Observação: ${pedido.observacao || 'N/A'}`);
      doc.moveDown(0.5);

      let totalPedido = 0;
      itens.forEach(item => {
        const subtotal = item.preco_unitario * item.quantidade;
        totalPedido += subtotal;

        let linhaItem = `- ${item.nome_produto} | ${item.quantidade}x | R$${item.preco_unitario.toFixed(2)} | Subtotal: R$${subtotal.toFixed(2)} | Pago: ${item.pago ? 'Sim' : 'Não'} | Status: ${item.status}`;
        if (item.nome_cozinheiro) {
          linhaItem += ` | Cozinheiro: ${item.nome_cozinheiro}`;
        }

        doc.text(linhaItem);
      });

      doc.text(`Total do pedido: R$${totalPedido.toFixed(2)}`);
      doc.moveDown(1);

      totalGeral += totalPedido;
    }

    doc.moveDown();
    doc.fontSize(14).text(`TOTAL GERAL DO EXPEDIENTE: R$${totalGeral.toFixed(2)}`, {
      align: 'center',
      underline: true,
    });

    doc.end();

    // 🔁 Arquivar comprovantes após fechar expediente
    const pastaComprovantes = path.join(__dirname, '../comprovantes');
    const pastaArquivados = path.join(pastaComprovantes, 'arquivados');

    await fs.mkdir(pastaArquivados, { recursive: true });
    const comprovantes = await fs.readdir(pastaComprovantes, { withFileTypes: true });

    for (const file of comprovantes) {
      if (file.isFile() && file.name.endsWith('.txt')) {
        const origem = path.join(pastaComprovantes, file.name);
        const destino = path.join(pastaArquivados, file.name);
        await fs.rename(origem, destino);
      }
    }


    // 🔥 Limpar base
    await pool.query('DELETE FROM itens_pedidos');
    await pool.query('DELETE FROM pedidos');

    res.status(200).json({
      success: true,
      message: 'Expediente encerrado e relatório gerado.',
      arquivo: nomeArquivo,
    });
  } catch (err) {
    console.error('❌ Erro ao finalizar expediente:', err);
    res.status(500).json({ error: 'Erro ao finalizar expediente.' });
  }
});

module.exports = router;
