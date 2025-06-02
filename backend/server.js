require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const productRoutes = require('./routes/productRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const caixaRoutes = require('./routes/caixaRoutes');
const barRoutes = require('./routes/barRoutes');
const cozinhaRoutes = require('./routes/cozinhaRoutes');
const adminRoutes = require('./routes/adminRoutes');
const relatoriosRoutes = require('./routes/relatorios');

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 Static para uploads e comprovantes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/comprovantes', express.static(path.join(__dirname, 'comprovantes')));

// 🔥 Rotas
app.use('/api/produtos', productRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/caixa', caixaRoutes);
app.use('/api/bar', barRoutes);
app.use('/api/cozinha', cozinhaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/relatorios', relatoriosRoutes);

// 🔥 Porta
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

// 🔥 Teste conexão MySQL
const pool = require('./db');

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado ao banco MySQL');
    connection.release();
  } catch (error) {
    console.error('❌ Erro na conexão com o banco:', error);
  }
})();
