import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Bar.css';

const STATUS_COLUNAS = ['Pendente', 'Em preparo', 'Pronto'];

const Bar = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const autorizado = localStorage.getItem('authBar') === 'true';
    if (!autorizado) {
      navigate('/login?perfil=bar');
    } else {
      fetchPedidos();
    }
  }, [navigate]);

  useEffect(() => {
    document.title = 'John Balaio | Bar';
  }, []);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      // Agora sem precisa de query string extra, já que o router só aceita bar
      const response = await axios.get('http://localhost:5000/api/bar?origem=bar');
      setPedidos(response.data);
      setErro('');
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setErro('Erro ao carregar pedidos. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/pedidos/${id}`, {
        status,
        cozinheiro: null,
      });
      setFeedback(`Pedido #${id} atualizado para ${status}`);
      fetchPedidos();
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      setFeedback('Erro ao atualizar o pedido. Tente novamente mais tarde.');
    }
  };

  const renderPedidoCard = (pedido) => {
    const proximoStatus =
      pedido.status === 'pendente' ? 'em_preparo' :
        pedido.status === 'em_preparo' ? 'pronto' : null;

    const displayStatus = {
      pendente: 'Pendente',
      em_preparo: 'Em preparo',
      pronto: 'Pronto',
    }[pedido.status] || pedido.status;

    return (
      <div key={pedido.id} className="pedido-card">
        <p><strong>Mesa:</strong> {pedido.mesa}</p>
        <p><strong>Itens:</strong></p>
        <ul>
          {Array.isArray(pedido.itens) && pedido.itens.length > 0 ? (
            pedido.itens.map(item => (
              <li key={item.id || item.item_id}>
                🍽️ <strong>{item.nome_produto}</strong> ({item.quantidade})
              </li>
            ))
          ) : (
            <li>Nenhum item</li>
          )}
        </ul>
        {pedido.observacao && (
          <p><span className="observacao">📝 <em>{pedido.observacao}</em></span></p>
        )}
        <p>
          <strong>Hora:</strong>{' '}
          {new Date(pedido.criado_em).toLocaleString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
          })}
        </p>

        <p>
          <strong>Status:</strong>{' '}
          <span className={`status-tag ${pedido.status.replace('_', '-')}`}>
            {displayStatus}
          </span>
        </p>

        {proximoStatus && (
          <div className="botoes">
            <button
              type="button"
              className={`btn ${proximoStatus === 'em_preparo' ? 'amarelo' : 'verde'}`}
              onClick={() => atualizarStatus(pedido.id, proximoStatus)}
            >
              {displayStatus === 'Pendente' ? 'Em preparo' : 'Pronto'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bar-container">
      <h1 className="titulo">Pedidos do Bar</h1>

      {feedback && <div className="feedback">{feedback}</div>}
      {erro && <div className="erro">{erro}</div>}

      {loading ? (
        <p>Carregando pedidos...</p>
      ) : (
        <div className="colunas">
          {STATUS_COLUNAS.map(status => (
            <div className="coluna" key={status}>
              <h2 className="subtitulo">{status}</h2>
              {pedidos
                .filter(p => {
                  const st = p.status.toLowerCase();
                  return (
                    (status === 'Pendente' && st === 'pendente') ||
                    (status === 'Em preparo' && st === 'em_preparo') ||
                    (status === 'Pronto' && st === 'pronto')
                  );
                })
                .map(renderPedidoCard)
                .reverse() /* opcional: inverte a ordem se quiser os mais antigos embaixo */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bar;
