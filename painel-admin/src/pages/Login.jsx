import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/JonhBalaio.png';

const senhas = {
    admin: 'admin123',
    cozinha: 'cozinha123',
    caixa: 'caixa123',
    bar: 'bar123', // Senha provisória para o bar
};

const rotas = {
    admin: '/dashboard',
    cozinha: '/cozinha',
    caixa: '/caixa',
    bar: '/bar',
};

const Login = () => {
    const [senha, setSenha] = useState('');
    const [perfil, setPerfil] = useState('');
    const [erro, setErro] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        document.title = 'John Balaio | Login';
        const favicon = document.querySelector("link[rel='icon']");
        if (favicon) favicon.href = logo;

        // Pegando perfil da query string
        const params = new URLSearchParams(location.search);
        let perfilQuery = params.get('perfil');

        // Se não vier por query, tenta identificar pela URL (ex: /bar/login)
        if (!perfilQuery) {
            const pathParts = location.pathname.split('/');
            perfilQuery = pathParts[1]; // Ex: '/bar/login' -> 'bar'
        }

        if (perfilQuery && senhas[perfilQuery]) {
            setPerfil(perfilQuery);
        } else {
            setErro('Perfil inválido! Volte à página inicial.');
        }
    }, [location]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (senha === senhas[perfil]) {
          if (perfil === 'bar') localStorage.setItem('authBar', 'true');
          if (perfil === 'cozinha') localStorage.setItem('authCozinha', 'true');
          if (perfil === 'caixa') localStorage.setItem('authCaixa', 'true');
          if (perfil === 'admin') localStorage.setItem('authAdmin', 'true');
      
          navigate(rotas[perfil]);
        } else {
          setErro('Senha incorreta!');
        }
      };
      

    return (
        <div style={styles.container}>
            <h2>Login do Sistema</h2>
            <form onSubmit={handleLogin} style={styles.form}>
                <input
                    type="password"
                    placeholder="Digite a senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    style={styles.input}
                    required
                />
                {erro && <p style={styles.erro}>{erro}</p>}
                <button type="submit" style={styles.button}>Entrar</button>
            </form>
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: '#000',
        color: '#fff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '300px',
    },
    input: {
        padding: '10px',
        fontSize: '16px',
    },
    button: {
        padding: '10px',
        fontSize: '16px',
        backgroundColor: 'orange',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
    },
    erro: {
        color: 'red',
        fontSize: '14px',
        marginTop: '-5px',
        textAlign: 'center',
    },
};

export default Login;
