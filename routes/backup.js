import { wwwroot, VALIDATOR, parsePlatformPath } from "../utils.js";
import { exec } from "child_process";
import { FileService } from "../services/FileService.js";
import cron from "node-cron";

const fService = new FileService();

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
export const backup = async (req, res) => {
    try {

        const payload = req.body || req.query;

        if (payload.name == null || payload.folder == null || payload.connectionString == null) {
            res.status(400).send(JSON.stringify({
                message: "name, folder and connectionString are required",
                status: "failed",
            }))
            return; 
        }

        // must not contain file extension
        payload.name = payload.name.split(".")[0];
        const path = `${wwwroot}/backup/${payload.folder}/${payload.name}`;        
        if (cron.getTasks().has(payload.name)) {

            console.log(payload.name + " already exists", Array.from(cron.getTasks().keys()));
            cron.getTasks().get(payload.name).now()

            res.status(200).send(JSON.stringify({
                message: "backup already scheduled, executed right now and on schedule time too.",
                status: "success",
            }))

            return;
        }

        await fService.createDirectory(`${wwwroot}/backup`);
        await fService.createDirectory(`${wwwroot}/backup/${payload.folder}`);

        const command = `pg_dump ${!payload.zip ? "-F t" : ""} --dbname=${payload.connectionString} >> ${path}`;

        if (payload.continuos) {
            setCronJon(() => {
                exec(command, (error, stdout, stderr) => {
                    saveLog("dump " + (error ? "❌" : "✔"), stdout, stderr, command);
                    
                    if (error) {
                        console.log(`error: ${error.message}`);
                        return;
                    }
                })
            }, payload.name)
        }

        exec(command, (error, stdout, stderr) => {
            saveLog("dump " + (error ? "❌" : "✔"), stdout, stderr, command);

            if (error) {
                fService.deleteFile(path);
                console.log(`error: ${error.message}`);
                res.status(500).send({message: "Error backuping", error: error.message, exception: error.exception});
                return;
            }
            
            res.status(200).send(JSON.stringify({
                message: "backup done",
                status: "success",
            }))
        })

        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error backuping", error: error.message, exception: error.exception});
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
export const restore = async (req, res) => {
    try {
        const payload = req.body || req.query;
        const path = `${wwwroot}/backup/${payload.folder}/${payload.name}`;

        if (!fService.fileExists(path)) {
            res.status(200).send(JSON.stringify({
                message: "file not found",
                status: "failed",
            }))
        }

        const command = `pg_restore -F t --no-privileges --no-owner --dbname=${payload.connectionString} ${path}`
        exec(command, (error, stdout, stderr) => {
            saveLog("restore " + (error ? "❌" : "✔"), stdout, stderr, command);
            if (error) {
                console.log(`error: ${error.message}`);
                res.status(500).send({message: "Error backuping", error: error.message, exception: error.exception});
                return;
            }
            
            res.status(200).send(JSON.stringify({
                message: "restore done",
                status: "success",
            }))
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error restoring", error: error.message, exception: error.exception});
    }
}

export const removeJob = async (req, res) => {
    try {
        const payload = req.body || req.query;
        const removed = removeCronJob(payload.name);
        res.status(removed ? 200 : 200).send(JSON.stringify({
            message: removed ? "job removed" : "job not exists",
            status: removed ? "success" : "failed",
        }))
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error removing job", error: error.message, exception: error.exception});
    }
}

export const listJobs = async (req, res) => {
    try {
        res.status(200).send(JSON.stringify({
            data: getJobs(),
            message: "jobs listed",
            status: "success",
        }))
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error listing jobs", error: error.message, exception: error.exception});
    }
}

async function saveLog(message, stdout, stderr, command) {
    const date = new Date();

    await fService.createDirectory(`${wwwroot}/backup/logs`);

    await fService.log(VALIDATOR.critical(parsePlatformPath(`/backup/logs/${new Date().toISOString().split('T')[0]}_log`)),
    `
    [${date.toISOString()}] ${message}
    [${date.toISOString()}] command: ${command}
    ===============OUTPUT START================
    [${date.toISOString()}] stdout: ${stdout}
    [${date.toISOString()}] stderr: ${stderr}
    ===============OUTPUT END =================
    `);
}

function getJobs() {
    return Array.from(cron.getTasks().keys());
}

function setCronJon(cb, name, options) {
    cron.schedule("0 1 * * *", () => {
        cb();
    }, {name: `${name}`, timezone: "America/Sao_Paulo", scheduled: true, ...options})
} 

export function removeCronJob(name) {
    let cronJob = cron.getTasks().get(name)
    if (cronJob) {
        console.log("removing job " + name);
        cron.getTasks().delete(name)
        cronJob.stop();
        return true;
    }
    return false;
}
