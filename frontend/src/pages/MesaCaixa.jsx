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

  const API_URL = 'http://localhost:5000/api';

  /** 🔄 Buscar itens da mesa */
  const fetchItens = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/caixa/mesa/${mesaId}`);
      setItens(data);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      alert('Erro ao buscar itens da mesa.');
    } finally {
      setLoading(false);
    }
  }, [mesaId]);

  /** 🎯 Atualizar dados na abertura */
  useEffect(() => {
    document.title = `Mesa ${mesaId} | Caixa`;
    fetchItens();
  }, [fetchItens, mesaId]);

  /** ✅ Selecionar/desselecionar item */
  const toggleSelecionado = (id) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  /** 💰 Calcular total dos itens selecionados */
  const calcularTotal = () => {
    const total = itens
      .filter((item) => selecionados.includes(item.id))
      .reduce((acc, item) => acc + item.preco_unitario * item.quantidade, 0);
    return total.toFixed(2);
  };

  /** 🧾 Confirmar pagamento parcial */
  const confirmarPagamento = async () => {
    if (selecionados.length === 0) return;

    try {
      await axios.put(`${API_URL}/caixa/pagar`, { itemIds: selecionados });
      alert('Pagamento confirmado!');
      setSelecionados([]);
      fetchItens();
    } catch (error) {
      console.error('Erro ao pagar:', error);
      alert('Erro ao confirmar pagamento.');
    }
  };

  /** 💳 Pagar a conta inteira */
  const pagarTudo = async () => {
    try {
      const { data } = await axios.post(`${API_URL}/caixa/pagar/${mesaId}`);
      alert(`Pagamento confirmado! Comprovante: ${data.arquivo}`);

      // Baixar comprovante
      const link = document.createElement('a');
      link.href = `${API_URL}/comprovantes/${data.arquivo}`;
      link.download = data.arquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSelecionados([]);
      fetchItens();
    } catch (error) {
      console.error('Erro ao pagar tudo:', error);
      alert('Erro ao pagar a conta inteira.');
    }
  };

  /** 🚀 Gerar key segura */
  const gerarKey = (item, index) => {
    return item.id ?? `${item.nome_produto}-${item.quantidade}-${index}`;
  };

  return (
    <div className="mesa-caixa-container">
      <h2>Mesa {mesaId}</h2>

      <button className="voltar" onClick={() => navigate('/caixa')}>
        ← Voltar
      </button>

      {loading ? (
        <p>Carregando itens...</p>
      ) : itens.length === 0 ? (
        <p>Todos os itens foram pagos. 🎉</p>
      ) : (
        <>
          <ul className="itens-lista">
            {itens.map((item, index) => {
              const subtotal = (item.preco_unitario * item.quantidade).toFixed(2);
              const isSelecionado = selecionados.includes(item.id);
              const podeSelecionar = item.status === 'pronto' && !item.pago;

              return (
                <li
                  key={gerarKey(item, index)}
                  className={`item 
                    ${item.pago ? 'pago' : ''} 
                    ${isSelecionado ? 'selecionado' : ''} 
                    status-${item.status}`}
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
                    <span className={`status-tag ${item.status}`}>
                      {item.pago ? '✔️ Pago' : (item.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Sem status')}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="total">
            Total Selecionado: <strong>R$ {calcularTotal()}</strong>
          </div>

          <div className="botoes">
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
          </div>
        </>
      )}
    </div>
  );
};

export default MesaCaixa;
