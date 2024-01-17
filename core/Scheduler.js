import cron from "node-cron";

export function getJobs() {
    return Array.from(cron.getTasks().values()).map((x) => x.options);
}

export function setCronJon(cb, name, options) {
    options.cron = options.cron ?? "0 0 1 * * *";

    try {
        const schedule = cron.schedule(options.cron, () => cb(), {name: `${name}`, timezone: "America/Sao_Paulo", scheduled: true, ...options});
        schedule.start();
        return true;
    } catch (error) {
        cron.getTasks().delete(name);
        return false;
    }
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
