const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus // nova função adicionada
} = require('../controllers/productController');
const upload = require('../middleware/upload');

// Listar produtos
router.get('/', getAllProducts);

// Criar produto com upload de imagem
router.post('/', upload.single('image'), createProduct);

// Atualizar produto com imagem
router.put('/:id', upload.single('image'), updateProduct);

// Atualizar status (disponível/suspenso)
router.patch('/:id/status', updateProductStatus); // <-- nova rota aqui

// Excluir produto
router.delete('/:id', deleteProduct);

module.exports = router;
