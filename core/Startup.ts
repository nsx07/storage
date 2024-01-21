import { Application } from "express";
import { CacheService } from "../services/CacheService.js";
import { FileService } from "../services/FileService.js";
import { isConnect, wwwroot } from "../utils.js";
import { setTimeout } from "timers/promises";
import { BackupOptions, BackupService } from "../services/BackupService.js";

export async function startup(app: Application, env: Record<string, unknown>) {
    
    if (!env.production) {
        process.env["STORAGE_TOKEN"] = "test";
        FileService.createDirectory(wwwroot);
    }
    
    await isConnect()
        .then(async () => {
            CacheService.connect(env.production 
                ? {url: process.env["REDIS_URL"] as string} 
                : undefined);
        })
        .catch(err => {
            try {
                CacheService.connect();
            } catch (error) {
                console.log("Failed to connect to database, exiting...");
                console.error(err);
                process.exit(1);
            }

    });

    reUpCronJobs();
}

async function reUpCronJobs() {
    const bService = new BackupService();
    const jobs = await CacheService.keys("backup:*");
    
    jobs.forEach(async job => {
        const payload = JSON.parse(await CacheService.get(job, false));
        console.log(payload);
        
        if (payload) {
            bService.scheduleBackup(payload);
        }
        
    });
}