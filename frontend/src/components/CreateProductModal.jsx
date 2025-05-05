import React, { useState, useEffect } from "react";
import {
  Button,
  Chip,
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
    name: "",
    description: "",
    price: "",
    category: "",
    origem: "",
  });
  const [image, setImage] = useState(null);
  const [ingredientes, setIngredientes] = useState([]);
  const [ingredienteInput, setIngredienteInput] = useState("");

  const categorias = [
    "Carnes",
    "Acompanhamento",
    "Prato individual",
    "Molhos",
    "Hamburguer",
    "Extras",
    "Porções",
    "Sobremesas",
    "Bebidas",
  ];

  useEffect(() => {
    if (productToEdit) {
      setProduct({
        name: productToEdit.name || "",
        description: productToEdit.description || "",
        price: productToEdit.price || "",
        category: productToEdit.category || "",
        origem: productToEdit.origem || "",
      });
      setIngredientes(productToEdit.ingredientes || []);
    } else {
      setProduct({
        name: "",
        description: "",
        price: "",
        category: "",
        origem: "",
      });
      setIngredientes([]);
      setImage(null);
    }
  }, [productToEdit, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoriaChange = (e) => {
    setProduct((prev) => ({ ...prev, category: e.target.value }));
  };

  const handleDeleteIngrediente = (ingredienteSelecionado) => {
    setIngredientes((prev) =>
      prev.filter((ingrediente) => ingrediente !== ingredienteSelecionado)
    );
  };

  const handleAddIngrediente = () => {
    const valor = ingredienteInput.trim();
    if (valor !== "" && !ingredientes.includes(valor)) {
      setIngredientes((prev) => [...prev, valor]);
      setIngredienteInput("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!product.name || !product.description || !product.price || !product.category) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const formData = new FormData();
    formData.append("name", product.name);
    formData.append("description", product.description);
    formData.append("price", product.price);
    formData.append("category", product.category);
    formData.append("origem", product.origem);
    formData.append("ingredientes", ingredientes.join(","));

    if (image) {
      formData.append("image", image);
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
            name="name"
            value={product.name}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            required
            label="Descrição"
            name="description"
            value={product.description}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            required
            label="Preço"
            name="price"
            value={product.price}
            onChange={handleChange}
            type="number"
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
          />

          <FormControl fullWidth required>
            <Select
              value={product.category}
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

          {/* Adicionando ingredientes */}
          <TextField
            label="Ingrediente"
            value={ingredienteInput}
            onChange={(e) => setIngredienteInput(e.target.value)}
            fullWidth
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddIngrediente();
              }
            }}
            placeholder="Digite o ingrediente e pressione Enter"
          />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {ingredientes.map((ingrediente) => (
              <Chip
                key={ingrediente}
                label={ingrediente}
                onDelete={() => handleDeleteIngrediente(ingrediente)}
              />
            ))}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button type="submit" variant="contained" color="primary">
          {productToEdit ? "Salvar alterações" : "Cadastrar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
