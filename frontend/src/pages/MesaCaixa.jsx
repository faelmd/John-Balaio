import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../api';
import '../styles/MesaCaixa.css';

const MesaCaixa = () => {
  const { mesaId } = useParams();
  const navigate = useNavigate();

  const [itens, setItens] = useState([]);
  const [mesaInfo, setMesaInfo] = useState({ abertura: null, fechamento: null });
  const [selecionados, setSelecionados] = useState([]);
  const [comprovante, setComprovante] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchItens = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/api/caixa/mesa/${mesaId}`);

      setItens(Array.isArray(data.itens) ? data.itens : []);
      setMesaInfo({
        abertura: data.abertura || null,
        fechamento: data.fechamento || null,
      });

      if (data.fechamento) {
        const dataFormatada = new Date(data.fechamento).toISOString().replace(/[:.]/g, '-');
        setComprovante(`comprovante-mesa-${mesaId}-${dataFormatada}.txt`);
      } else {
        setComprovante('');
      }

    } catch (err) {
      console.error('❌ Erro ao buscar itens:', err);
      alert('Erro ao buscar itens da mesa.');
      setItens([]);
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
    const res = await API.put('/api/caixa/pagar', {
      itemIds: selecionados,
    });

    if (res.data.encerrado) {
      alert('✅ Todos os itens foram pagos. Mesa encerrada.');

      // Adiciona comprovante à lista se disponível
      if (res.data.comprovante) {
        setComprovante(res.data.comprovante);
      }
    } else {
      alert('Pagamento registrado.');
    }

    setSelecionados([]);
    fetchItens();
  } catch (err) {
    console.error('❌ Erro ao pagar:', err);
    alert('Erro ao registrar pagamento.');
  }
};

  const pagarTudo = async () => {
    try {
      const res = await API.post(`/api/caixa/pagar/${mesaId}`);

      alert(`Pagamento confirmado. Comprovante gerado e disponível no painel.`);

      setSelecionados([]);
      setComprovante(res.data.arquivo);
      fetchItens();
    } catch (err) {
      console.error('❌ Erro ao pagar tudo:', err);
      alert('Erro ao pagar conta completa.');
    }
  };

  const pagarDividido = async () => {
    const partes = prompt('Dividir em quantas partes?');
    if (!partes || isNaN(partes) || partes < 2) {
      alert('Informe um número válido maior que 1');
      return;
    }

    try {
      const res = await API.post(`/api/caixa/pagar-dividido/${mesaId}`, { partes });
      alert(
        `Total: R$ ${res.data.total}\n` +
        `Dividido em ${partes} partes: R$ ${res.data.valor_por_parte} por pessoa.`
      );
    } catch (err) {
      console.error('❌ Erro ao dividir conta:', err);
      alert('Erro ao dividir a conta.');
    }
  };

  const todosItensProntos = itens.every(item => item.status === 'pronto' || item.pago);

  return (
    <div className="mesa-caixa-container">
      <h2>Mesa {mesaId}</h2>

      {mesaInfo.abertura && (
        <p>
          <strong>Abertura:</strong> {new Date(mesaInfo.abertura).toLocaleString('pt-BR')}
          {mesaInfo.fechamento && (
            <>
              <br /><strong>Fechamento:</strong> {new Date(mesaInfo.fechamento).toLocaleString('pt-BR')}
            </>
          )}
        </p>
      )}

      <button className="voltar" onClick={() => navigate('/caixa')}>
        ← Voltar
      </button>

      {loading ? (
        <p>Carregando itens...</p>
      ) : mesaInfo.fechamento ? (
        <div className="comprovante-section">
          <p>✅ Conta encerrada.</p>
          {comprovante && (
            <button
              className="baixar-comprovante"
              onClick={() => {
                const url = `/comprovantes/${comprovante}`;
                const link = document.createElement('a');
                link.href = url;
                link.download = comprovante;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              📄 Baixar Comprovante
            </button>
          )}
        </div>
      ) : (
        <>
          <ul className="itens-lista">
            {itens.map(item => {
              const subtotal = (item.preco_unitario * item.quantidade).toFixed(2);
              const podeSelecionar = item.status === 'pronto' && !item.pago;
              const isSelecionado = selecionados.includes(item.id);

              return (
                <li
                  key={item.id}
                  className={`item ${item.pago ? 'pago' : ''} 
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
                    <span className="subtotal">→ Subtotal: R$ {subtotal}</span>
                    <span className={`status-tag ${item.status}`}>
                      {item.pago ? 'Pago' : item.status.replace('_', ' ')}
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

          <button
            className="pagar-tudo"
            onClick={pagarTudo}
            disabled={!todosItensProntos}
          >
            Pagar Conta Inteira
          </button>

          <button
            className="dividir-conta"
            onClick={pagarDividido}
            disabled={!todosItensProntos}
          >
            Pagar Dividido
          </button>
        </>
      )}
    </div>
  );
};

export default MesaCaixa;
