import express from "express";
import { fileSize } from "./constants.js";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true, limit: fileSize }));
app.use(express.json({ limit: fileSize }));
app.use(express.static("public"));
app.use(cookieParser());

// route imports
import userRouter from "./routes/user.route.js";
import productRouter from "./routes/product.route.js";

// route declarations
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);

export default app;
