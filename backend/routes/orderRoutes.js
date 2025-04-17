const express = require('express');
const router = express.Router();
const controller = require('../controllers/orderController');

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id/status', controller.updateStatus);

module.exports = router;
