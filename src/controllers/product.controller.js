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
