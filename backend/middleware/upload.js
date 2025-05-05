const multer = require('multer');
const path = require('path');

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '-').replace(/[^\w.-]/g, '');
    cb(null, `${timestamp}-${originalName}`);
  }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagem inválido. Use .jpg, .jpeg, .png ou .webp.'));
  }
};

// Upload com limite de 5MB
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

module.exports = upload;
