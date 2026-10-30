const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all inventory with product details
router.get('/', (req, res) => {
  db.all(
    `SELECT i.*, p.name, p.category, p.price 
     FROM inventory i 
     JOIN products p ON i.product_id = p.id 
     WHERE p.is_active = 1
     ORDER BY p.category, p.name`,
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  );
});

// Get low stock items
router.get('/low-stock', (req, res) => {
  const threshold = req.query.threshold || 10;
  db.all(
    `SELECT i.*, p.name, p.category 
     FROM inventory i 
     JOIN products p ON i.product_id = p.id 
     WHERE i.quantity <= ? AND p.is_active = 1`,
    [threshold],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  );
});

// Update inventory
router.put('/:id', (req, res) => {
  const { quantity } = req.body;
  db.run(
    "UPDATE inventory SET quantity = ? WHERE id = ?",
    [quantity, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: 'Inventory updated' });
      }
    }
  );
});

// Restock inventory
router.post('/restock', (req, res) => {
  const { product_id, quantity } = req.body;
  db.run(
    "UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?",
    [quantity, product_id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: 'Inventory restocked' });
      }
    }
  );
});

module.exports = router;
