import { exec } from "child_process";
import cron from "node-cron";
import { FileService } from "./FileService.js";
import { ScheduleResult, setCronJon } from "../core/Scheduler.js";
import { CacheService } from "./CacheService.js";
import { VALIDATOR, parsePlatformPath, wwwroot } from "../utils.js";

export type BackupOptions = {
    name: string;
    zip?: boolean;
    cron?: string;
    folder: string;
    key?: string
    // this does not accept command injection, its just encapsulate the command to be executed after reboot or crash
    command?: string;
    continuos?: boolean;
    connectionString: string;
}

export type RestoreOptions = {
    name: string;
    folder: string;
    connectionString: string;
}

export class BackupService {

    private fService: FileService = new FileService();

    scheduleBackup(payload: BackupOptions) : Promise<ScheduleResult> {
        return setCronJon(() => {
            exec(payload.command!, (error, stdout, stderr) => {
                this.saveLog("dump " + (error ? "❌" : "✔"), stdout, stderr, payload.command!);
                
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
            })
        }, payload.name.includes("backup:") ? payload.name : `backup:${payload.name}`, payload);
    }

    parseTaskName(name: string) {
        return name.includes("backup:") ? name : `backup:${name}`
    }

    async backup(payload: BackupOptions, update = false) {
        return new Promise(async (resolve, reject) => {
            if (payload.name == null || payload.folder == null || payload.connectionString == null) {
                return reject({
                    message: "name, folder and connectionString are required",
                    status: "failed",
                })
            }
    
            // must not contain file extension
            payload.name = payload.name.split(".")[0];
            const path = `${wwwroot}/backup/${payload.folder}/${payload.name}`;        
            if (cron.getTasks().has(payload.name)) {
                console.log(payload.name + " already exists", Array.from(cron.getTasks().keys()));
                cron.getTasks().get(payload.name)!.now()
    
                return resolve({
                    message: "backup already scheduled, executed right now and on schedule time too.",
                    status: "success",
                    error: false
                });
            }
    
            await this.fService.createDirectory(`${wwwroot}/backup`);
            await this.fService.createDirectory(`${wwwroot}/backup/${payload.folder}`);
    
            const command = `pg_dump ${ payload.zip ? "-F t" : ""} --dbname=${payload.connectionString} >> ${path} `;
    
            if (payload.continuos) {
    
                payload.command = command;
                payload.key = `backup:${payload.name}`
                let scheduler = await this.scheduleBackup(payload);

                if (scheduler.hasError) {
                    return reject({
                        message: "failed to schedule backup",
                        status: "failed",
                        error: scheduler.error.message
                    });
                }
    
                CacheService.set(payload.key, JSON.stringify(payload));
            }
    
            if (update) {
                return resolve({
                    message: "backup updated",
                    status: "success",
                    error: false
                });
            } else {
                try {
                    exec(command, (error, stdout, stderr) => {
                        this.saveLog("dump " + (error ? "❌" : "✔"), stdout, stderr, command);
            
                        if (error) {
                            this.fService.deleteFile(path);
                            console.log(`error exec: ${error.message}`);
                            return reject(error);
                        }
                        
                        return resolve({
                            message: "backup done",
                            status: "success",
                            error: false
                        });
                    })
                } catch (error) {
                    return reject(error);
                }
            }
        })
    }

    async restore(payload: RestoreOptions) {
        return new Promise(async (resolve, reject) => {
            const path = `${wwwroot}/backup/${payload.folder}/${payload.name}`;

            if (!this.fService.fileExists(path)) {
                Promise.resolve({
                    message: "file not found",
                    status: "failed"
                });
            }

            const command = `pg_restore -F t --no-privileges --no-owner --dbname=${payload.connectionString} ${path}`
            exec(command, (error, stdout, stderr) => {
                this.saveLog("restore " + (error ? "❌" : "✔"), stdout, stderr, command);
                if (error) {
                    console.log(`error: ${error.message}`);
                    return reject(error);
                }
                
                return resolve({
                    message: "restore done",
                    status: "success",
                });
            })
        })
    }

    async saveLog(message: string, stdout: string, stderr: string, command: string) {
        const date = new Date().toISOString();
    
        await this.fService.createDirectory(`${wwwroot}/backup/logs`);
        await this.fService.log(VALIDATOR.critical(parsePlatformPath(`/backup/logs/${date.split('T')[0]}_log`)),
        `
         \n[${date}] ${message}
         \n[${date}] command: ${command}
         \n===============OUTPUT START================
         \n[${date}] stdout: ${stdout}
         \n[${date}] stderr: ${stderr}
         \n===============OUTPUT END =================
        `);
    }

}