import React, { useEffect, useState, useCallback } from 'react';
import { API } from '../api';
import { useNavigate } from 'react-router-dom';
import '../styles/CaixaDashboard.css';

const CaixaDashboard = () => {
  const [mesasAbertas, setMesasAbertas] = useState([]);
  const [comprovantes, setComprovantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMesas = useCallback(async () => {
    try {
      const { data } = await API.get('/api/pedidos/mesas');
      const abertas = data.filter(m => m.status === 'aberta');
      setMesasAbertas(abertas);
    } catch (err) {
      console.error('❌ Erro ao buscar mesas:', err);
      alert('Erro ao buscar mesas.');
    }
  }, []);

  const fetchComprovantes = useCallback(async () => {
    try {
      const { data } = await API.get('/api/caixa/comprovantes');

      const hoje = new Date().toISOString().split('T')[0]; // exemplo: '2025-06-19'

      const comprovantesHoje = data.filter(file => {
        const match = file.match(/comprovante-mesa-\d+-(\d{4}-\d{2}-\d{2})T/);
        return match && match[1] === hoje;
      });

      const ordenados = comprovantesHoje.sort((a, b) => b.localeCompare(a));
      setComprovantes(ordenados);
    } catch (err) {
      console.error('❌ Erro ao buscar comprovantes:', err);
      alert('Erro ao buscar comprovantes.');
    }
  }, []);

  const fetchDados = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchMesas(), fetchComprovantes()]);
    setLoading(false);
  }, [fetchMesas, fetchComprovantes]);

  useEffect(() => {
    document.title = 'John Balaio | Caixa';
    const autorizado = localStorage.getItem('authCaixa') === 'true';
    if (!autorizado) navigate('/login?perfil=caixa');
    else {
    fetchDados();
    const interval = setInterval(fetchDados, 5000);
    return () => clearInterval(interval);
  }
  }, [navigate, fetchDados]);

  const handleMesaClick = (mesa) => {
    navigate(`/caixa/mesa/${mesa.mesa}`);
  };

  const downloadComprovante = async (file) => {
    try {
      const response = await fetch(`${API.defaults.baseURL}/comprovantes/${file}`);
      const blob = await response.blob();

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', file);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao baixar comprovante:', err);
    }
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
            </small>
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="caixa-container">
      <h1 className="caixa-title">Painel do Caixa</h1>

      <h2>Mesas Abertas</h2>
      {loading ? (
        <p>Carregando mesas...</p>
      ) : mesasAbertas.length > 0 ? (
        renderMesaList(mesasAbertas)
      ) : (
        <p>Nenhuma mesa aberta no momento.</p>
      )}

      <h2>Comprovantes de Mesas Encerradas</h2>
      {loading ? (
        <p>Carregando comprovantes...</p>
      ) : comprovantes.length === 0 ? (
        <p>Nenhum comprovante disponível.</p>
      ) : (
        <ul className="comprovantes-lista">
          {comprovantes.map(file => (
            <li key={file}>
              <button
                className="comprovante-button"
                onClick={() => downloadComprovante(file)}
              >
                📄 {file}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CaixaDashboard;
