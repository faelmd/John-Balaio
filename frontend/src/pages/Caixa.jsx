import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/CaixaDashboard.css';

const CaixaDashboard = () => {
  const [mesasAbertas, setMesasAbertas] = useState([]);
  const [mesasPagas, setMesasPagas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'John Balaio | Caixa';
    const autorizado = localStorage.getItem('authCaixa') === 'true';
    if (!autorizado) navigate('/caixa-login');
    else fetchMesas();
  }, [navigate]);

  const fetchMesas = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:5000/api/pedidos/mesas');
      const abertas = data.filter(m => m.status === 'aberta');
      const pagas = data.filter(m => m.status === 'paga');
      setMesasAbertas(abertas);
      setMesasPagas(pagas);
      setFeedback('');
    } catch (err) {
      console.error('Erro ao buscar mesas:', err);
      setFeedback('Erro ao buscar mesas.');
    } finally {
      setLoading(false);
    }
  };

  const handleMesaClick = (mesa) => {
    navigate(`/caixa/mesa/${mesa.mesa}`);
  };

  const renderMesaList = (lista) => (
    <div className="mesas-list">
      {lista.map((mesa) => (
        <div key={mesa.mesa} className="mesa-item">
          <button
            onClick={() => handleMesaClick(mesa)}
            className="mesa-button"
          >
            Mesa {mesa.mesa}
            <br />
            <small>
              Abertura: {new Date(mesa.abertura).toLocaleString('pt-BR')}
              {mesa.fechamento && (
                <><br />Fechamento: {new Date(mesa.fechamento).toLocaleString('pt-BR')}</>
              )}
            </small>
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="caixa-container">
      <h1 className="caixa-title">Painel do Caixa</h1>
      {feedback && <div className="feedback">{feedback}</div>}

      {loading ? (
        <p>Carregando mesas...</p>
      ) : (
        <>
          <h2>Mesas Abertas</h2>
          {mesasAbertas.length ? renderMesaList(mesasAbertas) : <p>Nenhuma mesa aberta.</p>}

          <h2>Mesas Pagas</h2>
          {mesasPagas.length ? renderMesaList(mesasPagas) : <p>Nenhuma mesa paga.</p>}
        </>
      )}
    </div>
  );
};

export default CaixaDashboard;
