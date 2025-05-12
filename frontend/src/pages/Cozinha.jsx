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
      setErro(null); // Limpar erro caso a requisição seja bem-sucedida
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setErro('Erro ao buscar pedidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (id, novoStatus) => {
    let nome_cozinheiro = '';

    if (novoStatus === 'Em preparo') {
      nome_cozinheiro = prompt('Digite o nome do cozinheiro:');
      if (!nome_cozinheiro) return;
    }

    if (novoStatus === 'Pronto') {
      const confirmar = window.confirm('Tem certeza que deseja marcar como Pronto?');
      if (!confirmar) return;
    }

    try {
      const response = await axios.put(`http://localhost:5000/api/pedidos/${id}`, {
        status: novoStatus,
        nome_cozinheiro,
      });
      
      if (response.status === 200) {
        // Atualiza o pedido no frontend sem fazer nova requisição
        setPedidos(prevPedidos =>
          prevPedidos.map(pedido =>
            pedido.pedido_id === id ? { ...pedido, status: novoStatus, nome_cozinheiro } : pedido
          )
        );
      }
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      setErro('Erro ao atualizar status do pedido. Tente novamente.');
    }
  };

  // Filtragem de pedidos por status
  const pedidosPorStatus = {
    Pendentes: pedidos.filter(p => p.status === 'Pendente'),
    'Em Preparo': pedidos.filter(p => p.status === 'Em preparo'),
    Prontos: pedidos.filter(p => p.status === 'Pronto'),
  };

  const renderPedidoCard = (pedido) => (
    <div key={pedido.pedido_id} className="pedido-card">
      <p><strong>Mesa:</strong> {pedido.mesa}</p>
      <p><strong>Itens:</strong> {pedido.itens.map(item => (
        <span key={item.item_id}>{item.nome_produto} ({item.quantidade})</span>
      ))}</p>
      <p>
        <strong>Status:</strong>{' '}
        <span className={`status-tag ${pedido.status.toLowerCase().replace(' ', '-')}`}>
          {pedido.status}
        </span>
      </p>
      {pedido.nome_cozinheiro && <p><strong>Cozinheiro:</strong> {pedido.nome_cozinheiro}</p>}

      <div className="botoes">
        {pedido.status === 'Pendente' && (
          <button className="btn amarelo" onClick={() => atualizarStatus(pedido.pedido_id, 'Em preparo')}>
            Em preparo
          </button>
        )}
        {pedido.status === 'Em preparo' && (
          <button className="btn verde" onClick={() => atualizarStatus(pedido.pedido_id, 'Pronto')}>
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
