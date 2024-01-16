import { wwwroot } from "../utils.js";
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
 *  "interval": "number"
 * }
 * @command pg_dump --dbname=postgresql://postgres:password@localhost:5432/postgres >> file
 */
export const backup = async (req, res) => {
    try {

        const payload = req.body || req.query;
        const path = `${wwwroot}/backup/${payload.folder}/${payload.name}`;        

        await fService.createDirectory(`${wwwroot}/backup`);
        await fService.createDirectory(`${wwwroot}/backup/${payload.folder}`);

        if (cron.getTasks().has(payload.name)) {
            console.log(payload.name + " already exists", Array.from(cron.getTasks().keys()));
            cron.getTasks().get(payload.name).now()

            res.status(200).send(JSON.stringify({
                message: "backup already scheduled, executed right now and on schedule time too.",
                status: "success",
            }))

            return;
        }

        if (payload.continuos) {
            setCronJon(() => {
                exec(`pg_dump --dbname=${payload.connectionString} >> ${path}`, (error, stdout, stderr) => {
                    if (error) {
                        console.log(`error: ${error.message}`);
                        return;
                    }
                })
            }, payload.name)
        }

        exec(`pg_dump --dbname=${payload.connectionString} >> ${path}`, (error, stdout, stderr) => {

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
 * @command pg_restore --no-privileges --no-owner --dbname=postgresql://username:password@host:port/database file
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

        exec(`pg_restore --no-privileges --no-owner --dbname=${payload.connectionString} ${path}`, (error, stdout, stderr) => {

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

        res.status(300).send(JSON.stringify({
            message: "process failed",
            status: "failed",
        }))
        
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

function getJobs() {
    const jobs = [];
    cron.getTasks().forEach((value, key) => {
        
        jobs.push({name: key, next: value.eventNames()});
    })
    return jobs;
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
