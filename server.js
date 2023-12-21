import cors from "cors";
import express from "express";
// import bodyParser from "body-parser";
import { router } from "./routes/routes.js";

export const app = express();

app.use(cors({
    origin: "*",
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE'],
    allowedHeaders: "*"
}));
app.use(express.json());
app.use("/api", router)

app.use("/wwwroot", express.static("wwwroot"));

const env = {
    host: "0.0.0.0",
    port: process.env.PORT ?? "3000"
}

app.listen(env, () => console.log(`Server Running at ${env.host}:${env.port}`))

