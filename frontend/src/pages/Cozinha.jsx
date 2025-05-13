import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Cozinha.css';

const Cozinha = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  // Verificação de autenticação
  useEffect(() => {
    const autorizado = localStorage.getItem('authCozinha') === 'true';
    if (!autorizado) navigate('/cozinha-login');
  }, [navigate]);

  // Buscar pedidos periodicamente
  useEffect(() => {
    fetchPedidos(); // buscar imediatamente ao carregar
    const interval = setInterval(fetchPedidos, 5000);
    return () => clearInterval(interval);
  }, []);

  // Atualizar título da aba
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
      setErro(null);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setErro('Erro ao buscar pedidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (id, novoStatusLabel) => {
    let nome_cozinheiro = '';
    let novoStatus;

    // Mapeamento de status do botão para o formato esperado pelo backend
    if (novoStatusLabel === 'Em preparo') {
      nome_cozinheiro = prompt('Digite o nome do cozinheiro:');
      if (!nome_cozinheiro) return;
      novoStatus = 'em_preparo';
    } else if (novoStatusLabel === 'Pronto') {
      const confirmar = window.confirm('Tem certeza que deseja marcar como Pronto?');
      if (!confirmar) return;
      novoStatus = 'pronto';
    }

    try {
      const response = await axios.put(`http://localhost:5000/api/pedidos/${id}`, {
        nome_cozinheiro,
      });

      if (response.status === 200) {
        // Atualizar status localmente
        setPedidos(prevPedidos =>
          prevPedidos.map(p =>
            p.id === id ? { ...p, status: novoStatus, nome_cozinheiro } : p
          )
        );
      }
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      setErro('Erro ao atualizar status do pedido. Tente novamente.');
    }
  };

  const pedidosPorStatus = {
    Pendentes: pedidos.filter(p => p.status === 'pendente'),
    'Em Preparo': pedidos.filter(p => p.status === 'em_preparo'),
    Prontos: pedidos.filter(p => p.status === 'pronto'),
  };

const renderPedidoCard = (pedido) => (
  <div key={pedido.id} className="pedido-card">
    <p><strong>Mesa:</strong> {pedido.mesa}</p>
    <p><strong>Itens:</strong>{' '}
      {Array.isArray(pedido.itens) && pedido.itens.length > 0 ? (
        pedido.itens.map(item => (
          <span key={item.id}>{item.nome_produto} ({item.quantidade}) </span>
        ))
      ) : (
        <span>Nenhum item</span>
      )}
    </p>
    <p>
      <strong>Status:</strong>{' '}
      <span className={`status-tag ${pedido.status}`}>
        {pedido.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
      </span>
    </p>
    {pedido.nome_cozinheiro && (
      <p><strong>Cozinheiro:</strong> {pedido.nome_cozinheiro}</p>
    )}

    <div className="botoes">
      {pedido.status === 'pendente' && (
        <button className="btn amarelo" onClick={() => atualizarStatus(pedido.id, 'Em preparo')}>
          Em preparo
        </button>
      )}
      {pedido.status === 'em_preparo' && (
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
