# Coffee Shop Web-Based POS System

A comprehensive Point of Sale (POS) system for a coffee shop, designed as a Management Information Systems (MIS) assignment project. This system demonstrates practical applications of TPS, MIS, DSS, and data visualization in a real-world business scenario.

## 📋 MIS Assignment Alignment

This project addresses all five core assignment types from the MIS course:

### 1. Business Case Study Analysis ✅
**Current Information Systems Identified:**
- **TPS (Transaction Processing System):** Real-time order processing, inventory updates, and payment handling
- **MIS (Management Information System):** Daily sales reports, inventory tracking, and customer data management
- **DSS (Decision Support System):** Profit analysis, product performance metrics, and investment recommendations

**Operational Problems Addressed:**
- Manual order tracking errors
- Inefficient inventory management
- Lack of real-time sales data
- Difficulty in identifying profitable products

**Recommended Improvements Implemented:**
- Automated order processing with instant inventory updates
- Real-time dashboard with key performance indicators
- Low stock alerts to prevent stockouts
- Data-driven decision support for product investments

### 2. System Design Project ✅
**System Flowchart Components:**
```
Customer Order → Product Selection → Cart Management → Payment Processing
     ↓                    ↓                    ↓                    ↓
Product Lookup      Inventory Check    Order Creation    Transaction Recording
     ↓                    ↓                    ↓                    ↓
Price Calculation   Stock Deduction    Order Items      Revenue Update
```

**Database Design:**
- `products` - Product catalog with pricing and cost data
- `inventory` - Stock levels and inventory tracking
- `customers` - Customer information management
- `orders` - Transaction records with payment methods
- `order_items` - Detailed order line items

### 3. Decision Support Scenario ✅
**Strategic Decision Support:**
- **Question:** "Which product type should the company invest more in?"
- **Data Provided:** Sales data, cost data, profit margins, and sales trends
- **Analysis:** Profit analysis report shows:
  - Revenue per product
  - Cost per product
  - Profit margin percentage
  - Total units sold
- **Decision Making:** Sort products by profit to identify high-margin items for investment

### 4. Excel / Data Analysis Task ✅
**Data Visualization Features:**
- **Pie Charts:** Sales distribution by category
- **Bar Charts:** Top-selling products comparison
- **Line Charts:** Monthly revenue trends
- **Tables:** Detailed profit analysis with sortable data
- **Export Function:** Download reports as text files for further analysis

### 5. Business Process Mapping ✅

**As-Is Process (Manual System):**
```
Customer places order → Staff writes on paper → Manual calculation
     ↓                      ↓                      ↓
Check inventory manually  →  Payment handling    →  Record in notebook
     ↓                      ↓                      ↓
Update stock later      →  End of day tally   →  Manual report generation
```

**To-Be Process (Automated System):**
```
Customer selects products → System checks inventory → Auto-calculate total
     ↓                        ↓                        ↓
Instant stock update   →  Digital payment   →  Automatic order recording
     ↓                        ↓                        ↓
Real-time dashboard   →  Live reports      →  Data-driven insights
```

## 🏗️ System Architecture

### Technology Stack
- **Frontend:** React 18, Vite, TailwindCSS, Recharts
- **Backend:** Node.js, Express.js
- **Database:** SQLite
- **Icons:** Lucide React

### Project Structure
```
MIS-cafe-webbased-POS/
├── backend/
│   ├── server.js              # Express server setup
│   ├── database.js            # SQLite database initialization
│   ├── routes/
│   │   ├── products.js        # Product management API
│   │   ├── orders.js          # Order processing API
│   │   ├── inventory.js       # Inventory management API
│   │   └── reports.js         # Reports and analytics API
│   └── cafe_pos.db            # SQLite database (auto-generated)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── POS.jsx        # Point of Sale interface
│   │   │   ├── Dashboard.jsx  # Analytics dashboard
│   │   │   ├── Inventory.jsx  # Inventory management
│   │   │   └── Reports.jsx    # Reports and DSS
│   │   ├── api/
│   │   │   └── api.js         # API client configuration
│   │   ├── App.jsx            # Main application with routing
│   │   ├── main.jsx           # React entry point
│   │   └── index.css          # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── package.json               # Root package.json
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install all dependencies:**
```bash
npm run install:all
```

2. **Start the development servers:**
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend server on `http://localhost:3000`

