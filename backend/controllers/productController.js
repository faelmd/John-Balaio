const db = require('../db');
const fs = require('fs').promises;
const path = require('path');

// GET - Listar produtos
const getAllProducts = async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM produtos');
        res.json(results);
    } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
};

// POST - Criar produto com upload de imagem
const createProduct = async (req, res) => {
    try {
        const { name, description, price } = req.body;
        const image = req.file ? req.file.filename : null;

        const query = 'INSERT INTO produtos (name, description, price, image, disponivel) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.query(query, [name, description, price, image, true]);

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
        const { name, description, price } = req.body;
        const image = req.file ? req.file.filename : null;

        let query = 'UPDATE produtos SET name=?, description=?, price=?';
        const params = [name, description, price];

        if (image) {
            query += ', image=?';
            params.push(image);
        }

        query += ' WHERE id=?';
        params.push(id);

        await db.query(query, params);
        res.json({ message: 'Produto atualizado com sucesso' });
    } catch (err) {
        console.error('Erro ao atualizar produto:', err);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
};

// PATCH - Atualizar status (disponível/suspenso)
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

        const [results] = await db.query('SELECT image FROM produtos WHERE id=?', [id]);
        const image = results[0]?.image;

        if (image) {
            const imagePath = path.join(__dirname, '../uploads', image);
            try {
                await fs.unlink(imagePath);
            } catch (err) {
                console.warn('Erro ao excluir imagem do disco:', err);
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
