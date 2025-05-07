import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ProductForm.css';

const ProductForm = ({ onProductSaved, productToEdit, onClose }) => {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    categoria: '',
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
        categoria: productToEdit.categoria || '',
        origem: productToEdit.origem || '',
      });

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

  const handleRemoveIngrediente = (index) => {
    setIngredientes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('description', product.description);
    formData.append('price', product.price);
    formData.append('categoria', product.categoria);
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

      onProductSaved?.();
      onClose?.();
      setProduct({ name: '', description: '', price: '', categoria: '', origem: '' });
      setIngredientes([]);
      setImage(null);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <div>
        <label htmlFor="product-name">Nome:</label>
        <input
          type="text"
          id="product-name"
          name="name"
          value={product.name}
          onChange={handleChange}
          placeholder="Nome"
          required
        />
      </div>

      <div>
        <label htmlFor="product-description">Descrição:</label>
        <textarea
          id="product-description"
          name="description"
          value={product.description}
          onChange={handleChange}
          placeholder="Descrição"
          required
        />
      </div>

      <div>
        <label htmlFor="product-price">Preço:</label>
        <input
          type="number"
          id="product-price"
          name="price"
          value={product.price}
          onChange={handleChange}
          placeholder="Preço"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div>
        <label htmlFor="product-categoria">Categoria:</label>
        <select
          id="product-categoria"
          name="categoria"
          value={product.categoria}
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
          <option value="Refrigerante">Refrigerante</option>
          <option value="Sucos">Sucos</option>
          <option value="Drinks">Drinks</option>
          <option value="Doses">Doses</option>
          <option value="Cervejas">Cervejas</option>
          <option value="Outros">Outros</option>
        </select>
      </div>

      <div>
        <label htmlFor="product-origem">Origem:</label>
        <select
          id="product-origem"
          name="origem"
          value={product.origem}
          onChange={handleChange}
          required
        >
          <option value="">Selecione a origem</option>
          <option value="Cozinha">Cozinha</option>
          <option value="Bar">Bar</option>
        </select>
      </div>

      <div className="ingredientes-section">
        <label htmlFor="ingrediente-input">Ingredientes:</label>
        <input
          id="ingrediente-input"
          type="text"
          value={ingredienteInput}
          onChange={(e) => setIngredienteInput(e.target.value)}
          placeholder="Adicionar ingrediente"
        />
        <button type="button" onClick={handleAddIngrediente} aria-label="Adicionar ingrediente">
          Adicionar
        </button>

        <ul className="ingredientes-list">
          {ingredientes.map((item, index) => (
            <li key={index}>
              {item}
              <button type="button" onClick={() => handleRemoveIngrediente(index)} aria-label="Remover ingrediente">
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label htmlFor="product-image">Imagem:</label>
        <input
          id="product-image"
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />
      </div>

      <button type="submit" className="submit-btn">
        {productToEdit ? 'Atualizar Produto' : 'Cadastrar Produto'}
      </button>
    </form>
  );
};

export default ProductForm;
