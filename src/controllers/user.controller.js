import asyncHandler from "../utils/asyncHandler.util.js";
import ApiError from "../utils/ApiError.util.js";
import ApiResponse from "../utils/ApiResponse.util.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../services/cloudinary.service.js";
import generateAccessAndRefreshToken from "../services/token.service.js";
import jwt from "jsonwebtoken";
import generateSignupOtp from "../utils/generateSignupOtp.util.js";
import generateForgetPasswordToken from "../utils/generateForgetPasswordToken.util.js";
import verifySignupMail from "../services/verifySignupMail.service.js";
import welcomeSignupMail from "../services/welcomeSignupMail.service.js";
import tokenVerifyMail from "../services/tokenVerifyMail.service.js";
import User from "../models/user.model.js";
import ROLES from "../config/roles.js";

export const registerUser = asyncHandler(async (req, res) => {
    /*
    TODO:-
        - get user details from frontend
        - validation - not empty
        - check if user already exists: username, email
        - check for images, get user avatar,coverImage from frontend
        - check for images, upload them to cloudinary, (avatar,coverImage)
        - create user object - create entry in db
        - remove password and refresh token field from response
        - check for user creation
        - return res
    */

    const { fullName, username, email, password, timezone } = req.body;
    if (
        [fullName, username, email, password, timezone].some(
            (field) => !field?.trim()
        )
    )
        throw new ApiError(400, "all fields are required");

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (existedUser)
        throw new ApiError(409, "username or email already exists");

    let avatarLocalPath, coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.avatar) &&
        req.files.avatar.length > 0
    ) {
        // avatarLocalPath = req.files.avatar[0].path;
        avatarLocalPath = req.files.avatar[0].buffer;
    }
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        // coverImageLocalPath = req.files.coverImage[0].path;
        coverImageLocalPath = req.files.coverImage[0].buffer;
    }
    if (!avatarLocalPath) throw new ApiError(400, "avatar file is required");

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar?.url) throw new ApiError(400, "avatar file is required");

    const otpSignup = generateSignupOtp();
    const otpSignupExpiry = new Date(Date.now() + 5 * 60 * 1000);

    const user = new User({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        timezone,
        otpSignup,
        otpSignupExpiry,
    });
    try {
        await user.save();
    } catch (error) {
        console.log("user creation failed");
        if (avatar?.public_id) await deleteFromCloudinary(avatar.public_id);
        if (coverImage?.public_id)
            await deleteFromCloudinary(coverImage.public_id);
        throw new ApiError(
            500,
            "error saving user to database and images were deleted"
        );
    }

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    if (!createdUser)
        throw new ApiError(
            500,
            "something went wrong while registering the user"
        );

    await verifySignupMail(
        createdUser.fullName,
        createdUser.email,
        createdUser.otpSignup
    );

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdUser,
                "user registered successfully....Please verify OTP !"
            )
        );
});

export const loginUser = asyncHandler(async (req, res) => {
    /* 
    TODO:-
        - get user details from frontend
        - validation - not empty
        - check if user doesn't exists: username, email
        - password check
        - generate access and refresh token
        - save refresh token in db
        - get user data without sensitive infos.
        - cookie options - secure true only in production
        - set cookies & send response
    */

    const { username, email, password } = req.body;
    if ([username, email, password].some((field) => !field?.trim()))
        throw new ApiError(400, "all fields are required");

    const existedUser = await User.findOne({
        $and: [{ username }, { email }],
    });
    if (!existedUser) throw new ApiError(404, "user does not exists");

    const isPasswordValid = await existedUser.comparePassword(password);
    if (!isPasswordValid) throw new ApiError(401, "invalid user credentials");

    if (!existedUser.isVerified) {
        await verifySignupMail(
            existedUser.fullName,
            existedUser.email,
            existedUser.otpSignup
        );
        throw new ApiError(
            401,
            "Your email is not verified..Please verify OTP"
        );
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        existedUser._id
    );

    const user = await User.findById(existedUser._id).select(
        "-password -refreshToken"
    );
    if (!user) throw new ApiError(404, "user not found");

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: user, accessToken, refreshToken },
                "user logged in successfully"
            )
        );
});

export const logoutUser = asyncHandler(async (req, res) => {
    /* 
    TODO:-
        - delete refreshToken from db
        - clear cookie and send response
    */

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 },
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
    /*
    TODO:-
        - get refreshToken from cookies - frontend
        - Server verifies JWT using secret key to ensure token integrity and expiry — refreshToken comes from cookie
        - check refreshToken, user _id exist in db or not
        - now check db refreshToken and cookie refreshToken
        - now generate new access and refresh tokens
        - set cookies & send response
    */

    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) throw new ApiError(401, "unauthorized request");

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodedToken) throw new ApiError(401, "unauthorized request");

    const user = await User.findById(decodedToken?._id);
    if (!user) throw new ApiError(401, "invalid refresh token");

    if (incomingRefreshToken !== user?.refreshToken)
        throw new ApiError(401, "Refresh token is expired or used");

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken },
                "access token refreshed successfully"
            )
        );
});

