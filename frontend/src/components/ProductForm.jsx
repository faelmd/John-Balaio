import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ProductForm.css';

const ProductForm = ({ onProductSaved, productToEdit, onClose }) => {
  const [product, setProduct] = useState({
    nome: '',
    descricao: '',
    preco: '',
    categoria: '',
    origem: '',
  });
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (productToEdit) {
      setProduct({
        nome: productToEdit.nome || '',
        descricao: productToEdit.descricao || '',
        preco: productToEdit.preco || '',
        categoria: productToEdit.categoria || '',
        origem: productToEdit.origem || '',
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
    formData.append('nome', product.nome);
    formData.append('descricao', product.descricao);
    formData.append('preco', product.preco);
    formData.append('categoria', product.categoria);
    formData.append('origem', product.origem);
    if (image) formData.append('imagem', image);

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
      setProduct({ nome: '', descricao: '', preco: '', categoria: '', origem: '' });
      setImage(null);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <div>
        <label htmlFor="product-nome">Nome:</label>
        <input
          type="text"
          id="product-nome"
          name="nome"
          value={product.nome}
          onChange={handleChange}
          placeholder="Nome"
          required
        />
      </div>

      <div>
        <label htmlFor="product-descricao">Descrição:</label>
        <textarea
          id="product-descricao"
          name="descricao"
          value={product.descricao}
          onChange={handleChange}
          placeholder="Descrição"
          required
        />
      </div>

      <div>
        <label htmlFor="product-preco">Preço:</label>
        <input
          type="number"
          id="product-preco"
          name="preco"
          value={product.preco}
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
          <option value="Pizza">Pizza</option>
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

      <div>
        <label htmlFor="product-imagem">Imagem:</label>
        <input
          type="file"
          id="product-imagem"
          name="imagem"
          onChange={(e) => setImage(e.target.files[0])}
          accept="image/*"
        />
      </div>

      <button type="submit" className="btn salvar-btn">
        {productToEdit ? 'Atualizar' : 'Cadastrar'}
      </button>
    </form>
  );
};

export default ProductForm;
