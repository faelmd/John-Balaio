import React, { useState } from 'react';
import { API } from '../api';

const EditProductModal = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    nome: product.nome,
    descricao: product.descricao,
    preco: product.preco,
    categoria: product.categoria,
    origem: product.origem,
    imagem: product.imagem,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/api/produtos/${product.id}`, formData);
      alert('Produto atualizado com sucesso!');
      onClose(); // Fecha o modal e atualiza a lista
    } catch (err) {
      console.error('Erro ao editar produto:', err);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Editar Produto</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Nome"
            required
          />
          <textarea
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            placeholder="Descrição"
            required
          />
          <input
            type="number"
            name="preco"
            value={formData.preco}
            onChange={handleChange}
            placeholder="Preço"
            required
          />
          <input
            type="text"
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            placeholder="Categoria"
          />
          <input
            type="text"
            name="origem"
            value={formData.origem}
            onChange={handleChange}
            placeholder="Origem"
          />
          <button type="submit">Salvar</button>
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
