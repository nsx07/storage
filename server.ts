import cors from "cors";
import cron from "node-cron"
import process from "process"
import express from "express";
import { router } from "./routes/routes.js";
import { removeCronJob } from "./core/Scheduler.js";
import { multipleValuesSamePurpose } from "./utils.js";

export const app = express();

app.use(cors({
    origin: '*',
    allowedHeaders: '*',
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE', 'OPTIONS'],
}));
app.use(express.json());
app.use("/api", router)
app.use("/wwwroot", express.static("wwwroot"));


const env = {
    host: "0.0.0.0",
    port: process.env.PORT ?? "3000",
    production: process.env.NODE_ENV === "production"
}

app.listen(env, () => console.log(`Server Running at ${env.host}:${env.port}`))

multipleValuesSamePurpose(["SIGINT", "SIGTERM", "EXIT"], s => process.on(s as string, x => {
    cron.getTasks().forEach((v, k, m) => removeCronJob(k))
    process.exit(0);
}))
