require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const productRoutes = require('./routes/productRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const caixaRoutes = require('./routes/caixaRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos de imagem da pasta "uploads"
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/api/produtos', productRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/caixa', caixaRoutes);

// Iniciar o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

const pool = require('./db');

// Testar conexão com banco
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conectado ao banco de dados MySQL');
        connection.release(); // libera a conexão
    } catch (error) {
        console.error('❌ Erro ao conectar ao banco de dados:', error);
    }
})();
