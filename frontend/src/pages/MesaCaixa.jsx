// src/pages/MesaCaixa.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/MesaCaixa.css';

const MesaCaixa = () => {
  const { mesaId } = useParams();
  const navigate = useNavigate();
  const [itens, setItens] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItens = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`http://localhost:5000/api/caixa/mesa/${mesaId}`);
      setItens(data);
    } catch (err) {
      console.error('Erro ao buscar itens:', err);
      alert('Erro ao buscar itens da mesa.');
    } finally {
      setLoading(false);
    }
  }, [mesaId]);

  useEffect(() => {
    document.title = `Mesa ${mesaId} | Caixa`;
    fetchItens();
  }, [mesaId, fetchItens]);

  const toggleSelecionado = (itemId) => {
    setSelecionados(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const calcularTotal = () => {
    const selecionadosItens = itens.filter(item => selecionados.includes(item.id));
    return selecionadosItens
      .reduce((total, item) => total + parseFloat(item.preco_unitario) * item.quantidade, 0)
      .toFixed(2);
  };

  const confirmarPagamento = async () => {
    try {
      await axios.put('http://localhost:5000/api/caixa/pagar', {
        itemIds: selecionados,
      });
      alert('Pagamento registrado.');
      setSelecionados([]);
      fetchItens();
    } catch (err) {
      console.error('Erro ao pagar:', err);
      alert('Erro ao registrar pagamento.');
    }
  };

  const pagarTudo = async () => {
    try {
      await axios.post(`http://localhost:5000/api/caixa/pagar/${mesaId}`);
      alert('Conta paga por completo!');
      setSelecionados([]);
      fetchItens();
    } catch (err) {
      console.error('Erro ao pagar tudo:', err);
      alert('Erro ao pagar conta completa.');
    }
  };

  return (
    <div className="mesa-caixa-container">
      <h2>Mesa {mesaId}</h2>
      <button className="voltar" onClick={() => navigate('/caixa')}>← Voltar</button>

      {loading ? (
        <p>Carregando itens...</p>
      ) : itens.length === 0 ? (
        <p>Todos os itens foram pagos.</p>
      ) : (
        <>
          <ul className="itens-lista">
            {itens.map(item => (
              <li
                key={item.id}
                className={`item ${item.pago ? 'pago' : ''} ${selecionados.includes(item.id) ? 'selecionado' : ''}`}
              >
                <label>
                  <input
                    type="checkbox"
                    disabled={item.pago} // ⛔ não permite marcar se já foi pago
                    checked={selecionados.includes(item.id)}
                    onChange={() => toggleSelecionado(item.id)}
                  />
                  <strong>{item.nome_produto}</strong> - {item.quantidade}x R$ {item.preco_unitario}
                  {item.pago && <span className="status pago-tag">✔️ Pago</span>}
                </label>
              </li>
            ))}
          </ul>

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
        </>
      )}
    </div>
  );
};

export default MesaCaixa;
