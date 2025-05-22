import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Páginas
import Home from './pages/Home';
import Login from './pages/Login';
import Administrador from './pages/Administrador';
import CozinhaPage from './pages/Cozinha';
import CaixaDashboard from './pages/Caixa';
import MesaCaixa from './pages/MesaCaixa';
import Bar from './pages/Bar';
import LoginAdmin from './pages/LoginAdmin';
import LoginCozinha from './pages/LoginCozinha';
import LoginCaixa from './pages/LoginCaixa';
import LoginBar from './pages/LoginBar';
import Relatorios from './pages/Relatorios';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} /> {/* Nova rota para compatibilidade */}
        <Route path="/admin/login" element={<LoginAdmin />} />
        <Route path="/cozinha/login" element={<LoginCozinha />} />
        <Route path="/bar/login" element={<LoginBar />} />
        <Route path="/caixa/login" element={<LoginCaixa />} />
        <Route path="/Administrador" element={<Administrador />} />
        <Route path="/cozinha" element={<CozinhaPage />} />
        <Route path="/bar" element={<Bar />} />
        <Route path="/caixa" element={<CaixaDashboard />} />
        <Route path="/caixa/mesa/:mesaId" element={<MesaCaixa />} />
        <Route path="/relatorios" element={<Relatorios />} />
      </Routes>
    </Router>
  );
}

export default App;
