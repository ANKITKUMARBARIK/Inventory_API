import { Router } from "express";
import { createProduct } from "../controllers/product.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router
    .route("/create-product")
    .post(verifyJWT, upload.array("images"), createProduct);

export default router;
