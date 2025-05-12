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

  const renderItens = (itens) => (
    <ul className="itens-lista">
      {itens.map(i => (
        <li key={i.id}>
          {i.quantidade}× {i.nome} {i.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          {i.observacao && <span className="obs"> (Obs: {i.observacao})</span>}
        </li>
      ))}
    </ul>
  );

  const renderPedidoCard = (pedido) => {
    const proximoStatus =
      pedido.status === 'pendente' ? 'Em preparo' :
      pedido.status === 'em_preparo' ? 'Pronto' : null;

    // Display status capitalizado
    const displayStatus = {
      pendente: 'Pendente',
      em_preparo: 'Em preparo',
      pronto: 'Pronto',
    }[pedido.status] || pedido.status;

    return (
      <div key={pedido.id} className="pedido-card">
        <p><strong>Mesa:</strong> {pedido.mesa}</p>
        <div>
          <strong>Itens:</strong>
          {renderItens(pedido.itens)}
        </div>
        <p>
          <strong>Status:</strong>{' '}
          <span className={`status-tag ${pedido.status.replace('_','-')}`}>
            {displayStatus}
          </span>
        </p>
        {proximoStatus && (
          <div className="botoes">
            <button
              type="button"
              className={`btn ${proximoStatus === 'Em preparo' ? 'amarelo' : 'verde'}`}
              onClick={() => atualizarStatus(pedido.id, proximoStatus)}
            >
              {proximoStatus}
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
