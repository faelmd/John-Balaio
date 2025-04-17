import { useNavigate } from 'react-router-dom';
import logo from '../assets/JonhBalaio.png';
import { useState, useEffect } from 'react';
import '../styles/Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [imgErro, setImgErro] = useState(false);

  useEffect(() => {
    document.title = 'John Balaio | Início';
  }, []);

  const irParaLogin = (perfil) => {
    navigate(`/login?perfil=${perfil}`);
  };

  return (
    <div className="home-container">
      {!imgErro ? (
        <img
          src={logo}
          alt="Logo do Bar John Balaio"
          className="home-logo"
          onError={() => setImgErro(true)}
        />
      ) : (
        <div className="home-logo logo-placeholder">John Balaio</div>
      )}

      <h1 className="home-title">John Balaio - Bar & Grelha</h1>

      <div className="home-buttons">
        <button onClick={() => irParaLogin('cozinha')} className="home-button">
          Cozinha
        </button>
        <button onClick={() => irParaLogin('bar')} className="home-button">
          Bar
        </button>
        <button onClick={() => irParaLogin('caixa')} className="home-button">
          Caixa
        </button>
        <button onClick={() => irParaLogin('admin')} className="home-button">
          Administrador
        </button>       
      </div>
    </div>
  );
}
