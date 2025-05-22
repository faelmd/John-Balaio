const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const pool = require('../db');

// 🔥 Rota de encerrar expediente + gerar relatório
router.post('/finalizar-expediente', async (req, res) => {
  const { token } = req.body;

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const dataHora = new Date().toLocaleString('pt-BR').replace(/[/:]/g, '-');
    const nomeArquivo = `relatorio-${dataHora}.txt`;
    const caminho = path.join(__dirname, '../relatorios', nomeArquivo);

    const [pedidos] = await pool.query('SELECT * FROM pedidos ORDER BY criado_em ASC');

    if (pedidos.length === 0) {
      return res.status(400).json({ error: 'Não há pedidos para encerrar.' });
    }

    let conteudo = `===== RELATÓRIO DE EXPEDIENTE =====\n`;
    conteudo += `Data/Hora de Encerramento: ${new Date().toLocaleString('pt-BR')}\n\n`;

    let totalGeral = 0;

    for (const pedido of pedidos) {
      const [itens] = await pool.query(
        'SELECT * FROM itens_pedidos WHERE id_pedido = ?',
        [pedido.id]
      );

      conteudo += `Pedido ID: ${pedido.id}\n`;
      conteudo += `Mesa: ${pedido.mesa}\n`;
      conteudo += `Criado em: ${pedido.criado_em}\n`;
      conteudo += `Atualizado em: ${pedido.atualizado_em}\n`;
      conteudo += `Origem: ${pedido.origem}\n`;
      conteudo += `Cozinheiro: ${pedido.nome_cozinheiro || 'N/A'}\n`;
      conteudo += `Observação: ${pedido.observacao || 'N/A'}\n`;
      conteudo += `Status: ${pedido.status}\n`;
      conteudo += `Itens:\n`;

      let totalPedido = 0;

      for (const item of itens) {
        const subtotal = item.preco_unitario * item.quantidade;
        totalPedido += subtotal;
        conteudo += `  - ${item.nome_produto} | ${item.quantidade}x | R$${item.preco_unitario} | Subtotal: R$${subtotal.toFixed(2)} | Pago: ${item.pago ? 'Sim' : 'Não'}\n`;
      }

      conteudo += `Total do pedido: R$${totalPedido.toFixed(2)}\n`;
      conteudo += `-----------------------------------\n\n`;

      totalGeral += totalPedido;
    }

    conteudo += `TOTAL GERAL DO EXPEDIENTE: R$${totalGeral.toFixed(2)}\n`;
    conteudo += `===================================\n`;

    await fs.mkdir(path.join(__dirname, '../relatorios'), { recursive: true });
    await fs.writeFile(caminho, conteudo);

    await pool.query('DELETE FROM itens_pedidos');
    await pool.query('DELETE FROM pedidos');

    res.status(200).json({
      success: true,
      message: 'Expediente encerrado e relatório gerado.',
      arquivo: nomeArquivo,
    });
  } catch (err) {
    console.error('Erro ao finalizar expediente:', err);
    res.status(500).json({ error: 'Erro ao finalizar expediente.' });
  }
});

module.exports = router;
