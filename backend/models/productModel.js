const db = require('../db');

const Product = {
    getAll: (callback) => {
        db.query('SELECT * FROM produtos', callback);
    },

    create: (product, callback) => {
        db.query('INSERT INTO produtos SET ?', product, callback);
    },

    update: (id, product, callback) => {
        db.query('UPDATE produtos SET ? WHERE id = ?', [product, id], callback);
    },

    delete: (id, callback) => {
        db.query('DELETE FROM produtos WHERE id = ?', [id], callback);
    }
};

module.exports = Product;
