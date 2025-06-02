import React, { useEffect, useState } from 'react';
import { API } from '../api';
import '../styles/Relatorios.css';

const Relatorios = () => {
  const [relatorios, setRelatorios] = useState([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    document.title = 'John Balaio | Relatórios';
    fetchRelatorios();
  }, []);

  const fetchRelatorios = async () => {
    try {
      const { data } = await API.get('/api/relatorios');
      setRelatorios(data);
    } catch (err) {
      console.error('Erro ao buscar relatórios:', err);
      setErro('Erro ao buscar relatórios');
    }
  };

  const handleDownload = (nome) => {
    window.open(`/api/relatorios/download/${nome}`, '_blank');
  };

  return (
    <div className="relatorios-container">
      <h1>Relatórios de Expediente</h1>
      {erro && <p className="erro">{erro}</p>}

      {relatorios.length === 0 ? (
        <p>Não há relatórios disponíveis.</p>
      ) : (
        <ul className="lista-relatorios">
          {relatorios.map((nome) => (
            <li key={nome} className="relatorio-item">
              <span>{nome}</span>
              <button onClick={() => handleDownload(nome)}>📥 Baixar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Relatorios;
