import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputAdornment,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import axios from "axios";

export default function CreateProductModal({
  open,
  handleClose,
  addProduct,
  productToEdit,
  onProductSaved,
}) {
  const [product, setProduct] = useState({
    nome: "",
    descricao: "",
    preco: "",
    categoria: "",
    origem: "",
  });
  const [image, setImage] = useState(null);

  const categorias = [
    "Na Brasa",
    "Vegetariano Completo",
    "Acompanhamentos",
    "Pratos Individuais",
    "Pratos Kids",
    "Molhos",
    "Hambúrguer's",
    "Extras",
    "Para Compartilhar",
    "Sobremesas",
    "Bebidas",
    "Sucos",
    "Sodas Italianas",
    "Cervejas",
    "Para Brindar",
    "Adicionais",
    "Doses e Shots",
  ];

  useEffect(() => {
    if (productToEdit) {
      setProduct({
        nome: productToEdit.nome || "",
        descricao: productToEdit.descricao || "",
        preco: productToEdit.preco || "",
        categoria: productToEdit.categoria || "",
        origem: productToEdit.origem || "",
      });
    } else {
      setProduct({
        nome: "",
        descricao: "",
        preco: "",
        categoria: "",
        origem: "",
      });
      setImage(null);
    }
  }, [productToEdit, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoriaChange = (e) => {
    setProduct((prev) => ({ ...prev, categoria: e.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!product.nome || !product.descricao || !product.preco || !product.categoria) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const formData = new FormData();
    formData.append("nome", product.nome);
    formData.append("descricao", product.descricao);
    formData.append("preco", product.preco);
    formData.append("categoria", product.categoria);
    formData.append("origem", product.origem);

    if (image) {
      formData.append("imagem", image);
    }

    try {
      if (productToEdit) {
        await axios.put(
          `http://localhost:5000/api/produtos/${productToEdit.id}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        alert("Produto atualizado com sucesso!");
      } else {
        await axios.post("http://localhost:5000/api/produtos", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Produto cadastrado com sucesso!");
      }

      if (onProductSaved) onProductSaved();
      handleClose();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar produto!");
    }
  };

  return (
    <Dialog
      sx={{ "& .MuiDialog-paper": { minWidth: 600 } }}
      open={open}
      onClose={handleClose}
      component="form"
      onSubmit={handleSubmit}
    >
      <DialogTitle>{productToEdit ? "Editar Produto" : "Criar Produto"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText>Insira os detalhes do produto:</DialogContentText>

          <TextField
            required
            label="Nome"
            name="nome"
            value={product.nome}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            required
            label="Descrição"
            name="descricao"
            value={product.descricao}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            required
            label="Preço"
            name="preco"
            value={product.preco}
            onChange={handleChange}
            type="number"
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
          />

          <FormControl fullWidth required>
            <Select
              native
              value={product.categoria}
              onChange={handleCategoriaChange}
              displayEmpty
            >
              <option value="">Selecione a categoria</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Origem (cozinha ou bar)"
            name="origem"
            value={product.origem}
            onChange={handleChange}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button type="submit" variant="contained">
          {productToEdit ? "Salvar Alterações" : "Criar Produto"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
