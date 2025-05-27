import cloudinary from "../config/cloudinary.config.js";
import fs from "fs/promises";

export const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;

    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        console.log("uploaded to cloudinary ", response.url);

        await fs.unlink(localFilePath);

        return response;
    } catch (err) {
        console.log("cloudinary upload error ", err);

        try {
            await fs.unlink(localFilePath);
        } catch (err) {
            console.error("failed to delete local file:", err.message);
        }

        return null;
    }
};

export const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return null;

    try {
        const response = await cloudinary.uploader.destroy(publicId);

        if (response.result !== "ok") {
            console.warn("cloudinary deletion failed:", response);
            return null;
        }

        console.log("deleted from cloudinary. PUBLIC ID - ", publicId);

        return response;
    } catch (err) {
        console.error("error deleting from cloudinary ", err.message);

        return null;
    }
};
