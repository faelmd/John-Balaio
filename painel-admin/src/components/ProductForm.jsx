// src/components/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductForm = ({ onProductSaved, productToEdit, onClose }) => {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    origem: '', // cozinha ou bar
  });
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (productToEdit) {
      setProduct({
        name: productToEdit.name,
        description: productToEdit.description,
        price: productToEdit.price,
        category: productToEdit.category,
        origem: productToEdit.origem,
      });
    }
  }, [productToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('description', product.description);
    formData.append('price', product.price);
    formData.append('category', product.category);
    formData.append('origem', product.origem);
    if (image) {
      formData.append('image', image);
    }

    try {
      if (productToEdit) {
        // Editar produto
        await axios.put(`http://localhost:5000/api/produtos/${productToEdit.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Produto atualizado com sucesso!');
      } else {
        // Cadastrar novo produto
        await axios.post('http://localhost:5000/api/produtos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Produto cadastrado com sucesso!');
      }

      if (onProductSaved) onProductSaved();
      setProduct({ name: '', description: '', price: '', category: '', origem: '' });
      setImage(null);
      if (onClose) onClose();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="name"
        value={product.name}
        onChange={handleChange}
        placeholder="Nome"
        className="w-full p-2 border rounded"
        required
      />
      <textarea
        name="description"
        value={product.description}
        onChange={handleChange}
        placeholder="Descrição"
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="number"
        name="price"
        value={product.price}
        onChange={handleChange}
        placeholder="Preço"
        className="w-full p-2 border rounded"
        required
        min="0"
        step="0.01"
      />
      <input
        type="text"
        name="category"
        value={product.category}
        onChange={handleChange}
        placeholder="Categoria"
        className="w-full p-2 border rounded"
        required
      />
      <select
        name="origem"
        value={product.origem}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      >
        <option value="">Selecione a origem</option>
        <option value="cozinha">Cozinha</option>
        <option value="bar">Bar</option>
      </select>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        className="w-full"
        {...(!productToEdit && { required: true })}
      />

      <button
        type="submit"
        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition"
      >
        {productToEdit ? 'Atualizar' : 'Cadastrar'}
      </button>
    </form>
  );
};

export default ProductForm;
