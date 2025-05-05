import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ProductForm.css';

const ProductForm = ({ onProductSaved, productToEdit, onClose }) => {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    origem: '',
  });
  const [image, setImage] = useState(null);
  const [ingredienteInput, setIngredienteInput] = useState('');
  const [ingredientes, setIngredientes] = useState([]);

  useEffect(() => {
    if (productToEdit) {
      setProduct({
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        price: productToEdit.price || '',
        category: productToEdit.category || '',
        origem: productToEdit.origem || '',
      });
      // Se ingredientes já existirem no produto a ser editado
      if (productToEdit.ingredientes) {
        try {
          const parsed = typeof productToEdit.ingredientes === 'string'
            ? JSON.parse(productToEdit.ingredientes)
            : productToEdit.ingredientes;
          setIngredientes(Array.isArray(parsed) ? parsed : []);
        } catch {
          setIngredientes([]);
        }
      }
    }
  }, [productToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddIngrediente = () => {
    const trimmed = ingredienteInput.trim();
    if (trimmed && !ingredientes.includes(trimmed)) {
      setIngredientes((prev) => [...prev, trimmed]);
      setIngredienteInput('');
    }
  };

  const handleRemoveIngrediente = (indexToRemove) => {
    setIngredientes((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('description', product.description);
    formData.append('price', product.price);
    formData.append('category', product.category);
    formData.append('origem', product.origem);
    formData.append('ingredientes', JSON.stringify(ingredientes));
    if (image) {
      formData.append('image', image);
    }

    try {
      if (productToEdit) {
        await axios.put(`http://localhost:5000/api/produtos/${productToEdit.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Produto atualizado com sucesso!');
      } else {
        await axios.post('http://localhost:5000/api/produtos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Produto cadastrado com sucesso!');
      }

      if (onProductSaved) onProductSaved();
      setProduct({ name: '', description: '', price: '', category: '', origem: '' });
      setIngredientes([]);
      setImage(null);
      if (onClose) onClose();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <input
        type="text"
        name="name"
        value={product.name || ''}
        onChange={handleChange}
        placeholder="Nome"
        required
      />
      <textarea
        name="description"
        value={product.description || ''}
        onChange={handleChange}
        placeholder="Descrição"
        required
      />
      <input
        type="number"
        name="price"
        value={product.price || ''}
        onChange={handleChange}
        placeholder="Preço"
        required
        min="0"
        step="0.01"
      />
      <select
        name="category"
        value={product.category || ''}
        onChange={handleChange}
        required
      >
        <option value="">Selecione a categoria</option>
        <option value="Carnes">Carnes</option>
        <option value="Acompanhamento">Acompanhamento</option>
        <option value="Prato individual">Prato individual</option>
        <option value="Molhos">Molhos</option>
        <option value="Hamburguer">Hamburguer</option>
        <option value="Extras">Extras</option>
        <option value="Porções">Porções</option>
        <option value="Sobremesas">Sobremesas</option>
        <option value="Bebidas">Bebidas</option>
      </select>

      <select
        name="origem"
        value={product.origem || ''}
        onChange={handleChange}
        required
      >
        <option value="">Selecione a origem</option>
        <option value="cozinha">Cozinha</option>
        <option value="bar">Bar</option>
      </select>

      {/* Ingredientes */}
      <div className="ingredientes-container">
        <input
          type="text"
          value={ingredienteInput}
          onChange={(e) => setIngredienteInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddIngrediente();
            }
          }}
          placeholder="Adicionar ingrediente e pressione Enter"
        />
        <div className="ingredientes-list">
          {ingredientes.map((item, idx) => (
            <span key={idx} className="ingrediente-chip">
              {item}
              <button type="button" onClick={() => handleRemoveIngrediente(idx)}>x</button>
            </span>
          ))}
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        {...(!productToEdit && { required: true })}
      />

      <button type="submit">
        {productToEdit ? 'Atualizar' : 'Cadastrar'}
      </button>
    </form>
  );
};

export default ProductForm;
