
# 📦 Inventory_API

A RESTful API for managing products and inventory with features like product creation, update, deletion, and searching. Built with Node.js, Express, and MongoDB.

---

## 🚀 Features

- 🔹 Create, read, update, and delete products  
- 🔹 Image upload & management with Cloudinary  
- 🔹 Product search with pagination  
- 🔹 User authentication & role-based access control (planned)  
- 🔹 Product filtering by category, brand, and availability  
- 🔹 Clean and consistent API responses  
- 🔹 Robust error handling

---

## 🛠️ Tech Stack

- Node.js & Express.js  
- MongoDB & Mongoose  
- Cloudinary for image storage  
- bcrypt for password hashing  
- JWT (planned for authentication)  
- Async/Await for asynchronous operations  

---

## 📁 API Endpoints

| Method | Endpoint             | Description                         |
|--------|----------------------|-----------------------------------|
| POST   | `/products`          | Create a new product               |
| GET    | `/products`          | Get all products with pagination  |
| GET    | `/products/:id`      | Get product details by ID          |
| PATCH  | `/products/:id`      | Update product by ID               |
| DELETE | `/products/:id`      | Delete product by ID               |
| GET    | `/products/search`   | Search products by query           |
| GET    | `/products/mine`     | Get products created by the user  |

---

## ⚙️ Environment Variables

Create a `.env` file and add the following:

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=your_access_token_expiry
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=your_refresh_token_expiry

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

APP_GMAIL=your_email@gmail.com
APP_PASSWORD=your_email_password
```

---

## 🧑‍💻 How to Run Locally

1. Clone the repo  
   ```bash
   git clone https://github.com/ANKITKUMARBARIK/Inventory_API.git
   cd inventory_api
   ```

2. Install dependencies  
   ```bash
   npm install
   ```

3. Add your `.env` file with proper credentials

4. Start the server  
   ```bash
   npm run dev
   ```

5. API will be running on `http://localhost:8000`

---

## 🤝 Contribution

Contributions are welcome! Feel free to open issues or submit pull requests.

---

## 📄 License

GNU License © 2025

---

## 💬 Contact

For any questions, contact me at:  
**ankitbarik.dev@gmail.com**

---

Made with ❤️ by **Kumar**
