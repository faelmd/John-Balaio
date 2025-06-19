import React from 'react';
import '../styles/ProductCard.css';
import { API } from '../api';

const ProductCard = ({ product, onEdit, onDelete, onToggleAvailability }) => {
  const imageUrl = product.imagem
    ? `${API.defaults.baseURL}/uploads/${product.imagem}`
    : `${API.defaults.baseURL}/default-image.jpg`; // Imagem padrão

  return (
    <div className="product-card">
      <img
        src={imageUrl}
        alt={product.nome}
        className="product-image"
      />

      <h3 className="product-name">{product.nome}</h3>
      <p className="product-description">{product.descricao}</p>
      <p className="product-price">Preço: R$ {parseFloat(product.preco).toFixed(2)}</p>
      <p className="product-categoria">Categoria: {product.categoria}</p>
      <p className="product-origin">Origem: {product.origem}</p>

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
