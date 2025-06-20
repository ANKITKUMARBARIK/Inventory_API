import asyncHandler from "../utils/asyncHandler.util.js";
import ApiError from "../utils/ApiError.util.js";
import ApiResponse from "../utils/ApiResponse.util.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../services/cloudinary.service.js";
import generateFinalPrice from "../utils/generateFinalPrice.util.js";
import Product from "../models/product.model.js";

export const createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        price,
        discount = 0,
        quantity,
        category,
        brand = "",
    } = req.body;

    if (
        [name, description, category].some(
            (field) => typeof field !== "string" || !field?.trim()
        ) ||
        isNaN(price) ||
        isNaN(discount) ||
        isNaN(quantity)
    )
        throw new ApiError(400, "invalid or missing fields");

    if (price < 0 || quantity < 0)
        throw new ApiError(400, "price and quantity must be non-negative");
    if (discount < 0 || discount > 100)
        throw new ApiError(400, "discount must be between 0 and 100");

    const finalPrice = generateFinalPrice(price, discount);

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0)
        throw new ApiError(400, "no product images provided");
    let uploadImages = [];
    try {
        uploadImages = await Promise.all(
            req.files.map(async (file) => {
                const result = await uploadOnCloudinary(file.buffer);
                return {
                    url: result.secure_url,
                    public_id: result.public_id,
                };
            })
        );
    } catch (error) {
        if (uploadImages.length > 0) {
            await Promise.all(
                uploadImages.map((img) => deleteFromCloudinary(img.public_id))
            );
        }
        throw new ApiError(500, "image upload failed");
    }

    const product = await Product.create({
        name: name.trim(),
        description: description.trim(),
        price,
        discount,
        finalPrice,
        images: uploadImages,
        quantity,
        category: category.trim(),
        brand: brand?.trim() || "Generic",
        createdBy: req.user?._id,
    });

    if (!product) {
        if (uploadImages.length > 0) {
            await Promise.all(
                uploadImages.map((img) => deleteFromCloudinary(img.public_id))
            );
        }
        throw new ApiError(500, "product not created");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, product, "product created successfully"));
});

export const getAllProducts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({})
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "username email")
        .select("-__v")
        .sort("-createdAt");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { page, limit, products },
                "products fetched successfully with pagination"
            )
        );
});

export const getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id)
        .populate("createdBy", "username email")
        .select("-__v");

    if (!product) throw new ApiError(404, "Product not found");

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product fetched successfully"));
});

export const updateProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate({ _id: id }, req.body, {
        new: true,
        runValidators: true,
    })
        .populate("createdBy", "username email")
        .select("-__v");
    if (!product) throw new ApiError(404, "product not found");

    return res
        .status(200)
        .json(new ApiResponse(200, product, "product updated successfully"));
});

export const deleteProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete({ _id: id })
        .populate("createdBy", "username email")
        .select("-__v");
    if (!product) throw new ApiError(404, "product not found");

    return res
        .status(200)
        .json(new ApiResponse(200, product, "product deleted successfully"));
});

export const getMyProducts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ createdBy: req.user._id })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "username email")
        .select("-__v")
        .sort("-createdAt");
    if (products.length === 0)
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { page, limit, products },
                    "you have not created any products yet"
                )
            );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { page, limit, products },
                "your products fetched successfully"
            )
        );
});

export const searchProducts = asyncHandler(async (req, res) => {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!query)
        return res
            .status(400)
            .json(new ApiResponse(400, null, "query parameter is required"));

    const products = await Product.find({
        $or: [
            { name: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
        ],
    })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "username email")
        .select("-__v")
        .sort("-createdAt");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { page, limit, products },
                "products fetched successfully"
            )
        );
});
