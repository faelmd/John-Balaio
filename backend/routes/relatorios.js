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
router.get('/download/:nomeArquivo', (req, res) => {
  const { nomeArquivo } = req.params;
  const caminho = path.join(pastaRelatorios, nomeArquivo);

  res.download(caminho, err => {
    if (err) {
      console.error('Erro ao baixar relatório:', err);
      res.status(500).json({ error: 'Erro ao baixar relatório' });
    }
  });
});

module.exports = router;
