# GroceryHub — Grocery Delivery Platform

A full-stack grocery delivery web application with user authentication, shopping cart management, order tracking, and an admin dashboard.

---

## Features

### Frontend
- Landing page with hero section, animated stats, categories, and product listings
- 24 products across 9 categories (Dairy, Fruits, Vegetables, Bakery, Beverages, Meat, Grains, Personal Care)
- Real-time search and price sorting
- Shopping cart with quantity controls
- Checkout with delivery slots, express delivery, and coupon codes
- User login/registration with JWT auth
- Order history with status tracking
- Wishlist for saved items
- Loyalty points system
- Fully responsive design

### Backend API
- RESTful API with full CRUD for products, cart, orders, and users
- JWT-based authentication
- MongoDB with Mongoose ODM
- Secure password hashing with bcryptjs
- Error handling middleware

---

## Quick Start

### Prerequisites
- Node.js v16+
- MongoDB (local or cloud)

### Setup
```bash
# Install backend dependencies
cd server
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET

# Seed the database with products
npm run seed

# Start the server
npm run dev
```

Open [http://localhost:5000](http://localhost:5000)

---

## API Endpoints

All endpoints are prefixed with `/api`.

### Auth
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /users/register | No |
| POST | /users/login | No |
| GET | /users/profile | JWT |
| PUT | /users/profile | JWT |

### Products
| Method | Endpoint |
|--------|----------|
| GET | /products |
| GET | /products/:id |
| POST | /products |
| PUT | /products/:id |
| DELETE | /products/:id |

### Cart (JWT required)
| Method | Endpoint |
|--------|----------|
| GET | /cart |
| POST | /cart |
| PUT | /cart/:productId |
| DELETE | /cart/:productId |
| DELETE | /cart |

### Orders (JWT required)
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /orders | JWT |
| GET | /orders | JWT |
| GET | /orders/:id | JWT |
| GET | /orders/all | Admin |
| PUT | /orders/:id/status | Admin |

---

## Project Structure

```
client/          Frontend HTML, CSS, JS
  css/style.css  Main stylesheet
  js/            Application scripts + API helper
  images/        Product images (SVG + PNG)
  *.html         Page templates

server/          Backend Node.js/Express
  config/        MongoDB connection
  controllers/   Route handlers
  middleware/    Auth + error handling
  models/        Mongoose schemas
  routes/        API route definitions
  server.js      Entry point
  seeder.js      Database seed script
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript (ES6) |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |

---

## Pages

- `/` — Home (hero, stats, categories, products, testimonials, newsletter)
- `/cart.html` — Shopping cart
- `/checkout.html` — Order checkout
- `/orders.html` — Order history
- `/wishlist.html` — Saved items
- `/login.html` — Login/Register
- `/order-success.html` — Order confirmation

---

## License

MIT