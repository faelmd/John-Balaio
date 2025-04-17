// src/components/EditProductModal.jsx
import React, { useState } from 'react';
import axios from 'axios';

const EditProductModal = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description,
    price: product.price
  });
  const [image, setImage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    if (image) {
      data.append('image', image);
    }

    try {
      await axios.put(`http://localhost:5000/api/produtos/${product.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Produto atualizado com sucesso!');
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded p-6 w-full max-w-lg shadow-lg">
        <h2 className="text-xl font-bold text-orange-500 mb-4">Editar Produto</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nome"
            className="w-full p-2 border rounded"
            required
          />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Descrição"
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Preço"
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="w-full"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-400 text-white rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
