// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';

const Dashboard = () => {
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

  const groupedProducts = products.reduce((acc, product) => {
    const key = `${product.origem} - ${product.category}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(product);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">Produtos</h1>
        <button
          onClick={handleNewProduct}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          Novo Produto
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Editar Produto' : 'Cadastrar Produto'}
            </h2>
            <ProductForm
              onProductSaved={fetchProducts}
              productToEdit={editingProduct}
              onClose={closeForm}
            />
            <button
              className="mt-4 text-sm text-red-500 underline"
              onClick={closeForm}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {Object.entries(groupedProducts).map(([group, items]) => (
          <div key={group}>
            <h3 className="text-xl font-semibold text-orange-600 mb-3">{group}</h3>
            <div className="flex flex-wrap gap-4">
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

export default Dashboard;
