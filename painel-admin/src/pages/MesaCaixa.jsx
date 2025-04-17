import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/MesaCaixa.css';

const MesaCaixa = () => {
  const { mesaId } = useParams();
  const navigate = useNavigate();
  const [itens, setItens] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `Mesa ${mesaId} | Caixa`;

    const fetchItens = async () => {
      try {
        const responsePedidos = await axios.get('http://localhost:5000/api/pedidos');
        const pedidoDaMesa = responsePedidos.data.find(p => p.mesa === parseInt(mesaId));

        if (!pedidoDaMesa) {
          setItens([]);
          return;
        }

        const responseItens = await axios.get(`http://localhost:5000/api/pedidos/itens/${pedidoDaMesa.id}`);
        setItens(responseItens.data.filter(item => !item.pago));
      } catch (err) {
        console.error('Erro ao buscar itens:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItens();
  }, [mesaId]);

  const toggleSelecionado = (itemId) => {
    setSelecionados(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const calcularTotal = () => {
    return itens
      .filter(item => selecionados.includes(item.id))
      .reduce((total, item) => total + parseFloat(item.preco) * item.quantidade, 0)
      .toFixed(2);
  };

  const confirmarPagamento = async () => {
    try {
      await axios.put('http://localhost:5000/api/pedidos/pagar', {
        itemIds: selecionados,
      });
      alert('Pagamento confirmado!');
      setSelecionados([]);
      setLoading(true);
      // Recarrega os itens
      const responsePedidos = await axios.get('http://localhost:5000/api/pedidos');
      const pedidoDaMesa = responsePedidos.data.find(p => p.mesa === parseInt(mesaId));

      if (!pedidoDaMesa) {
        setItens([]);
        return;
      }

      const responseItens = await axios.get(`http://localhost:5000/api/pedidos/itens/${pedidoDaMesa.id}`);
      setItens(responseItens.data.filter(item => !item.pago));
    } catch (err) {
      console.error('Erro ao confirmar pagamento:', err);
      alert('Erro ao confirmar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mesa-caixa-container">
      <h2>Mesa {mesaId}</h2>
      <button className="voltar" onClick={() => navigate('/caixa')}>← Voltar</button>

      {loading ? (
        <p>Carregando itens...</p>
      ) : itens.length === 0 ? (
        <p>Todos os itens já foram pagos.</p>
      ) : (
        <div>
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

          <div className="total">
            Total: R$ {calcularTotal()}
          </div>

          <button
            className="confirmar"
            onClick={confirmarPagamento}
            disabled={selecionados.length === 0}
          >
            Confirmar Pagamento
          </button>
        </div>
      )}
    </div>
  );
};

export default MesaCaixa;
