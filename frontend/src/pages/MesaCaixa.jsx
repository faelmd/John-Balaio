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
    setSelecionados((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const calcularTotal = () => {
    const selecionadosItens = itens.filter((item) => selecionados.includes(item.id));
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
      const res = await axios.post(`http://localhost:5000/api/caixa/pagar/${mesaId}`);
      alert(`Pagamento confirmado. Comprovante gerado: ${res.data.arquivo}`);

      // 🔥 Iniciar download automático do comprovante
      const url = `http://localhost:5000/api/comprovantes/${res.data.arquivo}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = res.data.arquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSelecionados([]);
      fetchItens();
    } catch (err) {
      console.error('Erro ao pagar tudo:', err);
      alert('Erro ao pagar conta completa.');
    }
  };


  //const podePagar = (item) => item.status === 'pronto' && !item.pago;

  return (
    <div className="mesa-caixa-container">
      <h2>Mesa {mesaId}</h2>
      <button className="voltar" onClick={() => navigate('/caixa')}>
        ← Voltar
      </button>

      {loading ? (
        <p>Carregando itens...</p>
      ) : itens.length === 0 ? (
        <p>Todos os itens foram pagos.</p>
      ) : (
        <>
          <ul className="itens-lista">
            {itens.map((item) => {
              const subtotal = (item.preco_unitario * item.quantidade).toFixed(2);
              const podeSelecionar = item.status === 'pronto' && !item.pago;
              const isSelecionado = selecionados.includes(item.id);

              return (
                <li
                  key={item.id}
                  className={`item 
          ${item.pago ? 'pago' : ''} 
          ${isSelecionado ? 'selecionado' : ''} 
          status-${item.status || 'desconhecido'}`}
                >
                  <label>
                    <input
                      type="checkbox"
                      disabled={!podeSelecionar}
                      checked={isSelecionado}
                      onChange={() => toggleSelecionado(item.id)}
                    />
                    <strong>{item.nome_produto}</strong> - {item.quantidade}x R$ {item.preco_unitario}
                    <span className="subtotal">
                      → Subtotal: R$ {subtotal}
                    </span>
                    <span className={`status-tag ${item.status || 'desconhecido'}`}>
                      {item.pago
                        ? 'Pago'
                        : item.status
                          ? item.status.replace('_', ' ')
                          : 'Sem status'}
                    </span>
                  </label>
                </li>
              );
            })}
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
