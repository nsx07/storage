import { getJobs, removeCronJob, setCronJon } from "../core/Scheduler.js";
import { wwwroot, VALIDATOR, parsePlatformPath, multipleValuesSamePurpose } from "../utils.js";
import { BackupOptions, BackupService } from "../services/BackupService.js";
import { FileService } from "../services/FileService.js";
import { Request, Response } from "express";
import { exec } from "child_process";
import cron from "node-cron";
import { CacheService } from "../services/CacheService.js";

const fService = new FileService();
const bService = new BackupService();

/**
 * @param {Object} payload {
 *  "name": "string",
 *  "folder": "string",
 *  "connectionString": "string",
 *  "continuos": "boolean"
 *  "zip": "boolean"
 * }
 * @command pg_dump -F t --dbname=postgresql://postgres:password@localhost:5432/postgres >> file
 */
export const backup = async (req: Request, res: Response) => {
    try {
        const payload = req.body || req.query;

        bService.backup(payload)
            .then(result => {
                console.log(result);
                
                res.status(200).send(JSON.stringify(result));
            })
            .catch(error => {
                console.log(error);
                res.status(500).send({message: "Error backing up", error: (error as Error).name ?? (error as Error).message, exception: error.error});
            });
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error backing up", error: (error as Error).name, exception: (error as Error).message});
    }
}

/**
 * @param {Object} payload {
 *  "name": "string",
 *  "folder": "string",
 *  "connectionString": "string"
 * }
 * @command pg_restore -F t --no-privileges --no-owner --dbname=postgresql://username:password@host:port/database file
 */
export const restore = async (req: Request, res: Response) => {
    try {
        const payload = req.body || req.query;
        
        bService.restore(payload)
            .then(result => {
                res.status(200).send(JSON.stringify(result));
            })
            .catch(error => {
                console.log(error);
                res.status(500).send({message: "Error restoring", error: (error as Error).name, exception: (error as Error).message});
            });

    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error restoring", error: (error as Error).name, exception: (error as Error).message});
    }
}

export const removeBackup = async (req: Request, res: Response) => {
    try {
        const keyName = req.query.name as string;
        console.log(keyName);

        if (!keyName) {
            res.status(400).send({message: "Name is required.", hasError: true});
            return;    
        }
        
        const removed = removeCronJob(keyName);
        await CacheService.del(keyName);
        res.status(removed ? 200 : 200).send(JSON.stringify({
            message: removed ? "job removed" : "job not exists",
            status: removed ? "success" : "failed",
        }))
} catch (error) {
        console.log(error);
        res.status(500).send({message: "Error removing job", error: (error as Error).name, exception: (error as Error).message});
    }
}

export const listJobs = async (req: Request, res: Response) => {
    try {
        res.status(200).send(JSON.stringify({
            data: getJobs(),
            message: "jobs listed",
            status: "success",
        }))
} catch (error) {
        console.log(error);
        res.status(500).send({message: "Error listing jobs", error: (error as Error).name, exception: (error as Error).message});
    }
}

export const listBackups = async (req: Request, res: Response) => {
    try {
        let schedulesKeys = await CacheService.keys("backup:*");

        let schedules: BackupOptions[] = [];
        for (let key of schedulesKeys) {
            let schedule = await CacheService.get(key, false);
            if (schedule) {
                let parsed = JSON.parse(schedule);                 

                parsed.key = key;
                schedules.push(parsed);
            }
        }
    
        res.status(200).send(JSON.stringify({keys: schedulesKeys, schedules}));
    } catch (error) {
        res.status(500).send({message: "Error listing backups", error: (error as Error).name, exception: (error as Error).message});
    }
}

export const updateBackup = async (req: Request, res: Response) => {
    try {
        const payload = req.body || req.query;
        const backup = await CacheService.get(bService.parseTaskName(payload.key), false);
        if (backup) {
            let parsed = JSON.parse(backup);
            
            parsed.zip = payload.zip ?? parsed.zip;
            parsed.name = payload.name ?? parsed.name;
            parsed.cron = payload.cron ?? parsed.cron;
            parsed.folder = payload.folder ?? parsed.folder;
            parsed.continuos = payload.continuos ?? parsed.continuos;
            parsed.connectionString = payload.connectionString ?? parsed.connectionString;
            
            await CacheService.del(payload.key);

            multipleValuesSamePurpose([payload.key, payload.key.split(":")[0] ?? "nan", payload.name], x => removeCronJob(x));
            
            bService.backup(parsed, true)
                .then(result => {
                    res.status(200).send(JSON.stringify(result));
                })
                .catch(error => {
                    console.log(error);
                    res.status(500).send({message: "Error updating backup", error: (error as Error).name, exception: (error as Error).message});
                });

            
        } else {
            res.status(404).send(JSON.stringify({
                message: "backup not found",
                status: "failed",
            }));
        }
    } catch (error) {
        res.status(500).send({message: "Error updating backup", error: (error as Error).name, exception: (error as Error).message});
    }
}

