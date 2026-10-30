const express = require('express');
const router = express.Router();
const db = require('../database');
const crypto = require('crypto');

// Create payment token
router.post('/create', (req, res) => {
  const { amount } = req.body;
  
  console.log('Creating payment for amount:', amount);
  
  // Generate unique payment token
  const paymentToken = crypto.randomBytes(16).toString('hex');
  console.log('Generated payment token:', paymentToken);
  
  db.run(
    "INSERT INTO payment_tracking (payment_token, status, amount) VALUES (?, 'pending', ?)",
    [paymentToken, amount],
    function(err) {
      if (err) {
        console.error('Error creating payment:', err);
        res.status(500).json({ error: err.message });
      } else {
        console.log('Payment created successfully with ID:', this.lastID);
        res.json({ 
          payment_token: paymentToken,
          payment_url: `http://172.18.107.39:5000/api/payments/confirm/${paymentToken}`
        });
      }
    }
  );
});

// Check payment status
router.get('/status/:token', (req, res) => {
  console.log('Checking status for token:', req.params.token);
  db.get(
    "SELECT * FROM payment_tracking WHERE payment_token = ?",
    [req.params.token],
    (err, row) => {
      if (err) {
        console.error('Error checking payment status:', err);
        res.status(500).json({ error: err.message });
      } else if (!row) {
        console.log('Payment not found for token:', req.params.token);
        res.status(404).json({ error: 'Payment not found' });
      } else {
        console.log('Payment status found:', row.status);
        res.json({ status: row.status });
      }
    }
  );
});

// Show payment confirmation page (this is what the QR code links to)
router.get('/confirm/:token', (req, res) => {
  db.get(
    "SELECT * FROM payment_tracking WHERE payment_token = ?",
    [req.params.token],
    (err, row) => {
      if (err) {
        res.status(500).send('Error loading payment');
      } else if (!row) {
        res.status(404).send('Payment not found');
      } else if (row.status === 'confirmed') {
        // Already confirmed, show success page
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Payment Confirmed</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 400px;
              }
              .checkmark {
                width: 80px;
                height: 80px;
                background: #10b981;
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .checkmark::after {
                content: '✓';
                color: white;
                font-size: 40px;
                font-weight: bold;
              }
              h1 {
                color: #1f2937;
                margin: 0 0 10px;
              }
              p {
                color: #6b7280;
                margin: 0;
              }
              .amount {
                font-size: 32px;
                font-weight: bold;
                color: #10b981;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="checkmark"></div>
              <h1>Payment Successful!</h1>
              <p>Your payment of</p>
              <div class="amount">$${row.amount.toFixed(2)}</div>
              <p>has been confirmed</p>
            </div>
          </body>
          </html>
        `);
      } else {
        // Show confirmation page with button
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Confirm Payment</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 400px;
              }
              .icon {
                width: 80px;
                height: 80px;
                background: #f59e0b;
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .icon::after {
                content: '$';
                color: white;
                font-size: 40px;
                font-weight: bold;
              }
              h1 {
                color: #1f2937;
                margin: 0 0 10px;
              }
              p {
                color: #6b7280;
                margin: 0;
              }
              .amount {
                font-size: 32px;
                font-weight: bold;
                color: #f59e0b;
                margin: 20px 0;
              }
              .confirm-btn {
                background: #10b981;
                color: white;
                border: none;
                padding: 15px 40px;
                font-size: 18px;
                font-weight: bold;
                border-radius: 10px;
                cursor: pointer;
                margin-top: 20px;
                transition: background 0.3s;
                width: 100%;
              }
              .confirm-btn:hover {
                background: #059669;
              }
              .confirm-btn:disabled {
                background: #9ca3af;
                cursor: not-allowed;
              }
              .cancel-btn {
                background: transparent;
                color: #6b7280;
                border: 2px solid #d1d5db;
                padding: 12px 30px;
                font-size: 16px;
                border-radius: 10px;
                cursor: pointer;
                margin-top: 10px;
                transition: all 0.3s;
              }
              .cancel-btn:hover {
                background: #f3f4f6;
                border-color: #9ca3af;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon"></div>
              <h1>Confirm Payment</h1>
              <p>You are about to pay</p>
              <div class="amount">$${row.amount.toFixed(2)}</div>
              <button class="confirm-btn" onclick="confirmPayment()">Confirm Payment</button>
              <button class="cancel-btn" onclick="window.close()">Cancel</button>
            </div>
            <script>
              async function confirmPayment() {
                const btn = document.querySelector('.confirm-btn');
                btn.disabled = true;
                btn.textContent = 'Processing...';
                
                try {
                  const response = await fetch('/api/payments/confirm/${req.params.token}/complete', {
                    method: 'POST'
                  });
                  
                  if (response.ok) {
                    document.body.innerHTML = \`
                      <div class="container">
                        <div class="checkmark"></div>
                        <h1>Payment Successful!</h1>
                        <p>Your payment of</p>
                        <div class="amount">$${row.amount.toFixed(2)}</div>
                        <p>has been confirmed</p>
                      </div>
                    \`;
                  } else {
                    btn.disabled = false;
                    btn.textContent = 'Confirm Payment';
                    alert('Failed to confirm payment');
                  }
                } catch (error) {
                  btn.disabled = false;
                  btn.textContent = 'Confirm Payment';
                  alert('Error confirming payment');
                }
              }
            </script>
          </body>
          </html>
        `);
      }
    }
  );
});

// Actually confirm the payment (called when button is clicked)
router.post('/confirm/:token/complete', (req, res) => {
  console.log('Confirming payment for token:', req.params.token);
  db.run(
    "UPDATE payment_tracking SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP WHERE payment_token = ? AND status = 'pending'",
    [req.params.token],
    function(err) {
      if (err) {
        console.error('Error confirming payment:', err);
        res.status(500).json({ error: err.message });
      } else if (this.changes === 0) {
        console.log('No rows updated - payment may already be confirmed or not found');
        res.status(400).json({ error: 'Payment already confirmed or not found' });
      } else {
        console.log('Payment confirmed successfully, rows updated:', this.changes);
        res.json({ success: true });
      }
    }
  );
});

module.exports = router;
