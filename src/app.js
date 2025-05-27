import express from "express";
import { fileSize } from "./constants.js";
import helmet from "helmet";
import cookieParser from "cookie-parser";
const app = express();

app.use(helmet());
app.use(express.urlencoded({ extended: true, limit: fileSize }));
app.use(express.json({ limit: fileSize }));
app.use(express.static("public"));
app.use(cookieParser());

// route imports
import userRouter from "./routes/user.route.js";

// route declarations
app.use("/api/v1/users", userRouter);

export default app;
