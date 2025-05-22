const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const pastaRelatorios = path.join(__dirname, '../relatorios');

// 🗂️ Listar arquivos de relatório
router.get('/', async (req, res) => {
  try {
    const arquivos = await fs.readdir(pastaRelatorios);
    const txtFiles = arquivos.filter(file => file.endsWith('.txt')).sort().reverse();
    res.status(200).json(txtFiles);
  } catch (err) {
    console.error('Erro ao listar relatórios:', err);
    res.status(500).json({ error: 'Erro ao listar relatórios' });
  }
});

// 📥 Baixar um relatório específico
router.get('/download/:nomeArquivo', async (req, res) => {
  const { nomeArquivo } = req.params;
  const caminho = path.join(pastaRelatorios, nomeArquivo);

  try {
    res.download(caminho);
  } catch (err) {
    console.error('Erro ao baixar relatório:', err);
    res.status(500).json({ error: 'Erro ao baixar relatório' });
  }
});

module.exports = router;
