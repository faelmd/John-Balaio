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
            'INSERT INTO pedidos (mesa, origem, observacao) VALUES (?, ?, ?)',
            [mesa, 'cozinha', observacao || null] // ou use req.body.origem se desejar
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
                    'pendente' // Status inicial diretamente nos itens
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

// Listar todos os pedidos com seus itens e status dos itens
exports.listarPedidos = async (req, res) => {
    try {
        const [pedidos] = await db.promise().query(
            'SELECT * FROM pedidos ORDER BY criado_em ASC'
        );

        const pedidosComItens = await Promise.all(
            pedidos.map(async pedido => {
                const [itens] = await db.promise().query(
                    `
                    SELECT id, nome_produto, quantidade, status, nome_cozinheiro 
                    FROM itens_pedidos 
                    WHERE id_pedido = ?
                    `,
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

// Marcar itens de um pedido como "em_preparo" e registrar nome do cozinheiro
exports.marcarComoEmPreparo = async (req, res) => {
  const { id } = req.params;
  const { nome_cozinheiro } = req.body;

  if (!nome_cozinheiro) {
    return res.status(400).json({ message: 'Nome do cozinheiro é obrigatório.' });
  }

  try {
    const [results] = await db.promise().query(
      'SELECT * FROM pedidos WHERE id = ?',
      [id]
    );

    if (!results.length) {
      return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    // 🔥 Atualiza nome do cozinheiro no pedido (opcional)
    await db.promise().query(
      'UPDATE pedidos SET nome_cozinheiro = ? WHERE id = ?',
      [nome_cozinheiro, id]
    );

    // 🔥 Atualiza status dos itens + nome do cozinheiro nos itens
    await db.promise().query(
      'UPDATE itens_pedidos SET status = ?, nome_cozinheiro = ? WHERE id_pedido = ?',
      ['em_preparo', nome_cozinheiro, id]
    );

    res.json({ message: 'Itens do pedido marcados como "em_preparo".' });
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error.message);
    res.status(500).json({ message: 'Erro ao atualizar pedido.' });
  }
};

// Marcar itens de um pedido como "pronto"
exports.marcarComoPronto = async (req, res) => {
    const { id } = req.params;

    try {
        const [itens] = await db.promise().query(
            'SELECT * FROM itens_pedidos WHERE id_pedido = ?',
            [id]
        );

        if (!itens.length) {
            return res.status(404).json({ message: 'Itens do pedido não encontrados.' });
        }

        const algumEmPreparo = itens.some(item => item.status === 'em_preparo');

        if (!algumEmPreparo) {
            return res.status(400).json({
                message: 'O pedido precisa ter itens em "em_preparo" para serem marcados como "pronto".'
            });
        }

        await db.promise().query(
            'UPDATE itens_pedidos SET status = ? WHERE id_pedido = ? AND status = ?',
            ['pronto', id, 'em_preparo']
        );

        res.json({ message: 'Itens do pedido marcados como "pronto".' });
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

//--------------------------------------------PARTES QUE O ARTHUR MUDOU:


module.exports.criarPedidoHandler = async function (req, res, body) {
  try {
    const { mesa, observacao, itens } = JSON.parse(body);

    if (!mesa || !Array.isArray(itens) || itens.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ erro: 'Informe a mesa e os itens corretamente.' }));
    }

    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const [pedidoResult] = await conn.execute(
        'INSERT INTO pedidos (mesa, observacao) VALUES (?, ?)',
        [mesa, observacao || null]
      );

      const idPedido = pedidoResult.insertId;

      for (const { nome_produto, quantidade, preco_unitario, origem } of itens) {
        if (!nome_produto || !quantidade || !preco_unitario || !origem) {
          throw new Error('Item inválido. Campos obrigatórios ausentes.');
        }

        await conn.execute(
          `INSERT INTO itens_pedidos 
           (id_pedido, nome_produto, quantidade, preco_unitario, origem) 
           VALUES (?, ?, ?, ?, ?)`,
          [idPedido, nome_produto, quantidade, preco_unitario, origem]
        );
      }

      await conn.commit();

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ mensagem: 'Pedido criado com sucesso!', id_pedido: idPedido }));
    } catch (err) {
      await conn.rollback();
      console.error('Erro durante transação:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ erro: 'Erro ao processar o pedido.' }));
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Erro no controller/service:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ erro: 'Erro inesperado no servidor.' }));
  }
};
