const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /admin/finalizar-expediente
router.post('/finalizar-expediente', async (req, res) => {
  // 🔒 Simples autenticação por token (você pode trocar por JWT se quiser)
  const { token } = req.body;

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('DELETE FROM itens_pedidos');
    await pool.query('DELETE FROM pedidos');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    res.status(200).json({ success: true, message: 'Expediente finalizado. Dados apagados.' });
  } catch (err) {
    console.error('Erro ao finalizar expediente:', err);
    res.status(500).json({ error: 'Erro ao limpar dados' });
  }
});

module.exports = router;
