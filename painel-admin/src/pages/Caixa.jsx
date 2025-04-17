import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/CaixaDashboard.css';

const CaixaDashboard = () => {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'John Balaio | Caixa';

    const autorizado = localStorage.getItem('authCaixa') === 'true';
    if (!autorizado) {
      navigate('/caixa-login');
    } else {
      fetchMesas();
    }
  }, [navigate]);

  const fetchMesas = async () => {
    setLoading(true);
    try {
      // API retorna array de números (mesas ativas)
      const response = await axios.get('http://localhost:5000/api/pedidos/mesas');
      setMesas(response.data);
      setFeedback('');
    } catch (err) {
      console.error('Erro ao buscar mesas:', err);
      setFeedback('Erro ao buscar mesas.');
    } finally {
      setLoading(false);
    }
  };

  const handleMesaClick = (mesa) => {
    navigate(`/caixa/mesa/${mesa}`);
  };

  const marcarComoPago = async (mesa) => {
    try {
      // Busca pedidos e itens pendentes para a mesa
      const { data: pedidos } = await axios.get(`http://localhost:5000/api/pedidos/mesa/${mesa}`);

      // Extrai itens não pagos
      const itemIds = pedidos
        .flatMap(pedido => pedido.itens || [])
        .filter(item => !item.pago)
        .map(item => item.id);

      if (itemIds.length === 0) {
        setFeedback(`Nenhum item pendente para a mesa ${mesa}.`);
        return;
      }

      await axios.put('http://localhost:5000/api/pedidos/pagar', { itemIds });

      setFeedback(`Mesa ${mesa} paga com sucesso.`);
      fetchMesas();
    } catch (error) {
      console.error('Erro ao marcar pedido como pago:', error);
      setFeedback('Erro ao processar o pagamento.');
    }
  };

  return (
    <div className="caixa-container">
      <h1 className="caixa-title">Caixa - John Balaio</h1>

      {feedback && <div className="feedback">{feedback}</div>}

      {loading ? (
        <p className="mensagem">Carregando mesas...</p>
      ) : mesas.length === 0 ? (
        <p className="mensagem">Nenhuma mesa ativa no momento.</p>
      ) : (
        <div className="mesas-list">
          {mesas.map(mesa => (
            <div key={mesa} className="mesa-item">
              <button
                onClick={() => handleMesaClick(mesa)}
                className="mesa-button"
              >
                Mesa {mesa}
              </button>
              <button
                onClick={() => marcarComoPago(mesa)}
                className="btn-pagar"
              >
                Marcar como pago
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaixaDashboard;
