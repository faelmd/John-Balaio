import React, { useEffect, useState } from 'react';
import axios from 'axios';
import EditProductModal from './EditProductModal'; // certifique-se de criar esse componente

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/produtos');
      setProducts(response.data);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError('Erro ao buscar produtos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/produtos/${id}`);
      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const handleModalClose = () => {
    setEditingProduct(null);
    fetchProducts(); // Atualiza a lista após edição
  };

  if (loading) return <p>Carregando produtos...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Lista de Produtos</h2>

      {products.length === 0 ? (
        <p>Nenhum produto cadastrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="border p-4 rounded shadow bg-white">
              <h3 className="font-bold text-lg text-orange-500">{product.name}</h3>
              <p className="text-gray-700">{product.description}</p>
              <p className="font-semibold">Preço: R$ {parseFloat(product.price).toFixed(2)}</p>
              {product.image && (
                <img
                  src={`http://localhost:5000/uploads/${product.image}`}
                  alt={product.name}
                  className="w-full h-40 object-cover mt-2 rounded"
                />
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(product)}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edição */}
      {editingProduct && (
        <EditProductModal product={editingProduct} onClose={handleModalClose} />
      )}
    </div>
  );
};

export default ProductList;
