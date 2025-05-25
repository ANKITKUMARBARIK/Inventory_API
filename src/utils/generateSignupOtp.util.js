import crypto from "crypto";

// 6 digit otp generate
const generateSignupOtp = () => crypto.randomInt(100000, 999999).toString();

export default generateSignupOtp;
