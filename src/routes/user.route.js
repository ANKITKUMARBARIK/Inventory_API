import { Router } from "express";
import upload from "../middlewares/multer.middleware.js";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    verifyOtpSignup,
    forgetUserPassword,
    resetUserPassword,
} from "../controllers/user.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/verify-signup").post(verifyOtpSignup);

router.route("/forget-password").post(forgetUserPassword);

router.route("/reset-password/:token").post(resetUserPassword);

export default router;
