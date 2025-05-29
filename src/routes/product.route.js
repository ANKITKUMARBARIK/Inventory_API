import { Router } from "express";
import {
    createProduct,
    deleteProductById,
    getAllProducts,
    getMyProducts,
    getProductById,
    searchProducts,
    updateProductById,
} from "../controllers/product.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router
    .route("/create-product")
    .post(verifyJWT, upload.array("images"), createProduct);

router.route("/get-all-products").get(verifyJWT, getAllProducts);

router.route("/get-user-product/:id").get(verifyJWT, getProductById);

router.route("/update-user-product/:id").patch(verifyJWT, updateProductById);

router.route("/delete-user-product/:id").delete(verifyJWT, deleteProductById);

router.route("/get-my-products").get(verifyJWT, getMyProducts);

router.route("/search-products").get(verifyJWT, searchProducts);

export default router;
