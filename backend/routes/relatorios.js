const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const pastaRelatorios = path.join(__dirname, '../relatorios');

// 🗂️ GET → Listar relatórios
router.get('/', async (req, res) => {
  try {
    const arquivos = await fs.readdir(pastaRelatorios);
    const pdfFiles = arquivos.filter(file => file.endsWith('.pdf')).sort().reverse();
    res.status(200).json(pdfFiles);
  } catch (err) {
    console.error('Erro ao listar relatórios:', err);
    res.status(500).json({ error: 'Erro ao listar relatórios' });
  }
});

// 📥 GET → Download de relatório
router.get('/download/:nomeArquivo', async (req, res) => {
  try {
    const { nomeArquivo } = req.params;
    const caminho = path.join(pastaRelatorios, nomeArquivo);

    // Verifica se o arquivo realmente existe
    await fs.access(caminho);

    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Type', 'application/pdf');

    res.download(caminho, nomeArquivo, (err) => {
      if (err) {
        console.error('❌ Erro ao enviar o arquivo:', err);
        res.status(500).json({ error: 'Erro ao baixar relatório' });
      }
    });
  } catch (err) {
    console.error('❌ Arquivo não encontrado ou erro de leitura:', err);
    res.status(404).json({ error: 'Relatório não encontrado' });
  }
});


module.exports = router;
