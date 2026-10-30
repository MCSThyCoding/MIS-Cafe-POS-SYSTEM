const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all orders
router.get('/', (req, res) => {
  const { start_date, end_date } = req.query;
  let query = `
    SELECT o.*, c.name as customer_name 
    FROM orders o 
    LEFT JOIN customers c ON o.customer_id = c.id
  `;
  const params = [];

  if (start_date && end_date) {
    query += " WHERE o.order_date BETWEEN ? AND ?";
    params.push(start_date, end_date);
  }

  query += " ORDER BY o.order_date DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Get order by ID with items
router.get('/:id', (req, res) => {
  db.get("SELECT * FROM orders WHERE id = ?", [req.params.id], (err, order) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!order) {
      res.status(404).json({ error: 'Order not found' });
    } else {
      db.all(
        `SELECT oi.*, p.name as product_name 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [req.params.id],
        (err, items) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            res.json({ ...order, items });
          }
        }
      );
    }
  });
});

// Create new order
router.post('/', (req, res) => {
  const { customer_id, items, payment_method } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Order must have at least one item' });
  }

  // Calculate total
  let total_amount = 0;
  items.forEach(item => {
    total_amount += item.quantity * item.unit_price;
  });

  db.run(
    "INSERT INTO orders (customer_id, total_amount, payment_method) VALUES (?, ?, ?)",
    [customer_id || null, total_amount, payment_method || 'cash'],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const orderId = this.lastID;
      
      // Insert order items and update inventory
      const stmt = db.prepare("INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)");
      const invStmt = db.prepare("UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?");
      
      items.forEach(item => {
        stmt.run(orderId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price);
        invStmt.run(item.quantity, item.product_id);
      });
      
      stmt.finalize();
      invStmt.finalize();

      res.json({ id: orderId, total_amount, items });
    }
  );
});

// Get today's orders
router.get('/today/stats', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  db.all(
    "SELECT * FROM orders WHERE DATE(order_date) = ?",
    [today],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        const totalOrders = rows.length;
        const totalRevenue = rows.reduce((sum, order) => sum + order.total_amount, 0);
        res.json({ totalOrders, totalRevenue, orders: rows });
      }
    }
  );
});

module.exports = router;
