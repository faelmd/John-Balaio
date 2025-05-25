const db = require('../db');

// Criar um novo pedido
exports.criarPedido = async (req, res) => {
    const { mesa, itens, observacao } = req.body;

    if (!mesa || typeof mesa !== 'number' || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ message: 'Mesa e itens são obrigatórios.' });
    }

    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        const [pedidoResult] = await connection.query(
            'INSERT INTO pedidos (mesa, status, origem, observacao) VALUES (?, ?, ?, ?)',
            [mesa, 'pendente', 'cozinha', observacao || null] // pode ser dinâmico
        );
        const pedidoId = pedidoResult.insertId;

        const itemQueries = itens.map(async item => {
            if (!item.nome_produto) {
                throw new Error('Cada item deve ter nome_produto definido.');
            }

            const [[produtoResult]] = await connection.query(
                'SELECT origem FROM produtos WHERE nome = ?',
                [item.nome_produto]
            );

            if (!produtoResult) {
                throw new Error(`Produto "${item.nome_produto}" não encontrado na base.`);
            }

            return connection.query(
                `INSERT INTO itens_pedidos 
        (id_pedido, nome_produto, quantidade, preco_unitario, pago, origem, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    pedidoId,
                    item.nome_produto,
                    item.quantidade || 1,
                    item.preco_unitario || 0.0,
                    0,
                    produtoResult.origem,
                    'pendente' // status inicial do item
                ]
            );
        });

        await Promise.all(itemQueries);
        await connection.commit();

        res.status(201).json({ message: 'Pedido criado com sucesso!', pedidoId });
    } catch (error) {
        await connection.rollback();
        console.error('🚨 Erro ao criar pedido:', error.message);
        res.status(500).json({ message: 'Erro ao criar pedido.' });
    } finally {
        connection.release();
    }
};

// Listar todos os pedidos com seus itens
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

// Marcar pedido como "em_preparo" e registrar nome do cozinheiro
exports.marcarComoEmPreparo = async (req, res) => {
    const { id } = req.params;
    const { nome_cozinheiro } = req.body;

    if (!nome_cozinheiro) {
        return res.status(400).json({ message: 'Nome do cozinheiro é obrigatório.' });
    }

    try {
        const [results] = await db.promise().query('SELECT * FROM pedidos WHERE id = ?', [id]);

        if (!results.length) {
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }

        await db.promise().query(
            'UPDATE pedidos SET status = ?, nome_cozinheiro = ? WHERE id = ?',
            ['em_preparo', nome_cozinheiro, id]
        );

        // Atualiza também o status dos itens para "em_preparo"
        await db.promise().query(
            'UPDATE itens_pedidos SET status = ? WHERE id_pedido = ?',
            ['em_preparo', id]
        );

        res.json({ message: 'Pedido e itens marcados como "em_preparo".' });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error.message);
        res.status(500).json({ message: 'Erro ao atualizar pedido.' });
    }
};

// Marcar pedido como "pronto" — só se TODOS os itens estiverem "em_preparo"
exports.marcarComoPronto = async (req, res) => {
    const { id } = req.params;

    try {
        // Checar se o pedido existe
        const [pedidoResults] = await db.promise().query('SELECT * FROM pedidos WHERE id = ?', [id]);
        if (pedidoResults.length === 0) {
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }

        // Buscar status dos itens do pedido
        const [itens] = await db.promise().query(
            'SELECT status FROM itens_pedidos WHERE id_pedido = ?',
            [id]
        );

        if (itens.length === 0) {
            return res.status(400).json({ message: 'Pedido não possui itens.' });
        }

        // Verificar se TODOS os itens estão "em_preparo"
        const allEmPreparo = itens.every(item => item.status === 'em_preparo');

        if (!allEmPreparo) {
            return res.status(400).json({
                message: 'Todos os itens precisam estar "em_preparo" para marcar o pedido como "pronto".'
            });
        }

        // Atualizar status do pedido para "pronto"
        await db.promise().query(
            'UPDATE pedidos SET status = ? WHERE id = ?',
            ['pronto', id]
        );

        // Atualizar status dos itens para "pronto"
        await db.promise().query(
            'UPDATE itens_pedidos SET status = ? WHERE id_pedido = ?',
            ['pronto', id]
        );

        res.json({ message: 'Pedido e itens marcados como "pronto".' });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error.message);
        res.status(500).json({ message: 'Erro ao atualizar pedido.' });
    }
};

// Marcar itens como pagos
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
