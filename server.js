import cors from "cors";
import express from "express";
import session from "express-session";
import { router } from "./routes/routes.js";
import { configure } from "./security/configure-auth.js";

export const app = express();

app.use(cors({
    origin: ["http://localhost:4201", "https://storagex.vercel.app"],
    allowedHeaders: "*",
    credentials: true,
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE', 'OPTIONS'],
}));
app.use(session({
    secret: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    saveUninitialized: true,
    resave: false,
}));
app.use("/api", router)
app.use(express.json());
app.use("/wwwroot", express.static("wwwroot"));


const env = {
    host: "0.0.0.0",
    port: process.env.PORT ?? "3000",
    production: process.env.NODE_ENV === "production"
}

configure(app, env);

app.listen(env, () => console.log(`Server Running at ${env.host}:${env.port}`))
