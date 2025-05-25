import transporter from "../config/mailer.config.js";
import { promises as fs } from "fs";

const tokenVerifyMail = async (fullName, email, token) => {
    try {
        // fetch html content
        const htmlContent = await fs.readFile(
            "./src/mails/templates/tokenVerifyMail.html",
            "utf-8"
        );
        const finalHtml = htmlContent
            .replace("{{fullName}}", fullName)
            .replace("{{token}}", token)
            .replace("{{actionLink}}", "http://localhost:8000/");

        // mail configure
        const mailOptions = {
            from: {
                name: "Inventory System Team 🐳",
                address: process.env.APP_GMAIL,
            },
            to: { name: fullName, address: email },
            subject: "Token Verification - Reset Password",
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

export default tokenVerifyMail;
