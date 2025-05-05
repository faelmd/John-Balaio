import React from 'react';
import '../styles/ProductCard.css';

const ProductCard = ({ product, onEdit, onDelete, onToggleAvailability }) => {
  const imageUrl = product.image
    ? `http://localhost:5000/uploads/${product.image}`
    : '/default-image.jpg'; // fallback para imagem padrão

  return (
    <div className="product-card">
      <img
        src={imageUrl}
        alt={product.name}
        className="product-image"
      />
      <h3 className="product-name">{product.name}</h3>
      <p className="product-description">{product.description}</p>
      <p className="product-price">Preço: R$ {parseFloat(product.price).toFixed(2)}</p>
      <p className="product-category">Categoria: {product.category}</p>
      <p className="product-origin">Origem: {product.origem}</p>
      
      {product.ingredientes && product.ingredientes.length > 0 && (
        <div>
          <h4>Ingredientes:</h4>
          <ul>
            {product.ingredientes.split(',').map((ingrediente, index) => (
              <li key={index}>{ingrediente}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="product-actions">
        <button
          onClick={() => onEdit(product)}
          className="btn edit-btn"
          aria-label="Editar produto"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="btn delete-btn"
          aria-label="Excluir produto"
        >
          Excluir
        </button>
        <button
          onClick={() => onToggleAvailability(product.id, !product.disponivel)}
          className={`btn ${product.disponivel ? 'suspend-btn' : 'activate-btn'}`}
          aria-label="Alternar disponibilidade"
        >
          {product.disponivel ? 'Suspender' : 'Ativar'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
