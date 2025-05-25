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

  useEffect(() => {
    fetchPedidos();
    const interval = setInterval(fetchPedidos, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.title = 'John Balaio | Cozinha';
  }, []);

  const fetchPedidos = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/pedidos?origem=cozinha`);

      const pedidosComStatus = data.map(pedido => {
        const statusItens = pedido.itens.map(item => item.status);

        let status;
        if (statusItens.every(s => s === 'pronto')) {
          status = 'pronto';
        } else if (statusItens.some(s => s === 'em_preparo')) {
          status = 'em_preparo';
        } else {
          status = 'pendente';
        }

        return { ...pedido, status };
      });

      const pedidosOrdenados = pedidosComStatus.sort(
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

  const atualizarStatus = async (pedidoId, novoStatusLabel) => {
    let cozinheiro = '';
    let status;

    if (novoStatusLabel === 'Em preparo') {
      cozinheiro = prompt('Digite o nome do cozinheiro:');
      if (!cozinheiro) return;
      status = 'em_preparo';
    } else if (novoStatusLabel === 'Pronto') {
      const confirmar = window.confirm('Tem certeza que deseja marcar como Pronto?');
      if (!confirmar) return;
      status = 'pronto';

      const pedido = pedidos.find(p => p.id === pedidoId);
      cozinheiro = pedido?.cozinheiro || pedido?.nome_cozinheiro || '';
    }

    try {
      await axios.put(`http://localhost:5000/api/pedidos/${pedidoId}`, {
        status,
        cozinheiro
      });

      setPedidos(prevPedidos =>
        prevPedidos.map(p =>
          p.id === pedidoId ? { ...p, status, nome_cozinheiro: cozinheiro } : p
        )
      );
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
      <p><strong>Itens:</strong></p>
      <ul>
        {Array.isArray(pedido.itens) && pedido.itens.length > 0 ? (
          pedido.itens.map(item => (
            <li key={item.id}>
              🍽️ <strong>{item.nome_produto}</strong> ({item.quantidade})
              {item.observacao && (
                <div className="obs">📝 {item.observacao}</div>
              )}
              <span className={`status-tag ${item.status}`}>
                {item.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
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
        {new Date(pedido.criado_em).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
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
          <button
            className="btn amarelo"
            onClick={() => atualizarStatus(pedido.id, 'Em preparo')}
          >
            Em preparo
          </button>
        )}
        {pedido.status === 'em_preparo' && (
          <button
            className="btn verde"
            onClick={() => atualizarStatus(pedido.id, 'Pronto')}
          >
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
