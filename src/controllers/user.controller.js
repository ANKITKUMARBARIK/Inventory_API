import asyncHandler from "../utils/asyncHandler.util.js";
import ApiError from "../utils/ApiError.util.js";
import ApiResponse from "../utils/ApiResponse.util.js";
import uploadOnCloudinary from "../services/cloudinary.service.js";
import generateAccessAndRefreshToken from "../services/token.service.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

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
        avatarLocalPath = req.files.avatar[0].path;
    }
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    if (!avatarLocalPath) throw new ApiError(400, "avatar file is required");

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar?.url) throw new ApiError(400, "avatar file is required");

    const user = new User({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        timezone,
    });
    await user.save();

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    if (!createdUser)
        throw new ApiError(
            500,
            "something went wrong while registering the user"
        );

    return res
        .status(201)
        .json(
            new ApiResponse(201, createdUser, "user registered successfully")
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
