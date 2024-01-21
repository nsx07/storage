import cors from "cors";
import process from "process"
import express from "express";
import { router } from "./routes/routes.js";
import { startup } from "./core/Startup.js";

export const app = express();

app.use(cors({ origin: '*', allowedHeaders: '*', methods: ['GET','HEAD','PUT','PATCH','POST','DELETE', 'OPTIONS']}));
app.use(express.json());
app.use("/api", router)
app.use("/wwwroot", express.static("wwwroot"));

const env = {
    host: "0.0.0.0",
    port: process.env.PORT ?? "3000",
    production: process.env.NODE_ENV === "production"
}


startup(app, env);

app.listen(env, () => console.log(`Server Running at ${env.host}:${env.port}`))