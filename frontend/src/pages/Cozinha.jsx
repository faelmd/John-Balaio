import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Cozinha.css';

const Cozinha = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  // ✅ Verificação de autenticação
  useEffect(() => {
    const autorizado = localStorage.getItem('authCozinha') === 'true';
    if (!autorizado) navigate('/cozinha-login');
  }, [navigate]);

  // ✅ Buscar pedidos periodicamente
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

  // 🔥 Atualizar status de um ITEM
  const atualizarStatus = async (itemId, novoStatusLabel) => {
    let status;
    let cozinheiro = '';

    if (novoStatusLabel === 'Em preparo') {
      cozinheiro = prompt('Digite o nome do cozinheiro:');
      if (!cozinheiro) return;
      status = 'em_preparo';
    } else if (novoStatusLabel === 'Pronto') {
      const confirmar = window.confirm('Confirma que o item está PRONTO?');
      if (!confirmar) return;
      status = 'pronto';
    }

    try {
      await axios.put(`http://localhost:5000/api/itens/${itemId}/status`, {
        status,
        cozinheiro,
      });

      // Atualiza localmente o status do item
      setPedidos(prevPedidos =>
        prevPedidos.map(pedido => ({
          ...pedido,
          itens: pedido.itens.map(item =>
            item.id === itemId
              ? { ...item, status, cozinheiro: cozinheiro || item.cozinheiro }
              : item
          )
        }))
      );
    } catch (error) {
      console.error('Erro ao atualizar status do item:', error);
      setErro('Erro ao atualizar status do item. Tente novamente.');
    }
  };

  const pedidosPorStatus = {
    Pendentes: pedidos.filter(p =>
      p.itens?.some(item => item.status === 'pendente')
    ),
    'Em Preparo': pedidos.filter(p =>
      p.itens?.some(item => item.status === 'em_preparo')
    ),
    Prontos: pedidos.filter(p =>
      p.itens?.every(item => item.status === 'pronto')
    ),
  };

  const renderPedidoCard = (pedido) => (
    <div key={pedido.id} className="pedido-card">
      <p><strong>Mesa:</strong> {pedido.mesa}</p>
      <p><strong>Itens:</strong></p>
      <ul>
        {Array.isArray(pedido.itens) && pedido.itens.length > 0 ? (
          pedido.itens.map(item => (
            <li key={item.id}>
              🍽️ <strong>{item.nome_produto}</strong> ({item.quantidade}){' '}
              <span className={`status-tag ${item.status}`}>
                {item.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
              <div className="botoes">
                {item.status === 'pendente' && (
                  <button
                    className="btn amarelo"
                    onClick={() => atualizarStatus(item.id, 'Em preparo')}
                  >
                    Em preparo
                  </button>
                )}
                {item.status === 'em_preparo' && (
                  <button
                    className="btn verde"
                    onClick={() => atualizarStatus(item.id, 'Pronto')}
                  >
                    Pronto
                  </button>
                )}
              </div>
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
