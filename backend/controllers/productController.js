const db = require('../db');
const fs = require('fs').promises;
const path = require('path');

// Lista permitida de origens
const ORIGENS_VALIDAS = ['cozinha', 'bar', 'outro'];

// GET - Listar produtos
const getAllProducts = async (req, res) => {
    try {
        const [results] = await db.query(
            'SELECT id, nome, descricao, preco, imagem, disponivel, origem, categoria FROM produtos'
        );
        res.json(results);
    } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
};

// POST - Criar produto
const createProduct = async (req, res) => {
    try {
        let { nome, descricao, preco, origem, categoria } = req.body;

        if (!nome || !descricao || !preco || !origem || !categoria) {
            return res.status(400).json({ error: 'Campos obrigatórios não informados' });
        }

        if (!ORIGENS_VALIDAS.includes(origem)) {
            return res.status(400).json({ error: `Origem inválida. Use: ${ORIGENS_VALIDAS.join(', ')}` });
        }

        const parsedPreco = parseFloat(preco);
        if (isNaN(parsedPreco)) {
            return res.status(400).json({ error: 'Preço inválido' });
        }

        const imagem = req.file ? req.file.filename : 'sem-imagem.png';

        const query = `
            INSERT INTO produtos (nome, descricao, preco, imagem, disponivel, origem, categoria) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [
            nome,
            descricao,
            parsedPreco,
            imagem,
            true,
            origem,
            categoria
        ]);

        res.status(201).json({ message: 'Produto criado com sucesso', id: result.insertId });
    } catch (err) {
        console.error('Erro ao criar produto:', err);
        res.status(500).json({ error: 'Erro ao criar produto' });
    }
};

// PUT - Editar produto
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, preco, origem, categoria } = req.body;
        const imagem = req.file ? req.file.filename : null;

        const parsedPreco = parseFloat(preco);
        if (!nome || !descricao || !origem || !categoria || isNaN(parsedPreco)) {
            return res.status(400).json({ error: 'Campos inválidos ou ausentes' });
        }

        if (!ORIGENS_VALIDAS.includes(origem)) {
            return res.status(400).json({ error: `Origem inválida. Use: ${ORIGENS_VALIDAS.join(', ')}` });
        }

        let query = `
            UPDATE produtos SET nome=?, descricao=?, preco=?, origem=?, categoria=?
        `;
        const params = [nome, descricao, parsedPreco, origem, categoria];

        if (imagem) {
            query += ', imagem=?';
            params.push(imagem);
        }

        query += ' WHERE id=?';
        params.push(id);

        await db.query(query, params);
        res.json({ message: 'Produto atualizado com sucesso' });
    } catch (err) {
        console.error('Erro ao atualizar produto:', err);
        res.status(500).json({ error: 'Erro ao atualizar produto', detalhe: err.message });
    }
};

// PATCH - Atualizar status de disponibilidade
const updateProductStatus = async (req, res) => {
    const { id } = req.params;
    const { disponivel } = req.body;

    try {
        await db.query('UPDATE produtos SET disponivel = ? WHERE id = ?', [disponivel, id]);
        res.sendStatus(200);
    } catch (err) {
        console.error('Erro ao atualizar status do produto:', err);
        res.status(500).json({ error: 'Erro ao atualizar status do produto' });
    }
};

// DELETE - Excluir produto
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const [results] = await db.query('SELECT imagem FROM produtos WHERE id=?', [id]);
        const imagem = results[0]?.imagem;

        if (imagem && imagem !== 'sem-imagem.png') {
            const imagePath = path.join(__dirname, '../uploads', imagem);
            try {
                await fs.unlink(imagePath);
            } catch (err) {
                console.warn('⚠️ Erro ao excluir imagem do disco:', err);
            }
        }

        await db.query('DELETE FROM produtos WHERE id=?', [id]);
        res.json({ message: 'Produto excluído com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir produto:', err);
        res.status(500).json({ error: 'Erro ao excluir produto' });
    }
};

module.exports = {
    getAllProducts,
    createProduct,
    updateProduct,
    updateProductStatus,
    deleteProduct
};
