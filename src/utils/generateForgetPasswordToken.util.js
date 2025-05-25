import crypto from "crypto";

// generate reset token
const generateForgetPasswordToken = () =>
    crypto.randomBytes(32).toString("hex");

export default generateForgetPasswordToken;