3. **Access the application:**
Open your browser and navigate to `http://localhost:3000`

## 📱 Features

### Point of Sale (POS)
- Product catalog with category filtering
- Add/remove items from cart
- Quantity adjustment
- Cash and card payment methods
- Real-time cart total calculation
- Order completion with automatic inventory updates

### Dashboard
- Today's revenue and orders
- Average order value
- Sales by category (pie chart)
- Top-selling products (bar chart)
- Recent orders table

### Inventory Management
- Real-time stock levels
- Low stock alerts (threshold: 10 units)
- Stock level indicators (Good/Medium/Low)
- Quick restock functionality
- Search and filter products
- Total stock value calculation

### Reports & Analytics
- Daily sales reports with date selection
- Revenue, cost, and profit calculations
- Monthly revenue trend analysis
- Profit analysis by product (DSS)
- Export reports to text file
- MIS assignment context documentation

## 📊 Sample Data

The system comes pre-loaded with sample products:

**Coffee:**
- Espresso ($3.50)
- Americano ($4.00)
- Latte ($4.50)
- Cappuccino ($4.50)
- Mocha ($5.00)

**Tea:**
- Green Tea ($3.00)
- Black Tea ($2.50)
- Chai Latte ($4.50)

**Cold Drinks:**
- Iced Coffee ($4.00)
- Smoothie ($5.50)

**Food:**
- Croissant ($3.00)
- Muffin ($2.50)

All products start with 50 units in inventory.

## 🔧 API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product (soft delete)

### Orders
- `GET /api/orders` - Get all orders (with optional date range)
- `GET /api/orders/:id` - Get order by ID with items
- `POST /api/orders` - Create new order
- `GET /api/orders/today/stats` - Get today's order statistics

### Inventory
- `GET /api/inventory` - Get all inventory with product details
- `GET /api/inventory/low-stock` - Get low stock items
- `PUT /api/inventory/:id` - Update inventory quantity
- `POST /api/inventory/restock` - Restock inventory

### Reports
- `GET /api/reports/daily` - Daily sales report
- `GET /api/reports/sales-by-category` - Sales breakdown by category
- `GET /api/reports/top-products` - Top-selling products
- `GET /api/reports/monthly-revenue` - Monthly revenue trend
- `GET /api/reports/profit-analysis` - Profit analysis for DSS

## 🎓 Assignment Usage Guide

### For Business Case Study Analysis:
1. Navigate to the Dashboard to view current system performance
2. Check Reports → Profit Analysis to identify operational problems
3. Use the data to recommend improvements (already implemented)

### For System Design Project:
1. Review the database schema in `backend/database.js`
2. Examine the API routes in `backend/routes/`
3. Document the system flow from order placement to reporting

### For Decision Support Scenario:
1. Go to Reports → Profit Analysis
2. Analyze the profit margins and total profit by product
3. Answer: "Which product should we invest more in?" based on the data

### For Excel/Data Analysis Task:
1. Use the Dashboard charts for data visualization
2. Export reports from the Reports page
3. Analyze trends in monthly revenue and product performance

### For Business Process Mapping:
1. Compare manual vs automated processes in the README
2. Document the As-Is and To-Be workflows
3. Highlight improvements in efficiency and accuracy

## 📝 Notes for Assignment Submission

**Key MIS Concepts Demonstrated:**
- **Transaction Processing:** Every order automatically updates inventory and records transaction data
- **Management Information:** Daily reports provide managers with essential operational data
- **Decision Support:** Profit analysis helps make strategic product investment decisions
- **Data Flow:** Information flows seamlessly from POS to inventory to reports
- **System Integration:** All components work together to support business operations

**Business Value:**
- Reduced order processing time
- Eliminated manual calculation errors
- Real-time inventory visibility
- Data-driven decision making
- Improved customer service

## 🛠️ Development

**Running backend only:**
```bash
cd backend
npm run dev
```

**Running frontend only:**
```bash
cd frontend
npm run dev
```

**Building for production:**
```bash
cd frontend
npm run build
```

## 📄 License

This project is created for educational purposes as part of a Management Information Systems assignment.
