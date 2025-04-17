const db = require('../db');

// Criar um novo pedido
exports.criarPedido = async (req, res) => {
    const { mesa, itens } = req.body;

    if (!mesa || typeof mesa !== 'number' || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ message: 'Mesa e itens são obrigatórios.' });
    }

    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        const [pedidoResult] = await connection.query(
            'INSERT INTO pedidos (mesa, status, created_at) VALUES (?, ?, NOW())',
            [mesa, 'Pendente']
        );
        const pedidoId = pedidoResult.insertId;

        const itemQueries = itens.map(item => {
            return connection.query(
                'INSERT INTO itens_pedido (pedido_id, nome, quantidade, observacao, pago) VALUES (?, ?, ?, ?, ?)',
                [pedidoId, item.nome, item.quantidade, item.observacao || '', false]
            ).catch(err => {
                throw new Error('Erro ao inserir item');
            });
        });

        await Promise.all(itemQueries);
        await connection.commit();

        res.status(201).json({ message: 'Pedido criado com sucesso!' });
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao criar pedido:', error.message);
        res.status(500).json({ message: 'Erro ao criar pedido.' });
    } finally {
        connection.release();
    }
};

// Listar todos os pedidos com itens
exports.listarPedidos = async (req, res) => {
    try {
        const [pedidos] = await db.promise().query(
            'SELECT * FROM pedidos ORDER BY created_at ASC'
        );

        const pedidosComItens = await Promise.all(
            pedidos.map(async pedido => {
                const [itens] = await db.promise().query(
                    'SELECT * FROM itens_pedido WHERE pedido_id = ?',
                    [pedido.id]
                );
                return { ...pedido, itens };
            })
        );

        res.json(pedidosComItens);
    } catch (error) {
        console.error('Erro ao listar pedidos:', error.message);
        res.status(500).json({ message: 'Erro ao listar pedidos.' });
    }
};

// Marcar pedido como "Em preparo" e registrar cozinheiro
exports.marcarComoEmPreparo = async (req, res) => {
    const { id } = req.params;
    const { cozinheiro } = req.body;

    if (!cozinheiro) {
        return res.status(400).json({ message: 'Cozinheiro é obrigatório.' });
    }

    try {
        const [pedido] = await db.promise().query('SELECT * FROM pedidos WHERE id = ?', [id]);

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }

        await db.promise().query(
            'UPDATE pedidos SET status = ?, cozinheiro = ? WHERE id = ?',
            ['Em preparo', cozinheiro, id]
        );
        res.json({ message: 'Pedido marcado como "Em preparo".' });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error.message);
        res.status(500).json({ message: 'Erro ao atualizar pedido.' });
    }
};

// Marcar pedido como "Pronto"
exports.marcarComoPronto = async (req, res) => {
    const { id } = req.params;

    try {
        const [pedido] = await db.promise().query('SELECT * FROM pedidos WHERE id = ?', [id]);

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }

        if (pedido.status !== 'Em preparo') {
            return res.status(400).json({ message: 'O pedido precisa estar "Em preparo" para ser marcado como "Pronto".' });
        }

        await db.promise().query(
            'UPDATE pedidos SET status = ? WHERE id = ?',
            ['Pronto', id]
        );
        res.json({ message: 'Pedido marcado como "Pronto".' });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error.message);
        res.status(500).json({ message: 'Erro ao atualizar pedido.' });
    }
};

// Pagar itens específicos
exports.pagarItens = async (req, res) => {
    const { itens } = req.body;

    if (!Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ message: 'Lista de itens é obrigatória.' });
    }

    try {
        const [itensExistentes] = await db.promise().query(
            'SELECT id FROM itens_pedido WHERE id IN (?)',
            [itens]
        );

        if (itensExistentes.length !== itens.length) {
            return res.status(404).json({ message: 'Alguns itens não foram encontrados.' });
        }

        const updatePromises = itens.map(itemId =>
            db.promise().query('UPDATE itens_pedido SET pago = ? WHERE id = ?', [true, itemId])
        );

        await Promise.all(updatePromises);

        res.json({ message: 'Itens marcados como pagos.' });
    } catch (error) {
        console.error('Erro ao pagar itens:', error.message);
        res.status(500).json({ message: 'Erro ao pagar itens.' });
    }
};

// Listar pedidos por mesa com separação de itens pagos e não pagos
exports.listarPedidosPorMesa = async (req, res) => {
    const { mesa } = req.params;

    try {
        const [pedidos] = await db.promise().query(
            'SELECT * FROM pedidos WHERE mesa = ? ORDER BY created_at ASC',
            [mesa]
        );

        const pedidosDetalhados = await Promise.all(
            pedidos.map(async pedido => {
                const [itens] = await db.promise().query(
                    'SELECT * FROM itens_pedido WHERE pedido_id = ?',
                    [pedido.id]
                );

                const itensPagos = itens.filter(item => item.pago);
                const itensNaoPagos = itens.filter(item => !item.pago);

                return {
                    ...pedido,
                    itens_pagos: itensPagos,
                    itens_nao_pagos: itensNaoPagos
                };
            })
        );

        res.json(pedidosDetalhados);
    } catch (error) {
        console.error('Erro ao listar pedidos por mesa:', error.message);
        res.status(500).json({ message: 'Erro ao buscar pedidos da mesa.' });
    }
};
