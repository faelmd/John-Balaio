import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Cozinha.css';

const Cozinha = () => {
  const [pedidos, setPedidos] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const autorizado = localStorage.getItem('authCozinha') === 'true';
    if (!autorizado) navigate('/cozinha-login');
    else {
      fetchPedidos();
      const interval = setInterval(fetchPedidos, 5000);
      return () => clearInterval(interval);
    }
  }, [navigate]);

  useEffect(() => {
    document.title = 'John Balaio | Cozinha';
  }, []);

  const fetchPedidos = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/cozinha?origem=cozinha`);
      const pedidosOrdenados = (data ?? []).sort(
        (a, b) => new Date(a.criado_em) - new Date(b.criado_em)
      );
      setPedidos(pedidosOrdenados);
      setErro('');
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setErro('Erro ao buscar pedidos.');
    }
  };

  const atualizarStatus = async (itemId, status) => {
    let nome_cozinheiro = '';

    if (status === 'em_preparo') {
      nome_cozinheiro = prompt('Digite o nome do cozinheiro:');
      if (!nome_cozinheiro) return;
    }

    if (status === 'pronto') {
      const confirmar = window.confirm('Confirma que o item está PRONTO?');
      if (!confirmar) return;
    }

    try {
      await axios.put(`http://localhost:5000/api/pedidos/itens/${itemId}/status`, {
        status,
        nome_cozinheiro,
      });
      setFeedback(`Item #${itemId} atualizado para ${status.toUpperCase()}`);
      fetchPedidos();
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      setFeedback('Erro ao atualizar item.');
    }
  };

  const STATUS_COLUNAS = ['Pendentes', 'Em Preparo', 'Prontos'];

  const pedidosPorStatus = {
    Pendentes: pedidos.filter(p =>
      Array.isArray(p.itens) && p.itens.some(i => i.status === 'pendente')
    ),
    'Em Preparo': pedidos.filter(p =>
      Array.isArray(p.itens) && p.itens.some(i => i.status === 'em_preparo')
    ),
    Prontos: pedidos.filter(p =>
      Array.isArray(p.itens) && p.itens.length > 0 && p.itens.every(i => i.status === 'pronto')
    ),
  };

  const renderPedidoCard = (pedido) => (
    <div key={pedido.id} className="pedido-card">
      <p><strong>Mesa:</strong> {pedido.mesa}</p>
      <p><strong>Itens:</strong></p>
      <ul>
        {(pedido.itens ?? []).map(item => (
          <li key={item.id}>
            🍽️ <strong>{item.nome_produto}</strong> ({item.quantidade}){' '}
            <span className={`status-tag ${item.status}`}>
              {item.status.replace('_', ' ').toUpperCase()}
            </span>

            {/* 👨‍🍳 Mostrar nome do cozinheiro */}
            {item.nome_cozinheiro && (item.status === 'em_preparo' || item.status === 'pronto') && (
              <span className="cozinheiro-tag">👨‍🍳 {item.nome_cozinheiro}</span>
            )}

            <div className="botoes">
              {item.status === 'pendente' && (
                <button
                  className="btn amarelo"
                  onClick={() => atualizarStatus(item.id, 'em_preparo')}
                >
                  Em preparo
                </button>
              )}
              {item.status === 'em_preparo' && (
                <button
                  className="btn verde"
                  onClick={() => atualizarStatus(item.id, 'pronto')}
                >
                  Pronto
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {pedido.observacao && (
        <p><span className="observacao">📝 <em>{pedido.observacao}</em></span></p>
      )}
      <p><strong>Hora:</strong> {new Date(pedido.criado_em).toLocaleString('pt-BR')}</p>
    </div>
  );

  return (
    <div className="cozinha-container">
      <h1 className="titulo">Pedidos da Cozinha</h1>
      {feedback && <div className="feedback">{feedback}</div>}
      {erro && <div className="erro">{erro}</div>}

      <div className="colunas">
        {STATUS_COLUNAS.map(status => (
          <div key={status} className="coluna">
            <h2 className="subtitulo">{status}</h2>
            {pedidosPorStatus[status]?.length > 0
              ? pedidosPorStatus[status].map(renderPedidoCard)
              : <p>Nenhum pedido.</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cozinha;
