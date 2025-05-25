import transporter from "../config/mailer.config.js";
import { promises as fs } from "fs";

const welcomeSignupMail = async (fullName, email) => {
    try {
        // fetch html content
        const htmlContent = await fs.readFile(
            "./src/mails/templates/welcomeSignupMail.html",
            "utf-8"
        );
        const finalHtml = htmlContent
            .replace("{{fullName}}", fullName)
            .replace("{{dashboardLink}}", "http://localhost:8000/");

        // mail configure
        const mailOptions = {
            from: {
                name: "Inventory System Team 🐳",
                address: process.env.APP_GMAIL,
            },
            to: { name: fullName, address: email },
            subject: `Welcome ${fullName}`,
            html: finalHtml,
            text: finalHtml,
            attachments: [
                {
                    filename: "default.png",
                    path: "./public/images/default.png",
                },
                {
                    filename: "default.png",
                    path: "./public/images/default.png",
                    cid: "img1-contentid",
                },
            ],
        };
        // mail send
        const info = await transporter.sendMail(mailOptions);
        console.log("📩Mail sent ", info.response);
    } catch (error) {
        console.error("❌ Error sending mail:", err);
    }
};

export default welcomeSignupMail;
