const express = require('express');
const router = express.Router();
const db = require('../database');

// Daily sales report
router.get('/daily', (req, res) => {
  const { date } = req.query;
  const queryDate = date || new Date().toISOString().split('T')[0];

  db.all(
    `SELECT o.*, c.name as customer_name
     FROM orders o
     LEFT JOIN customers c ON o.customer_id = c.id
     WHERE DATE(o.order_date) = ?`,
    [queryDate],
    (err, orders) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
      const totalOrders = orders.length;

      // Calculate total cost
      db.all(
        `SELECT oi.quantity, p.cost
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN orders o ON oi.order_id = o.id
         WHERE DATE(o.order_date) = ?`,
        [queryDate],
        (err, items) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
          const profit = totalRevenue - totalCost;

          res.json({
            date: queryDate,
            totalRevenue,
            totalCost,
            profit,
            totalOrders,
            orders
          });
        }
      );
    }
  );
});

// Monthly sales report
router.get('/monthly', (req, res) => {
  const { month } = req.query; // Format: YYYY-MM
  const queryMonth = month || new Date().toISOString().slice(0, 7);

  db.all(
    `SELECT o.*, c.name as customer_name
     FROM orders o
     LEFT JOIN customers c ON o.customer_id = c.id
     WHERE strftime('%Y-%m', order_date) = ?`,
    [queryMonth],
    (err, orders) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
      const totalOrders = orders.length;

      // Calculate total cost
      db.all(
        `SELECT oi.quantity, p.cost
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN orders o ON oi.order_id = o.id
         WHERE strftime('%Y-%m', o.order_date) = ?`,
        [queryMonth],
        (err, items) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
          const profit = totalRevenue - totalCost;

          res.json({
            month: queryMonth,
            totalRevenue,
            totalCost,
            profit,
            totalOrders,
            orders
          });
        }
      );
    }
  );
});

// Yearly sales report
router.get('/yearly', (req, res) => {
  const { year } = req.query;
  const queryYear = year || new Date().getFullYear().toString();

  db.all(
    `SELECT o.*, c.name as customer_name
     FROM orders o
     LEFT JOIN customers c ON o.customer_id = c.id
     WHERE strftime('%Y', order_date) = ?`,
    [queryYear],
    (err, orders) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
      const totalOrders = orders.length;

      // Calculate total cost
      db.all(
        `SELECT oi.quantity, p.cost
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN orders o ON oi.order_id = o.id
         WHERE strftime('%Y', o.order_date) = ?`,
        [queryYear],
        (err, items) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
          const profit = totalRevenue - totalCost;

          res.json({
            year: queryYear,
            totalRevenue,
            totalCost,
            profit,
            totalOrders,
            orders
          });
        }
      );
    }
  );
});

// Sales by category
router.get('/sales-by-category', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let query = `
    SELECT p.category, SUM(oi.quantity) as total_quantity, SUM(oi.total_price) as total_revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
  `;
  const params = [];

  if (start_date && end_date) {
    query += " WHERE DATE(o.order_date) BETWEEN ? AND ?";
    params.push(start_date, end_date);
  }

  query += " GROUP BY p.category ORDER BY total_revenue DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Top selling products
router.get('/top-products', (req, res) => {
  const { limit = 10, start_date, end_date } = req.query;
  
  let query = `
    SELECT p.name, p.category, SUM(oi.quantity) as total_sold, SUM(oi.total_price) as total_revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
  `;
  const params = [];

  if (start_date && end_date) {
    query += " WHERE DATE(o.order_date) BETWEEN ? AND ?";
    params.push(start_date, end_date);
  }

  query += " GROUP BY p.id ORDER BY total_sold DESC LIMIT ?";

  db.all(query, [...params, limit], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Monthly revenue trend
router.get('/monthly-revenue', (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  
  db.all(
    `SELECT 
      strftime('%m', order_date) as month,
      SUM(total_amount) as revenue,
      COUNT(*) as orders
     FROM orders
     WHERE strftime('%Y', order_date) = ?
     GROUP BY month
     ORDER BY month`,
    [year],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  );
});

// Profit analysis (Decision Support)
router.get('/profit-analysis', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let query = `
    SELECT 
      p.name,
      p.category,
      p.price,
      p.cost,
      SUM(oi.quantity) as total_sold,
      SUM(oi.total_price) as total_revenue,
      SUM(oi.quantity * p.cost) as total_cost,
      SUM(oi.total_price) - SUM(oi.quantity * p.cost) as profit,
      ROUND((SUM(oi.total_price) - SUM(oi.quantity * p.cost)) / SUM(oi.total_price) * 100, 2) as profit_margin
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
  `;
  const params = [];

  if (start_date && end_date) {
    query += " WHERE DATE(o.order_date) BETWEEN ? AND ?";
    params.push(start_date, end_date);
  }

  query += " GROUP BY p.id ORDER BY profit DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

module.exports = router;
