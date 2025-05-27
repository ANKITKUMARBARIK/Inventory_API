import ApiError from "../utils/ApiError.util.js";

const verifyAuthorization =
    (...allowedRoles) =>
    (req, _, next) => {
        if (!allowedRoles.includes(req.user.role))
            throw new ApiError(402, "Access denied: Not authorized");
        next();
    };

export default verifyAuthorization;
