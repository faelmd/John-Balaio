import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Cozinha.css';

const Cozinha = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  //const origem = 'cozinha'; // <- origem dinâmica

  // Verificação de autenticação
  useEffect(() => {
    const autorizado = localStorage.getItem('authCozinha') === 'true';
    if (!autorizado) navigate('/cozinha-login');
  }, [navigate]);

  // Buscar pedidos periodicamente
  useEffect(() => {
    fetchPedidos(); // buscar imediatamente ao carregar

    const interval = setInterval(() => {
      fetchPedidos(); // atualizar a cada 5 segundos
    }, 5000);

    return () => clearInterval(interval);
  }, []);


  // Atualizar título da página
  useEffect(() => {
    document.title = 'John Balaio | Cozinha';
  }, []);

  const fetchPedidos = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/pedidos?origem=cozinha`);
      const pedidosOrdenados = data.sort(
        (a, b) => new Date(a.criado_em) - new Date(b.criado_em)
      );
      setPedidos(pedidosOrdenados);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setErro('Erro ao buscar pedidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (id, novoStatus) => {
    let cozinheiro = '';

    if (novoStatus === 'Em preparo') {
      cozinheiro = prompt('Digite o nome do cozinheiro:');
      if (!cozinheiro) return;
    }

    if (novoStatus === 'Pronto') {
      const confirmar = window.confirm('Tem certeza que deseja marcar como Pronto?');
      if (!confirmar) return;
    }

    try {
      await axios.put(`http://localhost:5000/api/pedidos/${id}`, {
        status: novoStatus,
        cozinheiro,
      });
      fetchPedidos(); // Atualizar lista de pedidos
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      setErro('Erro ao atualizar status do pedido. Tente novamente.');
    }
  };

  const pedidosPorStatus = {
    Pendentes: pedidos.filter(p => p.status === 'Pendente'),
    'Em Preparo': pedidos.filter(p => p.status === 'Em preparo'),
    Prontos: pedidos.filter(p => p.status === 'Pronto'),
  };

  const renderPedidoCard = (pedido) => (
    <div key={pedido.id} className="pedido-card">
      <p><strong>Mesa:</strong> {pedido.mesa}</p>
      <p><strong>Itens:</strong> {pedido.itens}</p>
      <p>
        <strong>Status:</strong>{' '}
        <span className={`status-tag ${pedido.status.toLowerCase().replace(' ', '-')}`}>
          {pedido.status}
        </span>
      </p>
      {pedido.cozinheiro && <p><strong>Cozinheiro:</strong> {pedido.cozinheiro}</p>}

      <div className="botoes">
        {pedido.status === 'Pendente' && (
          <button className="btn amarelo" onClick={() => atualizarStatus(pedido.id, 'Em preparo')}>
            Em preparo
          </button>
        )}
        {pedido.status === 'Em preparo' && (
          <button className="btn verde" onClick={() => atualizarStatus(pedido.id, 'Pronto')}>
            Pronto
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="cozinha-container">
      <h1 className="titulo">Pedidos da Cozinha</h1>

      {erro && <p className="erro">{erro}</p>}

      {loading ? (
        <p>Carregando pedidos...</p>
      ) : (
        <div className="colunas">
          {Object.entries(pedidosPorStatus).map(([status, lista]) => (
            <div key={status} className="coluna">
              <h2 className="subtitulo">{status}</h2>
              {lista.length > 0 ? lista.map(renderPedidoCard) : <p>Nenhum pedido.</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Cozinha;
