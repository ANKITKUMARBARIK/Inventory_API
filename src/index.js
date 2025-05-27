import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
import seedAdmin from "./seed/seedAdmin.js";

dotenv.config({ path: "./.env" });

connectDB()
    .then(async () => {
        await seedAdmin();
        const server = app.listen(process.env.PORT || 8000, () =>
            console.log(`Server started at PORT: ${process.env.PORT}`)
        );
        server.on("error", (error) => {
            console.log("Server Error ", error);
            throw error;
        });
    })
    .catch((err) => console.log("MongoDB Connection Failed ", err));
