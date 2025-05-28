import { Schema, model } from "mongoose";

const productSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "product name is required"],
            trim: true,
            index: true,
        },
        description: {
            type: String,
            required: [true, "product description is required"],
        },
        price: {
            type: Number,
            required: [true, "product price is required"],
            default: 0,
        },
        discount: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        finalPrice: {
            type: Number,
            required: true,
        },
        images: [
            {
                url: { type: String, required: true },
                public_id: { type: String, required: true },
            },
        ],
        quantity: {
            type: Number,
            required: true,
            default: 0,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        brand: {
            type: String,
            trim: true,
            default: "",
        },
        inStock: {
            type: Boolean,
            default: true,
        },
        status: {
            type: String,
            enum: ["available", "out-of-stock", "discontinued"],
            default: "available",
        },
        ratings: {
            type: Number,
            default: 0,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const Product = model("Product", productSchema);

export default Product;
