const db = require('../db');

const Order = {
    create: (order, callback) => {
        db.query('INSERT INTO pedidos SET ?', order, callback);
    },

    getAll: (callback) => {
        db.query('SELECT * FROM pedidos', callback);
    },

    updateStatus: (id, status, callback) => {
        db.query('UPDATE pedidos SET status = ? WHERE id = ?', [status, id], callback);
    }
};

module.exports = Order;
