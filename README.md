# Orders Admin Management System - Backend

## Description

This project is the backend of the **Orders Admin Management System**, developed using **Node.js**, **Express.js**, **MongoDB**, and **Mongoose**.

The backend provides a secure REST API that manages authentication, products, customers, orders, reports, and business logic. It communicates with the React Native frontend and stores all application data in MongoDB.

---

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt
- dotenv
- CORS
- Nodemon

---

## Main Features

### Authentication

- User registration
- User login
- Password hashing with bcrypt
- JWT authentication
- Role-based authorization (Admin & Customer)

### Product Management

- Create products
- Update products
- Delete products
- Retrieve all products
- Search products
- Store product image URLs
- Manage product stock

### Order Management

- Create new orders
- Update existing orders
- Delete orders
- Change order status
- Cancel orders
- Restore stock after cancellation
- Save customer details
- Store payment method and order notes

### Customer Management

- Retrieve customers
- Add new customers
- Update customer information
- Delete customers
- Automatically create customer records after registration
- Synchronize customer information from orders

### Reports & Statistics

- Total orders
- Total products
- Total customers
- Total revenue
- Pending orders
- Completed orders
- Cancelled orders
- Low stock products

---

## Installation

Install project dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the project root.

Example:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/orders_admin_db
JWT_SECRET=secret_key
ADMIN_EMAIL=admin@example.com
```

---

## Running the Server

Start the development server:

```bash
npm run dev
```

The server will run on:

```text
http://localhost:5000
```

API Base URL:

```text
http://localhost:5000/api
```

---

## API Endpoints

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### Products

```http
GET    /api/products
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id
```

### Orders

```http
GET    /api/orders
POST   /api/orders
PATCH  /api/orders/:id
PATCH  /api/orders/:id/status
DELETE /api/orders/:id
```

### Customers

```http
GET    /api/customers
POST   /api/customers
PATCH  /api/customers/:id
DELETE /api/customers/:id
```

---

## Project Structure

```text
src/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
└── app.js
```

---

## Skills Demonstrated

- Backend Development
- REST API Design
- MongoDB & Mongoose
- JWT Authentication
- Password Security (bcrypt)
- CRUD Operations
- Express.js Routing
- Environment Variables
- Business Logic Implementation

---

## Notes

- MongoDB must be running before starting the server.
- The frontend application requires this backend to be running.
- Do not upload the `.env` file to GitHub.
- Do not upload the `node_modules` folder.
- Use a secure JWT secret in production.

---

## Author

**Gharam Aluka**

Software Engineering Student  
Full Stack Developer
