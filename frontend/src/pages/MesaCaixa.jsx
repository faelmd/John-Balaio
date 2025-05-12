import React, { useEffect, useState, useCallback } from 'react'; // ⬅ adiciona useCallback
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/MesaCaixa.css';

const MesaCaixa = () => {
  const { mesaId } = useParams();
  const navigate = useNavigate();
  const [itensPorPedido, setItensPorPedido] = useState({});
  const [selecionados, setSelecionados] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⬇️ encapsula com useCallback para não recriar a função a cada render
  const fetchItens = useCallback(async () => {
    setLoading(true);
    try {
      const responsePedidos = await axios.get('http://localhost:5000/api/pedidos?origem=caixa');
      const pedidosDaMesa = responsePedidos.data.filter(p => p.mesa === parseInt(mesaId));

      if (!pedidosDaMesa.length) {
        setItensPorPedido({});
        return;
      }

      const responsesItens = await Promise.all(
        pedidosDaMesa.map(pedido =>
          axios.get(`http://localhost:5000/api/pedidos/itens/${pedido.id}`)
        )
      );

      const todosItens = responsesItens.flatMap((res, i) => {
        const pedidoId = pedidosDaMesa[i].id;
        return res.data
          .filter(item => !item.pago)
          .map(item => ({ ...item, pedido_id: pedidoId }));
      });

      const agrupados = {};
      todosItens.forEach(item => {
        if (!agrupados[item.pedido_id]) {
          agrupados[item.pedido_id] = [];
        }
        agrupados[item.pedido_id].push(item);
      });

      setItensPorPedido(agrupados);
    } catch (err) {
      console.error('Erro ao buscar itens:', err);
    } finally {
      setLoading(false);
    }
  }, [mesaId]); // ⬅ mesaId como dependência

  useEffect(() => {
    document.title = `Mesa ${mesaId} | Caixa`;
    fetchItens(); // ⬅ agora sem erro de dependência
  }, [mesaId, fetchItens]); // ⬅ fetchItens incluso

  const toggleSelecionado = (itemId) => {
    setSelecionados(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const calcularTotal = () => {
    const todosItens = Object.values(itensPorPedido).flat();
    const selecionadosItens = todosItens.filter(item => selecionados.includes(item.id));
    return selecionadosItens
      .reduce((total, item) => total + parseFloat(item.preco) * item.quantidade, 0)
      .toFixed(2);
  };

  const confirmarPagamento = async () => {
    try {
      await axios.put('http://localhost:5000/api/pedidos/pagar', {
        itemIds: selecionados,
      });
      alert('Pagamento confirmado!');
      atualizarItens();
    } catch (err) {
      console.error('Erro ao confirmar pagamento:', err);
      alert('Erro ao confirmar pagamento.');
    }
  };

  const pagarTudo = async () => {
    try {
      await axios.post(`http://localhost:5000/api/pedidos/pagar/${mesaId}`);
      alert('Conta paga por completo!');
      atualizarItens();
    } catch (err) {
      console.error('Erro ao pagar tudo:', err);
      alert('Erro ao pagar a conta.');
    }
  };

  const dividirConta = async () => {
    const partes = parseInt(prompt("Em quantas partes deseja dividir a conta?"));
    if (isNaN(partes) || partes <= 1) {
      alert('Informe um número válido maior que 1.');
      return;
    }

    try {
      await axios.post(`http://localhost:5000/api/pedidos/pagar-dividido/${mesaId}`, { partes });
      alert(`Conta dividida em ${partes} partes.`);
      atualizarItens();
    } catch (err) {
      console.error('Erro ao dividir conta:', err);
      alert('Erro ao dividir conta.');
    }
  };

  const atualizarItens = async () => {
    setSelecionados([]);
    await fetchItens();
  };

  return (
    <div className="mesa-caixa-container">
      <h2>Mesa {mesaId}</h2>
      <button className="voltar" onClick={() => navigate('/caixa')}>← Voltar</button>

      {loading ? (
        <p>Carregando itens...</p>
      ) : Object.keys(itensPorPedido).length === 0 ? (
        <p>Todos os itens já foram pagos.</p>
      ) : (
        <div>
          {Object.entries(itensPorPedido).map(([pedidoId, itens]) => (
            <div key={pedidoId} className="pedido-bloco">
              <h3>Pedido #{pedidoId}</h3>
              <ul className="itens-lista">
                {itens.map(item => (
                  <li key={item.id} className={`item ${selecionados.includes(item.id) ? 'selecionado' : ''}`}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selecionados.includes(item.id)}
                        onChange={() => toggleSelecionado(item.id)}
                      />
                      <strong>{item.nome}</strong> - {item.quantidade}x R$ {item.preco}
                      {item.observacao && <div className="obs">Obs: {item.observacao}</div>}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="total">
            Total Selecionado: R$ {calcularTotal()}
          </div>

          <button
            className="confirmar"
            onClick={confirmarPagamento}
            disabled={selecionados.length === 0}
          >
            Confirmar Pagamento
          </button>

          <button className="pagar-tudo" onClick={pagarTudo}>
            Pagar Conta Inteira
          </button>

          <button className="dividir-conta" onClick={dividirConta}>
            Dividir Conta
          </button>
        </div>
      )}
    </div>
  );
};

export default MesaCaixa;
