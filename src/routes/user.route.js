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
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    updateUserRole,
} from "../controllers/user.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import verifyAuthorization from "../middlewares/authorize.middleware.js";
import ROLES from "../config/roles.js";

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

router.route("/change-password").patch(verifyJWT, changeCurrentPassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/update-account").patch(verifyJWT, updateAccountDetails);

router
    .route("/update-avatar")
    .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router
    .route("/update-coverImage")
    .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

// user roles
router
    .route("/make-admin/:id")
    .patch(verifyJWT, verifyAuthorization(ROLES.ADMIN), updateUserRole);

export default router;
