# Selloship – Inventory & Order Management System

A full-stack inventory and order management platform designed for e-commerce businesses to manage products, inventory, orders, deliveries, staff, and business operations from a centralized dashboard.

## 🚀 Overview

**Selloship** provides a complete workflow for managing inventory and orders, with dedicated dashboards for different operational roles.

The system supports:

* Product and inventory management
* Order lifecycle management
* Delivery assignment and tracking
* Role-based dashboards
* Stock monitoring and low-stock alerts
* Product image management
* Analytics and reports
* CSV-based bulk product import
* Proof-of-delivery management

## ✨ Features

### 📦 Inventory Management

* Create and manage products
* Track available stock
* Monitor low-stock products
* Manage product categories and units
* Upload product images
* Bulk import products using CSV

### 🛒 Order Management

Complete order lifecycle:

```text
NEW → PACKED → OUT FOR DELIVERY → DELIVERED
```

* Create and manage orders
* Update order status
* Manage order details
* Track order progress
* Connect orders with inventory and delivery operations

### 🚚 Delivery Management

* Assign orders to delivery partners
* Manage delivery assignments
* Track delivery status
* Upload proof of delivery
* Manage delivery partner workflows

### 👥 Role-Based Access

The application provides separate dashboards and permissions for:

| Role             | Responsibilities                                              |
| ---------------- | ------------------------------------------------------------- |
| Admin            | Full system management, analytics, users, products and orders |
| Inventory Staff  | Inventory management, stock updates and order packing         |
| Delivery Partner | Assigned deliveries, tracking and proof of delivery           |

### 📊 Analytics

Dashboard provides business insights including:

* Sales performance
* Inventory status
* Order statistics
* Delivery performance
* Revenue tracking

### 📥 CSV Product Import

Products can be added in bulk using CSV files.

Supported fields:

```text
name
price
stock
category
unit
image
```

Example:

```csv
name,price,stock,category,unit,image
Rice Bag,500,100,Groceries,kg,https://example.com/rice.jpg
```

## 🏗️ System Architecture

```text
┌───────────────────────────────┐
│        React Frontend         │
│                               │
│ Admin Dashboard               │
│ Inventory Staff Dashboard     │
│ Delivery Partner Dashboard    │
└───────────────┬───────────────┘
                │
                │ REST API
                ▼
┌───────────────────────────────┐
│       Node.js + Express       │
│                               │
│ Authentication                │
│ Products                      │
│ Inventory                     │
│ Orders                        │
│ Deliveries                    │
│ Users & Roles                 │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│            Firebase           │
│                               │
│ Authentication               │
│ Data Management              │
│ Real-time Application Data   │
└───────────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript
* HTML5
* CSS3
* Tailwind CSS
* Vite

### Backend

* Node.js
* Express.js
* REST APIs

### Database & Services

* Firebase
* Firebase Authentication
* Real-time data management

### Development Tools

* Git
* GitHub
* VS Code
* npm

## 📁 Project Structure

```text
Selloship/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── ...
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── ...
│   └── package.json
│
└── README.md
```

## 🔐 Authentication & Authorization

The application implements role-based access control to ensure users can only access functionality relevant to their role.

```text
Admin
 ├── Users
 ├── Products
 ├── Inventory
 ├── Orders
 ├── Deliveries
 └── Analytics

Inventory Staff
 ├── Inventory
 ├── Products
 └── Orders

Delivery Partner
 ├── Assigned Orders
 ├── Delivery Status
 └── Proof of Delivery
```

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd Selloship
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Install backend dependencies

```bash
cd ../backend
npm install
```

### 4. Configure environment variables

Create the required `.env` files for the frontend and backend.

Example:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

Add any required backend environment variables according to your local configuration.

### 5. Start the development server

Frontend:

```bash
cd frontend
npm run dev
```

Backend:

```bash
cd backend
npm run dev
```

## 🔄 Application Workflow

```text
Create Store
     ↓
Add Team Members
     ↓
Import / Add Products
     ↓
Manage Inventory
     ↓
Receive Orders
     ↓
Pack Orders
     ↓
Assign Delivery Partner
     ↓
Out for Delivery
     ↓
Proof of Delivery
     ↓
Delivered
```

## 🎯 Key Highlights

* Full-stack React + Node.js application
* Role-based dashboard architecture
* Inventory and order lifecycle management
* REST API based backend
* Firebase authentication and data services
* CSV bulk data import
* Responsive UI
* Delivery and proof-of-delivery workflow
* Modular and scalable application structure

## 🌐 Live Demo

**Website:**
https://selloshipsminv.netlify.app/

**Admin Portal:**
https://selloshipsminv.netlify.app/admin/login

**Staff Portal:**
https://selloshipsminv.netlify.app/staff/login

**Delivery Portal:**
https://selloshipsminv.netlify.app/delivery/login

## 📌 Project Status

**Status:** Completed / Actively maintained

## 👨‍💻 Author

**Suraj Sabu**

Web Developer

* GitHub: https://github.com/suraj-2807
* LinkedIn: https://www.linkedin.com/in/suraj-sabu-b4b40a229/
