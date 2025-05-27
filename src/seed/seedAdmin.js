import User from "../models/user.model.js";
import ROLES from "../config/roles.js";

const seedAdmin = async () => {
    try {
        const existingAdmin = await User.findOne({ role: "ADMIN" });
        if (!existingAdmin) {
            const user = new User({
                username: "admin",
                fullName: "Admin",
                email: "admin.dev@gmail.com",
                avatar: "avatar.png",
                coverImage: "coverImage.png",
                password: "123",
                timezone: "Asia/Kolkata",
                role: ROLES.ADMIN,
                isVerified: true,
            });
            await user.save();
            console.info("default admin created successfully");
        } else {
            console.info("admin user already exists");
        }
    } catch (error) {
        console.error("error while creating default admin:", error);
    }
};

export default seedAdmin;
