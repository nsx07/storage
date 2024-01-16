import cors from "cors";
import express from "express";
import process from "process"
import { router } from "./routes/routes.js";
import cron from "node-cron"
import { configure } from "./security/configure-auth.js";
import { isConnect, multipleValuesSamePurpose } from "./utils.js";
import { removeCronJob } from "./routes/backup.js";

export const app = express();

app.use(cors({
    origin: '*',
    allowedHeaders: '*',
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE', 'OPTIONS'],
}));
// app.use(session({
//     secret: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
//     saveUninitialized: true,
//     resave: false,
// }));
app.use(express.json());
app.use("/api", router)
app.use("/wwwroot", express.static("wwwroot"));


const env = {
    host: "0.0.0.0",
    port: process.env.PORT ?? "3000",
    production: process.env.NODE_ENV === "production"
}

isConnect().then((isConnect) => {
    if (!isConnect) {
        console.log("No Internet Connection")
    } else configure(app, env)
    
}).catch((err) => {
    console.log(err)
    process.exit(1)
})

app.listen(env, () => console.log(`Server Running at ${env.host}:${env.port}`))

multipleValuesSamePurpose(["SIGINT", "SIGTERM", "EXIT"], s => process.on(s, x => {
    cron.getTasks().forEach((v, k, m) => removeCronJob(k))
    process.exit(0);
}))