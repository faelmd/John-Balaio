const Order = require('../models/orderModel');

exports.create = (req, res) => {
  Order.create(req.body, (err, result) => {
    if (err) return res.status(500).send(err);
    req.io.emit('newOrder', req.body); // notificação em tempo real
    res.status(201).json({ id: result.insertId, ...req.body });
  });
};

exports.getAll = (req, res) => {
  Order.getAll((err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
};

exports.updateStatus = (req, res) => {
  Order.updateStatus(req.params.id, req.body.status, (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(204);
  });
};
