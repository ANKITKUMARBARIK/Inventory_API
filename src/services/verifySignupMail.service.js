import transporter from "../config/mailer.config.js";
import { promises as fs } from "fs";

const verifySignupMail = async (fullName, email, otpSignup) => {
    try {
        // fetch html content
        const htmlContent = await fs.readFile(
            "./src/mails/templates/verifySignupMail.html",
            "utf-8"
        );
        const finalHtml = htmlContent
            .replace("{{fullName}}", fullName)
            .replace("{{otpSignup}}", otpSignup);

        // mail configure
        const mailOptions = {
            from: {
                name: "Inventory System Team 🐳",
                address: process.env.APP_GMAIL,
            },
            to: { name: fullName, address: email },
            subject: "OTP Verification",
            html: finalHtml,
            text: finalHtml,
        };
        // mail send
        const info = await transporter.sendMail(mailOptions);
        console.log("📩Mail sent ", info.response);
    } catch (error) {
        console.error("❌ Error sending mail:", err);
    }
};

export default verifySignupMail;
