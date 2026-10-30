const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all products
router.get('/', (req, res) => {
  db.all("SELECT * FROM products WHERE is_active = 1 ORDER BY category, name", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Get product by ID
router.get('/:id', (req, res) => {
  db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json(row);
    }
  });
});

// Create new product
router.post('/', (req, res) => {
  const { name, category, price, cost, image } = req.body;
  db.run(
    "INSERT INTO products (name, category, price, cost, image) VALUES (?, ?, ?, ?, ?)",
    [name, category, price, cost, image || null],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID, name, category, price, cost });
      }
    }
  );
});

// Update product
router.put('/:id', (req, res) => {
  const { name, category, price, cost, image, is_active } = req.body;
  db.run(
    "UPDATE products SET name = ?, category = ?, price = ?, cost = ?, image = ?, is_active = ? WHERE id = ?",
    [name, category, price, cost, image, is_active !== undefined ? is_active : 1, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: 'Product updated' });
      }
    }
  );
});

// Delete product (soft delete)
router.delete('/:id', (req, res) => {
  db.run("UPDATE products SET is_active = 0 WHERE id = ?", [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Product deleted' });
    }
  });
});

module.exports = router;
