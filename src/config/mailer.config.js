import { createTransport } from "nodemailer";

const transporter = createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    secure: true,
    port: 465,
    auth: {
        user: process.env.APP_GMAIL,
        pass: process.env.APP_PASSWORD,
    },
});

export default transporter;
