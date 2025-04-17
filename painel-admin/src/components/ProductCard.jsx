// src/components/ProductCard.jsx
import React from 'react';

const ProductCard = ({ product, onEdit, onDelete, onToggleAvailability }) => {
  return (
    <div className="bg-white rounded-2xl shadow p-4 w-72 relative flex flex-col">
      <img
        src={`http://localhost:5000/uploads/${product.image}`}
        alt={product.name}
        className="h-40 object-cover rounded-xl mb-4"
      />
      <h3 className="text-lg font-bold">{product.name}</h3>
      <p className="text-sm text-gray-600 mb-1">{product.description}</p>
      <p className="text-sm font-semibold">Preço: R$ {parseFloat(product.price).toFixed(2)}</p>
      <p className="text-xs text-gray-500">Categoria: {product.category}</p>
      <p className="text-xs text-gray-500">Origem: {product.origem}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onEdit(product)}
          className="bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600"
        >
          Excluir
        </button>
        <button
          onClick={() => onToggleAvailability(product.id, !product.disponivel)}
          className={`${
            product.disponivel ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
          } text-white text-sm px-3 py-1 rounded`}
        >
          {product.disponivel ? 'Suspender' : 'Ativar'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
