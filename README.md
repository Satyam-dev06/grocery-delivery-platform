<div align="center">

# 🛒 GroceryHub

### *A Modern Full-Stack Grocery Delivery Platform*

[![Netlify Status](https://img.shields.io/badge/deployed%20on-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://groceryhub.netlify.app)
[![Render](https://img.shields.io/badge/backend%20on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://grocery-delivery-platform-5o0b.onrender.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)

[![Stars](https://img.shields.io/github/stars/satyamdev/groceryhub?style=flat-square&logo=github&color=yellow)](https://github.com/satyamdev/groceryhub)
[![Forks](https://img.shields.io/github/forks/satyamdev/groceryhub?style=flat-square&logo=github&color=blue)](https://github.com/satyamdev/groceryhub/network)
[![Issues](https://img.shields.io/github/issues/satyamdev/groceryhub?style=flat-square&logo=github&color=red)](https://github.com/satyamdev/groceryhub/issues)
[![License](https://img.shields.io/github/license/satyamdev/groceryhub?style=flat-square&logo=github&color=brightgreen)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/satyamdev/groceryhub?style=flat-square&logo=github&color=orange)](https://github.com/satyamdev/groceryhub/commits/main)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)
[![Node Version](https://img.shields.io/badge/node-%3E%3D16.0-339933?style=flat-square&logo=node.js)](https://nodejs.org)

---

**GroceryHub** is a full-stack grocery delivery web application that lets users browse products, manage a wishlist & cart, place orders, manage addresses, and track their order history all wrapped in a beautiful, responsive UI. Built with **HTML5, CSS3, JavaScript (ES6+)** on the frontend and **Node.js, Express.js, MongoDB Atlas** on the backend.

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [📸 Screenshots](#-screenshots)
- [🚀 Live Demo](#-live-demo)
- [⚙️ Installation](#installation)
- [🔐 Environment Variables](#-environment-variables)
- [📡 API Endpoints](#-api-endpoints)
- [👨‍💻 Usage Guide](#-usage-guide)
- [🗺️ Roadmap & Future Improvements](#roadmap--future-improvements)
- [📚 Learning Outcomes](#-learning-outcomes)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👤 Author](#-author)

---

## ✨ Features

### 🔐 Authentication

| Feature | Description |
|---------|-------------|
| User Registration | Create an account with name, email, and password |
| Login / Logout | Secure JWT-based authentication |
| Protected Routes | Cart, orders, profile require authentication |
| Session Management | Auto-redirect on token expiry |
| Password Hashing | bcryptjs for secure credential storage |

### 📦 Products

| Feature | Description |
|---------|-------------|
| Product Listing | Browse 24+ products across 9 categories |
| Product Details | Dedicated page with images, price, rating, stock info |
| Search | Real-time product search by name |
| Category Filter | Filter by Dairy, Fruits, Vegetables, Bakery, and more |
| Price Sorting | Sort by price low-to-high or high-to-low |
| Pagination | Navigate through product pages |
| Responsive Cards | Modern card grid with hover effects |

### 🛍️ Shopping

| Feature | Description |
|---------|-------------|
| Shopping Cart | Add/remove items, update quantities |
| Wishlist | Save products for later purchase |
| Buy Now | Direct purchase from product page |
| Quantity Controls | Increment/decrement item quantities |
| Floating Cart | Mini cart indicator in the header |
| Coupon Codes | Apply discount coupons at checkout |

### 📑 Orders

| Feature | Description |
|---------|-------------|
| Place Orders | Create orders from cart with delivery address |
| Order History | View all past orders |
| Order Details | Track order status, items, and pricing |
| Cancel Orders | Cancel pending or confirmed orders |
| Delivery Slots | Choose delivery time slots |
| Express Delivery | Option for faster delivery (extra charges) |
| Order Tracking | Real-time order status updates |
| Payment Status | Track payment confirmation |

### 👤 User Profile

| Feature | Description |
|---------|-------------|
| Profile Management | Update name, email, phone, and avatar |
| Address Management | Add, edit, delete multiple addresses |
| Default Address | Set a default delivery address |
| Loyalty Points | Earn rewards on every purchase |
| Notification Preferences | Manage email and in-app notifications |

### 🎨 UI/UX

| Feature | Description |
|---------|-------------|
| Responsive Design | Fully functional on mobile, tablet, and desktop |
| Modern Animations | Smooth transitions, hover effects, loading states |
| Toast Notifications | Non-intrusive success/error messages |
| Loading Skeletons | Placeholder animations while content loads |
| Product Gallery | Image gallery with zoom/hover effect on details page |
| Floating Action Button | Scroll-to-top button |
| Newsletter Signup | Email subscription section |
| Hero Section | Animated stats counters and featured categories |

### 🛡️ Admin Dashboard

| Feature | Description |
|---------|-------------|
| Dashboard Analytics | Revenue, orders, users overview |
| User Management | View, edit, delete users |
| Order Management | View & update order statuses |
| Product Management | CRUD operations on products |
| Coupon Management | Create, edit, delete discount coupons |
| Payment Tracking | View payments, process refunds |
| Notifications | Send announcements to users |
| Settings | Configure platform settings |

---

## 🛠 Tech Stack

<details>
<summary><strong>📱 Frontend</strong></summary>

| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic page structure and markup |
| **CSS3** | Styling, animations, responsive layout |
| **JavaScript (ES6+)** | Dynamic functionality, API calls, DOM manipulation |
| **Font Awesome 6** | Icon library for UI elements |
| **CSS Flexbox & Grid** | Responsive layouts without external frameworks |

</details>

<details>
<summary><strong>⚙️ Backend</strong></summary>

| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime environment |
| **Express.js** | Web framework for RESTful API |
| **MongoDB Atlas** | Cloud NoSQL database |
| **Mongoose** | ODM for MongoDB schema and validation |
| **JSON Web Token (JWT)** | Stateless authentication |
| **bcryptjs** | Password hashing |
| **Nodemailer** | Email notifications |
| **CORS** | Cross-origin resource sharing |
| **dotenv** | Environment variable management |

</details>

<details>
<summary><strong>☁️ Deployment</strong></summary>

| Service | Layer |
|---------|-------|
| **Netlify** | Frontend hosting (static files) |
| **Render** | Backend API hosting |
| **MongoDB Atlas** | Cloud database |
| **GitHub** | Version control and source code |

</details>

---

## 📁 Project Structure

```
groceryhub/
|
+-- client/                          # Frontend Application
|   +-- css/
|   |   +-- style.css                # Main stylesheet
|   |   +-- admin.css                # Admin dashboard styles
|   |   +-- profile.css              # Profile page styles
|   |
|   +-- js/
|   |   +-- api.js                   # Centralized API client
|   |   +-- app.js                   # Core app initialization
|   |   +-- admin.js                 # Admin panel navigation
|   |   +-- products.js              # Product listing
|   |   +-- product-details.js       # Single product view
|   |   +-- cart.js                  # Cart management
|   |   +-- checkout.js              # Checkout flow
|   |   +-- orders.js                # Order history
|   |   +-- order-details.js         # Single order view
|   |   +-- order-tracking.js        # Live order tracking
|   |   +-- login.js                 # Auth forms
|   |   +-- profile.js               # User profile
|   |   +-- address.js               # Address CRUD
|   |   +-- payment.js               # Payment processing
|   |   +-- wishlist.js              # Wishlist management
|   |   +-- notifications.js         # Notification system
|   |   +-- newsletter.js            # Newsletter signup
|   |   +-- counter.js               # Animated stats
|   |   +-- scroll-top.js            # Scroll-to-top button
|   |
|   +-- admin/                       # Admin Panel Pages
|   |   +-- index.html               # Dashboard
|   |   +-- users.html               # User management
|   |   +-- orders.html              # Order management
|   |   +-- products.html            # Product management
|   |   +-- payments.html            # Payment tracking
|   |   +-- coupons.html             # Coupon management
|   |   +-- analytics.html           # Sales analytics
|   |   +-- settings.html            # Platform settings
|   |   +-- js/                      # Admin JS controllers
|   |
|   +-- images/                      # Product images
|   +-- index.html                   # Home page
|   +-- login.html                   # Login & Register
|   +-- cart.html                    # Shopping cart
|   +-- checkout.html                # Checkout
|   +-- wishlist.html                # Saved items
|   +-- orders.html                  # Order history
|   +-- order-details.html           # Order details
|   +-- order-tracking.html          # Order tracking
|   +-- order-success.html           # Order confirmation
|   +-- payment.html                 # Payment page
|   +-- product-details.html         # Product details
|   +-- address.html                 # Address management
|   +-- profile.html                 # User profile
|   +-- notifications.html           # Notifications
|
+-- server/                          # Backend API
|   +-- config/
|   |   +-- db.js                    # MongoDB connection
|   |
|   +-- models/                      # Mongoose Schemas
|   |   +-- User.js
|   |   +-- Product.js
|   |   +-- Cart.js
|   |   +-- Order.js
|   |   +-- Address.js
|   |   +-- Wishlist.js
|   |   +-- Payment.js
|   |   +-- Coupon.js
|   |   +-- Notification.js
|   |   +-- Settings.js
|   |
|   +-- controllers/                 # Route Handlers
|   |   +-- productController.js
|   |   +-- userController.js
|   |   +-- cartController.js
|   |   +-- orderController.js
|   |   +-- addressController.js
|   |   +-- wishlistController.js
|   |   +-- paymentController.js
|   |   +-- couponController.js
|   |   +-- notificationController.js
|   |   +-- adminController.js
|   |
|   +-- middleware/
|   |   +-- authMiddleware.js
|   |   +-- errorMiddleware.js
|   |
|   +-- routes/
|   |   +-- productRoutes.js
|   |   +-- userRoutes.js
|   |   +-- cartRoutes.js
|   |   +-- orderRoutes.js
|   |   +-- addressRoutes.js
|   |   +-- wishlistRoutes.js
|   |   +-- paymentRoutes.js
|   |   +-- couponRoutes.js
|   |   +-- notificationRoutes.js
|   |   +-- adminRoutes.js
|   |
|   +-- utils/
|   |   +-- generateToken.js
|   |   +-- email.js
|   |   +-- notificationHelper.js
|   |
|   +-- server.js                    # Entry point
|   +-- seeder.js                    # Database seeder
|   +-- seedAdmin.js                 # Admin seeder
|   +-- package.json
|
+-- netlify.toml                     # Netlify config
+-- package.json                     # Root package config
+-- README.md                        # Documentation
```

---

## 📸 Screenshots

<div align="center">

### Home Page

<img src="https://via.placeholder.com/800x450/2d3436/ffffff?text=Home+Page" alt="Home Page" width="80%" style="border-radius:8px;"/>

*Hero section with animated stats, category cards, and featured products*

---

### Product Listing

<img src="https://via.placeholder.com/800x450/2d3436/ffffff?text=Product+Listing" alt="Product Listing" width="80%" style="border-radius:8px;"/>

*Product grid with search, filter, and sorting*

---

### Product Details

<img src="https://via.placeholder.com/800x450/2d3436/ffffff?text=Product+Details" alt="Product Details" width="80%" style="border-radius:8px;"/>

*Full product view with images, pricing, and stock*

---

### Shopping Cart

<img src="https://via.placeholder.com/800x450/2d3436/ffffff?text=Shopping+Cart" alt="Cart" width="80%" style="border-radius:8px;"/>

*Cart with quantity controls, summary, and coupon input*

---

### Checkout

<img src="https://via.placeholder.com/800x450/2d3436/ffffff?text=Checkout" alt="Checkout" width="80%" style="border-radius:8px;"/>

*Checkout with address, delivery slots, and payment*

---

### Orders

<img src="https://via.placeholder.com/800x450/2d3436/ffffff?text=Orders" alt="Orders" width="80%" style="border-radius:8px;"/>

*Order history with status tracking*

---

### User Profile

<img src="https://via.placeholder.com/800x450/2d3436/ffffff?text=User+Profile" alt="Profile" width="80%" style="border-radius:8px;"/>

*Profile management with address book and loyalty points*

---

### Admin Dashboard

<img src="https://via.placeholder.com/800x450/2d3436/ffffff?text=Admin+Dashboard" alt="Admin Dashboard" width="80%" style="border-radius:8px;"/>

*Admin panel with analytics, orders, and user management*

</div>

---

## 🚀 Live Demo

| Platform | URL | Status |
|----------|-----|--------|
| Frontend (Netlify) | [groceryhub.netlify.app](https://groceryhub.netlify.app) | Live |
| Backend API (Render) | [api-endpoint](https://grocery-delivery-platform-5o0b.onrender.com) | Live |
| Database | MongoDB Atlas Cluster | Connected |

---

## ⚙️ Installation

### Prerequisites

- Node.js v16 or higher
- MongoDB (local or Atlas)
- A code editor (VS Code recommended)
- Git for version control

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/satyamdev/groceryhub.git
cd groceryhub

# 2. Install backend dependencies
cd server
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 4. Seed the database with products & admin account
npm run seed

# 5. Start the development server
npm run dev
```

The server will start on **http://localhost:5000**

### Alternative Quick Setup

```bash
npm run setup
npm run seed
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file in `server/`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB (Local)
MONGO_URI=mongodb://localhost:27017/groceryhub

# OR MongoDB Atlas:
# MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/groceryhub

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=30d

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 📡 API Endpoints

All endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/users/register | No | Register a new user |
| POST | /api/users/login | No | Login and receive JWT |
| GET | /api/users/profile | JWT | Get user profile |
| PUT | /api/users/profile | JWT | Update user profile |

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/products | No | All products (search/filter/sort) |
| GET | /api/products/:id | No | Single product by ID |
| POST | /api/products | No | Create a product |
| PUT | /api/products/:id | No | Update a product |
| DELETE | /api/products/:id | No | Delete a product |

### Cart

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/cart | JWT | Get user cart |
| POST | /api/cart | JWT | Add item to cart |
| PUT | /api/cart/:productId | JWT | Update quantity |
| DELETE | /api/cart/:productId | JWT | Remove item |
| DELETE | /api/cart | JWT | Clear cart |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/orders | JWT | Place a new order |
| GET | /api/orders | JWT | Get my orders |
| GET | /api/orders/:id | JWT | Get order by ID |
| PUT | /api/orders/cancel/:id | JWT | Cancel an order |
| GET | /api/orders/all | Admin | Get all orders |
| PUT | /api/orders/status/:id | Admin | Update order status |

### Wishlist

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/wishlist | JWT | Get wishlist |
| POST | /api/wishlist | JWT | Add to wishlist |
| DELETE | /api/wishlist/:productId | JWT | Remove from wishlist |
| DELETE | /api/wishlist | JWT | Clear wishlist |

### Addresses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/address | JWT | Get all addresses |
| POST | /api/address | JWT | Add an address |
| GET | /api/address/:id | JWT | Get address by ID |
| PUT | /api/address/:id | JWT | Update address |
| DELETE | /api/address/:id | JWT | Delete address |
| PUT | /api/address/default/:id | JWT | Set default address |

### Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/payment/create | JWT | Create a payment |
| POST | /api/payment/verify | JWT | Verify payment |
| GET | /api/payment/:orderId | JWT | Get payment by order |
| POST | /api/payment/refund/:orderId | Admin | Process refund |

### Coupons

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/coupons/apply | JWT | Apply coupon code |
| GET | /api/coupons/:code | JWT | Get coupon details |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/notifications | JWT | Get notifications |
| GET | /api/notifications/unread | JWT | Unread count |
| PUT | /api/notifications/read/:id | JWT | Mark as read |
| PUT | /api/notifications/read-all | JWT | Mark all read |
| DELETE | /api/notifications/:id | JWT | Delete notification |
| DELETE | /api/notifications | JWT | Delete all |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/admin/dashboard | Admin | Dashboard stats |
| GET | /api/admin/users | Admin | Get all users |
| PUT | /api/admin/users/:id | Admin | Update user |
| DELETE | /api/admin/users/:id | Admin | Delete user |
| GET | /api/admin/orders | Admin | Get all orders |
| PUT | /api/admin/orders/:id | Admin | Update order |
| GET | /api/admin/payments | Admin | Get payments |
| POST | /api/admin/payments/refund/:orderId | Admin | Refund payment |
| GET | /api/admin/coupons | Admin | Get coupons |
| POST | /api/admin/coupons | Admin | Create coupon |
| PUT | /api/admin/coupons/:id | Admin | Update coupon |
| DELETE | /api/admin/coupons/:id | Admin | Delete coupon |
| GET | /api/admin/analytics | Admin | Get analytics |
| GET | /api/admin/settings | Admin | Get settings |
| PUT | /api/admin/settings | Admin | Update settings |

---

## 👨‍💻 Usage Guide

<details>
<summary><strong>For Customers</strong></summary>

1. Browse Products on the home page or product grid
2. Search and filter by category or price
3. Click any product for full details
4. Add items to cart with desired quantity
5. Click the heart icon to save items to wishlist
6. Proceed to checkout from cart with coupon if available
7. Select or add a delivery address
8. Choose delivery slot and payment method
9. Confirm and place the order
10. Track orders from the Orders page

</details>

<details>
<summary><strong>For Admin</strong></summary>

1. Dashboard shows revenue, orders, and user metrics
2. Manage products: add, update prices/stock, delete
3. Manage orders: view all, update status
4. Manage users: view, edit roles, remove accounts
5. Create and manage discount coupons
6. Track payments and process refunds
7. View analytics and configure settings
8. Send notifications to all users

</details>

---

## 🗺️ Roadmap & Future Improvements

### Completed

- User Authentication (Register/Login/JWT)
- Product Catalog with Search and Filter
- Shopping Cart and Checkout
- Wishlist Management
- Order Management and Tracking
- Address Management
- User Profile and Loyalty Points
- Coupon and Discount System
- Admin Dashboard
- Notifications System

### Planned

- Payment Gateway Integration (Razorpay/Stripe)
- Real-Time Order Tracking (WebSockets)
- Inventory Management with Stock Alerts
- Advanced Admin Analytics with Charts
- Email Notifications
- AI Product Recommendations
- Voice Search
- PWA Support (Offline mode)
- Dark Mode
- Multi-language Support
- Social Login (Google/GitHub)
- Mobile App (React Native)
- Product Reviews and Ratings
- Subscription Service

---

## 📚 Learning Outcomes

| Skill | What I Learned |
|-------|----------------|
| REST API Design | Building scalable RESTful endpoints |
| MongoDB and Mongoose | Schema design and aggregation pipelines |
| JWT Authentication | Token generation and protected routes |
| Responsive Design | CSS Flexbox/Grid and media queries |
| State Management | localStorage and API sync |
| Debugging | Server logging and browser DevTools |
| Deployment | Netlify, Render, and MongoDB Atlas |
| API Integration | Centralized client with error handling |
| Git Version Control | Branching, merging, and workflows |
| Project Architecture | MVC pattern and middleware chains |
| Code Quality | Consistent style and modular structure |
| Performance | Image optimization and lazy loading |

---

## 🤝 Contributing

Contributions are greatly appreciated!

### How to Contribute

1. Fork the repository
2. Create a branch: `git checkout -b feature/AmazingFeature`
3. Make your changes with clean code
4. Test thoroughly
5. Commit: `git commit -m 'Add some feature'`
6. Push: `git push origin feature/AmazingFeature`
7. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

```
MIT License

Copyright (c) 2025 Satyam Dev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions...
```

---

## 👤 Author

<div align="center">

### Satyam Dev

[![GitHub](https://img.shields.io/badge/GitHub-satyamdev-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/satyamdev)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Satyam%20Dev-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/satyamdev)
[![Email](https://img.shields.io/badge/Email-satyam%40example.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:satyam@example.com)

Full-Stack Web Developer passionate about building modern, scalable web applications with clean architecture and delightful user experiences.

</div>

---

<div align="center">

### If you found this project helpful, consider giving it a star!

### Happy Coding!

</div>