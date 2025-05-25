import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import '../styles/Administrador.css';
import { Link } from 'react-router-dom';

const Administrador = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filtroOrigem, setFiltroOrigem] = useState('todos');
  const [filtroDisponivel, setFiltroDisponivel] = useState('todos');

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/produtos');
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  useEffect(() => {
    document.title = 'John Balaio | Administrador';
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await axios.delete(`http://localhost:5000/api/produtos/${id}`);
        fetchProducts();
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
      }
    }
  };

  const handleToggleAvailability = async (id, disponivel) => {
    try {
      await axios.patch(`http://localhost:5000/api/produtos/${id}/status`, { disponivel });
      fetchProducts();
    } catch (error) {
      console.error('Erro ao alterar disponibilidade:', error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const finalizarExpediente = async () => {
    const confirmar = window.confirm(
      'Tem certeza que deseja finalizar o expediente?\nIsso apagará TODOS os pedidos!'
    );
    if (!confirmar) return;
    try {
      const response = await axios.post('http://localhost:5000/api/admin/finalizar-expediente', {
        token: 'supersecreto123'
      });
      if (response.data.success) {
        alert(response.data.message);
      }
    } catch (err) {
      console.error('Erro ao finalizar expediente:', err);
      alert('Erro ao limpar dados.');
    }
  };

  // 🔥 Agrupar produtos por origem e categoria
  const groupedProducts = products.reduce((acc, product) => {
    const key = `${product.origem} - ${product.categoria}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(product);
    return acc;
  }, {});

  // 🔥 Ordenação de grupos (Cozinha primeiro, depois Bar)
  const ordemOrigens = ['Cozinha', 'Bar'];
  const gruposOrdenados = Object.entries(groupedProducts)
    .sort((a, b) => {
      const origemA = a[0].split(' - ')[0];
      const origemB = b[0].split(' - ')[0];
      return ordemOrigens.indexOf(origemA) - ordemOrigens.indexOf(origemB);
    });

  // 🔥 Filtro de disponibilidade
  const filtrarPorDisponibilidade = (item) => {
    if (filtroDisponivel === 'todos') return true;
    if (filtroDisponivel === 'ativo') return item.disponivel === 1;
    if (filtroDisponivel === 'suspenso') return item.disponivel === 0;
    return true;
  };

  return (
    <div className="admin-container">
      <h1 className="titulo">Painel do Administrador</h1>

      <div className="admin-actions">
        <button className="new-product-btn" onClick={handleNewProduct}>
          Novo Produto
        </button>
        <button className="finalizar-expediente-btn" onClick={finalizarExpediente}>
          Finalizar Expediente 🔥
        </button>
        <Link to="/relatorios">
          <button className="relatorios-btn">📑 Relatórios</button>
        </Link>
      </div>

      <h2 className="subtitulo-produtos">Produtos Cadastrados</h2>

      {/* 🔥 Filtros */}
      <div className="filtros-container">
        <div className="filtros-produtos">
          <span>Origem:</span>
          <button
            className={filtroOrigem === 'todos' ? 'ativo' : ''}
            onClick={() => setFiltroOrigem('todos')}
          >
            Todos
          </button>
          <button
            className={filtroOrigem === 'Cozinha' ? 'ativo' : ''}
            onClick={() => setFiltroOrigem('Cozinha')}
          >
            Cozinha
          </button>
          <button
            className={filtroOrigem === 'Bar' ? 'ativo' : ''}
            onClick={() => setFiltroOrigem('Bar')}
          >
            Bar
          </button>

          <span>Status:</span>
          <button
            className={filtroDisponivel === 'todos' ? 'ativo' : ''}
            onClick={() => setFiltroDisponivel('todos')}
          >
            Todos
          </button>
          <button
            className={filtroDisponivel === 'ativo' ? 'ativo' : ''}
            onClick={() => setFiltroDisponivel('ativo')}
          >
            Ativo
          </button>
          <button
            className={filtroDisponivel === 'suspenso' ? 'ativo' : ''}
            onClick={() => setFiltroDisponivel('suspenso')}
          >
            Suspenso
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingProduct ? 'Editar Produto' : 'Cadastrar Produto'}</h2>
            <ProductForm
              onProductSaved={fetchProducts}
              productToEdit={editingProduct}
              onClose={closeForm}
            />
            <button className="cancel-btn" onClick={closeForm}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="product-group-list">
        {gruposOrdenados
          .filter(([group]) => {
            if (filtroOrigem === 'todos') return true;
            return group.startsWith(filtroOrigem);
          })
          .map(([group, items]) => {
            const itensFiltrados = items
              .filter(filtrarPorDisponibilidade)
              .sort((a, b) => a.nome.localeCompare(b.nome)); // 🅰️✔️ Ordem alfabética

            if (itensFiltrados.length === 0) return null; // 🔥 Oculta grupo vazio

            return (
              <div
                key={group}
                className={`product-group ${group.startsWith('Cozinha') ? 'cozinha' : 'bar'}`}
              >
                <h3>{group}</h3>
                <div className="product-list">
                  {itensFiltrados.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleAvailability={handleToggleAvailability}
                    />
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Administrador;
