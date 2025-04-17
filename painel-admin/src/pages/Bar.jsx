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
    }
  }, [navigate]);

  useEffect(() => {
    document.title = 'John Balaio | Bar';
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/pedidos?origem=bar');
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
    const proximoStatus = pedido.status === 'Pendente' ? 'Em preparo' :
                          pedido.status === 'Em preparo' ? 'Pronto' : null;

    return (
      <div key={pedido.id} className="pedido-card">
        <p><strong>Mesa:</strong> {pedido.mesa}</p>
        <p><strong>Itens:</strong> {pedido.itens}</p>
        <p><strong>Status:</strong> <span className="text-orange-500">{pedido.status}</span></p>
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

  const renderColunaPedidos = (status) => {
    const pedidosFiltrados = pedidos.filter(p => p.status === status);

    return (
      <div className="coluna" key={status}>
        <h2 className="subtitulo">{status}</h2>
        {pedidosFiltrados.length > 0 ? pedidosFiltrados.map(renderPedidoCard) : <p>Nenhum.</p>}
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
          {STATUS_COLUNAS.map(renderColunaPedidos)}
        </div>
      )}
    </div>
  );
};

export default Bar;
