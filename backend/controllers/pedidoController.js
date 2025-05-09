const db = require('../db');

// Criar um novo pedido
exports.criarPedido = async (req, res) => {
    const { mesa, itens, origem } = req.body;

    if (!mesa || typeof mesa !== 'number' || !Array.isArray(itens) || itens.length === 0 || !origem) {
        return res.status(400).json({ message: 'Mesa, origem e itens são obrigatórios.' });
    }

    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        const [pedidoResult] = await connection.query(
            'INSERT INTO pedidos (mesa, status, origem) VALUES (?, ?, ?)',
            [mesa, 'pendente', origem]
        );
        const pedidoId = pedidoResult.insertId;

        const itemQueries = itens.map(item => {
            return connection.query(
                'INSERT INTO itens_pedidos (id_pedido, nome_produto, quantidade, preco_unitario, observacao, pago) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    pedidoId,
                    item.nome_produto,
                    item.quantidade,
                    item.preco_unitario || 0.0,
                    item.observacao || '',
                    0
                ]
            ).catch(err => {
                throw new Error('Erro ao inserir item: ' + err.message);
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
            'SELECT * FROM pedidos ORDER BY criado_em ASC'
        );

        const pedidosComItens = await Promise.all(
            pedidos.map(async pedido => {
                const [itens] = await db.promise().query(
                    'SELECT * FROM itens_pedidos WHERE id_pedido = ?',
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

// Marcar pedido como "em_preparo" e registrar cozinheiro
exports.marcarComoEmPreparo = async (req, res) => {
    const { id } = req.params;
    const { nome_cozinheiro } = req.body;

    if (!nome_cozinheiro) {
        return res.status(400).json({ message: 'Nome do cozinheiro é obrigatório.' });
    }

    try {
        const [results] = await db.promise().query('SELECT * FROM pedidos WHERE id = ?', [id]);
        const pedido = results[0];

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }

        await db.promise().query(
            'UPDATE pedidos SET status = ?, nome_cozinheiro = ? WHERE id = ?',
            ['em_preparo', nome_cozinheiro, id]
        );
        res.json({ message: 'Pedido marcado como "em_preparo".' });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error.message);
        res.status(500).json({ message: 'Erro ao atualizar pedido.' });
    }
};

// Marcar pedido como "pronto"
exports.marcarComoPronto = async (req, res) => {
    const { id } = req.params;

    try {
        const [results] = await db.promise().query('SELECT * FROM pedidos WHERE id = ?', [id]);
        const pedido = results[0];

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }

        if (pedido.status !== 'em_preparo') {
            return res.status(400).json({ message: 'O pedido precisa estar "em_preparo" para ser marcado como "pronto".' });
        }

        await db.promise().query(
            'UPDATE pedidos SET status = ? WHERE id = ?',
            ['pronto', id]
        );
        res.json({ message: 'Pedido marcado como "pronto".' });
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
        const updateQueries = itens.map(idItem =>
            db.promise().query('UPDATE itens_pedidos SET pago = 1 WHERE id = ?', [idItem])
        );

        await Promise.all(updateQueries);
        res.json({ message: 'Itens pagos com sucesso.' });
    } catch (error) {
        console.error('Erro ao pagar itens:', error.message);
        res.status(500).json({ message: 'Erro ao pagar itens.' });
    }
};
