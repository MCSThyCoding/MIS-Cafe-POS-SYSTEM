const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'cafe_pos.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      cost REAL NOT NULL,
      image TEXT,
      is_active INTEGER DEFAULT 1
    )`);

    // Inventory table
    db.run(`CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      quantity INTEGER DEFAULT 0,
      unit TEXT DEFAULT 'units',
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

    // Customers table
    db.run(`CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      total_amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'completed',
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )`);

    // Order items table
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

    // Payment tracking table
    db.run(`CREATE TABLE IF NOT EXISTS payment_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_token TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending',
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      confirmed_at DATETIME
    )`);

    // Users table for authentication
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'cashier')),
      full_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert sample users if empty
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (err) {
        console.error('Error checking users:', err.message);
        return;
      }
      if (row && row.count === 0) {
        const bcrypt = require('bcrypt');
        const saltRounds = 10;

        const sampleUsers = [
          { username: 'admin', password: 'admin123', role: 'admin', full_name: 'Admin User' },
          { username: 'cashier', password: 'cashier123', role: 'cashier', full_name: 'Cashier User' }
        ];

        sampleUsers.forEach(user => {
          const hashedPassword = bcrypt.hashSync(user.password, saltRounds);
          db.run("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)",
            [user.username, hashedPassword, user.role, user.full_name]);
        });

        console.log('Sample users inserted');
      }
    });

    // Insert sample products if empty
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
      if (err) {
        console.error('Error checking products:', err.message);
        return;
      }
      if (row && row.count === 0) {
        const sampleProducts = [
          { name: 'Espresso', category: 'Coffee', price: 2.50, cost: 0.80, image: 'Espresso.png' },
          { name: 'Americano', category: 'Coffee', price: 3.00, cost: 0.90, image: 'Americano.png' },
          { name: 'Latte', category: 'Coffee', price: 4.00, cost: 1.50, image: 'Latte.png' },
          { name: 'Cappuccino', category: 'Coffee', price: 4.00, cost: 1.60, image: 'Cappuccino.png' },
          { name: 'Mocha', category: 'Coffee', price: 4.50, cost: 1.80, image: 'Mocha.png' },
          { name: 'Green Tea', category: 'Tea', price: 3.50, cost: 1.00, image: 'Green_Tea.png' },
          { name: 'Black Tea', category: 'Tea', price: 3.00, cost: 0.80, image: 'Black_Tea.png' },
          { name: 'Chai Latte', category: 'Tea', price: 5.00, cost: 1.80, image: 'Chai_Latte.png' },
          { name: 'Iced Coffee', category: 'Cold Drinks', price: 4.50, cost: 1.50, image: 'Iced_Coffee.png' },
          { name: 'Smoothie', category: 'Cold Drinks', price: 6.00, cost: 2.50, image: 'Smoothie.png' },
          { name: 'Croissant', category: 'Food', price: 3.50, cost: 1.20, image: 'Croissant.png' },
          { name: 'Muffin', category: 'Food', price: 3.00, cost: 1.00, image: 'Muffin.png' }
        ];

        const stmt = db.prepare("INSERT INTO products (name, category, price, cost, image) VALUES (?, ?, ?, ?, ?)");
        sampleProducts.forEach(product => {
          stmt.run(product.name, product.category, product.price, product.cost, product.image);
        });
        stmt.finalize((err) => {
          if (err) {
            console.error('Error inserting products:', err.message);
            return;
          }

          // Initialize inventory for products after products are inserted
          db.all("SELECT id FROM products", (err, products) => {
            if (err) {
              console.error('Error fetching products for inventory:', err.message);
              return;
            }
            const invStmt = db.prepare("INSERT INTO inventory (product_id, quantity) VALUES (?, ?)");
            products.forEach(product => {
              invStmt.run(product.id, 50);
            });
            invStmt.finalize();
            console.log('Inventory initialized for', products.length, 'products');
          });
        });

        console.log('Sample data inserted');
      }
    });
  });
}

module.exports = db;
