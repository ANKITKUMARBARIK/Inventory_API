import cloudinary from "../config/cloudinary.config.js";
import fs from "fs";

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        console.log("uploaded to cloudinary ", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (err) {
        console.log("cloudinary upload error ", err);
        fs.unlinkSync(localFilePath);
        return null;
    }
};

export default uploadOnCloudinary;