export const verifyOtpSignup = asyncHandler(async (req, res) => {
    const { otpSignup } = req.body;
    if (!otpSignup?.trim()) throw new ApiError(401, "otp is required");

    const existedOtp = await User.findOneAndUpdate(
        { otpSignup, otpSignupExpiry: { $gt: new Date() } },
        {
            $unset: { otpSignup: 1, otpSignupExpiry: 1 },
            $set: { isVerified: true },
        },
        { new: true }
    );
    if (!existedOtp) throw new ApiError(400, "invalid or expired otp");

    await welcomeSignupMail(existedOtp.fullName, existedOtp.email);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { email: existedOtp.email, isVerified: existedOtp.isVerified },
                "otp is verified successfully"
            )
        );
});

export const forgetUserPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email?.trim()) throw new ApiError(400, "email is required");

    // Generate reset token
    const token = generateForgetPasswordToken();
    const expiry = Date.now() + 3600000; // 1 hour from now

    const existedEmail = await User.findOneAndUpdate(
        { email },
        {
            $set: { forgetPasswordToken: token, forgetPasswordExpiry: expiry },
        },
        { new: true }
    );
    if (!existedEmail) throw new ApiError(404, "email does not exists");

    await tokenVerifyMail(
        existedEmail.fullName,
        existedEmail.email,
        existedEmail.forgetPasswordToken
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { email: existedEmail.email },
                "token generated - check your email to reset your password"
            )
        );
});

export const resetUserPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!token?.trim()) throw new ApiError(400, "token is required");

    if ([newPassword, confirmPassword].some((field) => !field?.trim()))
        throw new ApiError(400, "both fields are required");

    if (newPassword !== confirmPassword)
        throw new ApiError(400, "new and confirm password must be same");

    const existedToken = await User.findOne({
        forgetPasswordToken: token,
        forgetPasswordExpiry: { $gt: new Date() },
    });
    if (!existedToken) throw new ApiError(400, "invalid or expired token");

    existedToken.forgetPasswordToken = undefined;
    existedToken.forgetPasswordExpiry = undefined;
    existedToken.password = confirmPassword;
    await existedToken.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { email: existedToken.email },
                "Password reset successfully. You can now log in with your new password."
            )
        );
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
    /*
    TODO:-
        - get and check old, new, confirm password from frontend
        - check user in db
        - check/compare old password and db password
        - update and save db password into confirm password
        - return res
    */

    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (
        [oldPassword, newPassword, confirmPassword].some(
            (field) => !field?.trim()
        )
    )
        throw new ApiError(400, "all fields are required");

    if (oldPassword === newPassword)
        throw new ApiError(401, "old and new password must be different");

    if (newPassword !== confirmPassword)
        throw new ApiError(401, "new and confirm password must be same");

    const existedUser = await User.findById(req.user?._id);
    if (!existedUser) throw new ApiError(400, "user not found");

    const isPasswordValid = await existedUser.comparePassword(oldPassword);
    if (!isPasswordValid) throw new ApiError(401, "invalid old password");

    existedUser.password = confirmPassword;
    await existedUser.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "password changed successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "current user fetched successfully")
        );
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
    /* 
    NOTE:-
        Production level par file updates (jaise image) ke liye alag controller aur endpoint banao. Sirf required data update karo, pura user object wapas bhejna avoid karo.
    */

    /*
    TODO:-
        - get/check body(text based data) details like- username,email,fullName
        - check user in db and update
        - return res
    */

    const { fullName, username, email, timezone } = req.body;
    if ([fullName, username, email, timezone].some((field) => !field?.trim()))
        throw new ApiError(400, "all fields are required");

    const existedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { fullName, username, email, timezone } },
        { new: true }
    ).select("-password -refreshToken");
    if (!existedUser)
        throw new ApiError(401, "something wrong while updating account");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                existedUser,
                "account details updated successfully"
            )
        );
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
    /*
    TODO:-
        - get and check body(file based data) details like- avatar or coverImage
        - now upload on cloudinary
        - check user in db and update
        - return res
    */

    let avatarLocalPath = req.file?.buffer;
    if (!avatarLocalPath) throw new ApiError(400, "avatar file is missing");

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar?.url)
        throw new ApiError(401, "error while uploading on avatar");

    const existedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password -refreshToken");
    if (!existedUser)
        throw new ApiError(401, "something went wrong while updating avatar");

    return res
        .status(200)
        .json(new ApiResponse(200, existedUser, "avatar updated successfully"));
});

export const updateUserCoverImage = asyncHandler(async (req, res) => {
    /*
    TODO:-
        - get and check body(file based data) details like- avatar or coverImage
        - now upload on cloudinary
        - check user in db and update
        - return res
    */

    let coverImageLocalPath = req.file?.buffer;
    if (!coverImageLocalPath)
        throw new ApiError(400, "coverImage file is missing");

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage?.url)
        throw new ApiError(401, "error while uploading on coverImage");

    const existedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password -refreshToken");
    if (!existedUser)
        throw new ApiError(
            401,
            "something went wrong while updating coverImage"
        );

    return res
        .status(200)
        .json(
            new ApiResponse(200, existedUser, "coverImage updated successfully")
        );
});

export const updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!id || !role?.trim())
        throw new ApiError(400, "id or role are required");

    if (!Object.values(ROLES).includes(role))
        throw new ApiError(400, "Invalid role");

    if (req.user.id === id)
        throw new ApiError(403, "you cannot update your own role");

    const existedUser = await User.findByIdAndUpdate(
        id,
        { $set: { role } },
        { new: true }
    ).select("-password -refreshToken");
    if (!existedUser) throw new ApiError(404, "user not found");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                existedUser,
                `user role updated to ${existedUser.role}`
            )
        );
});
