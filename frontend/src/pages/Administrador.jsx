// src/pages/Administrador.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import '../styles/Administrador.css';

const Administrador = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

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
        token: 'supersecreto123' // ⚠️ Substitua por token seguro real
      });

      if (response.data.success) {
        alert(response.data.message);
        // opcional: atualizar produtos ou outra ação
      }
    } catch (err) {
      console.error('Erro ao finalizar expediente:', err);
      alert('Erro ao limpar dados.');
    }
  };

  const groupedProducts = products.reduce((acc, product) => {
    const key = `${product.origem} - ${product.categoria}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(product);
    return acc;
  }, {});

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Produtos</h1>
        <div className="admin-actions">
          <button className="new-product-btn" onClick={handleNewProduct}>
            Novo Produto
          </button>
          <button className="finalizar-expediente-btn" onClick={finalizarExpediente}>
            Finalizar Expediente 🔥
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
        {Object.entries(groupedProducts).map(([group, items]) => (
          <div key={group} className="product-group">
            <h3>{group}</h3>
            <div className="product-list">
              {items.map((product) => (
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
        ))}
      </div>
    </div>
  );
};

export default Administrador;
