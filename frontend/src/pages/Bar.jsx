import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Bar.css';

const Bar = () => {
  const [pedidos, setPedidos] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const autorizado = localStorage.getItem('authBar') === 'true';
    if (!autorizado) navigate('/login?perfil=bar');
    else fetchPedidos();
  }, [navigate]);

  useEffect(() => {
    document.title = 'John Balaio | Bar';
  }, []);

  const fetchPedidos = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/bar?origem=bar');
      setPedidos(data);
      setErro('');
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setErro('Erro ao carregar pedidos.');
    }
  };

  const atualizarStatus = async (itemId, status) => {
    const confirmar = window.confirm(`Confirma atualizar o item #${itemId} para ${status.toUpperCase()}?`);
    if (!confirmar) return;

    try {
      await axios.put(`http://localhost:5000/api/pedidos/itens/${itemId}/status`, {
        status,
        nome_cozinheiro: null,
      });
      setFeedback(`Item #${itemId} atualizado para ${status}`);
      fetchPedidos();
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      setFeedback('Erro ao atualizar item.');
    }
  };

  const STATUS_COLUNAS = ['Pendentes', 'Em Preparo', 'Prontos'];

  const pedidosPorStatus = {
    Pendentes: pedidos.filter(p => p.itens.some(i => i.status === 'pendente')),
    'Em Preparo': pedidos.filter(p => p.itens.some(i => i.status === 'em_preparo')),
    Prontos: pedidos.filter(p => p.itens.every(i => i.status === 'pronto')),
  };

  const renderPedidoCard = (pedido) => (
    <div key={pedido.id} className="pedido-card">
      <p><strong>Mesa:</strong> {pedido.mesa}</p>
      <p><strong>Itens:</strong></p>
      <ul>
        {pedido.itens.map(item => (
          <li key={item.id}>
            🍺 <strong>{item.nome_produto}</strong> ({item.quantidade}){' '}
            <span className={`status-tag ${item.status}`}>
              {item.status.replace('_', ' ').toUpperCase()}
            </span>
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
    <div className="bar-container">
      <h1 className="titulo">Pedidos do Bar</h1>
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

export default Bar;
