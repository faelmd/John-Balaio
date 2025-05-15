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

      // Aqui você pode puxar o cozinheiro já salvo, se não estiver guardando:
      const pedido = pedidos.find(p => p.id === id);
      cozinheiro = pedido?.cozinheiro || pedido?.nome_cozinheiro || '';
    }

    console.log('Payload sendo enviado:', { status, cozinheiro }); // 👈 VERIFIQUE aqui

    try {
      const response = await axios.put(`http://localhost:5000/api/pedidos/${id}`, {
        status,
        cozinheiro
      });

      if (response.status === 200) {
        setPedidos(prevPedidos =>
          prevPedidos.map(p =>
            p.id === id ? { ...p, status, cozinheiro } : p
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
      <p><strong>Itens:</strong></p>
      <ul>
        {Array.isArray(pedido.itens) && pedido.itens.length > 0 ? (
          pedido.itens.map(item => (
            <li key={item.item_id || item.id}>
              🍽️ <strong>{item.nome_produto}</strong> ({item.quantidade})<br />
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
        })
        }
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
