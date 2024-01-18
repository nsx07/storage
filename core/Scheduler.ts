import cron from "node-cron";

export function getJobs() {
    return Array.from(cron.getTasks().values()).map((x) => (x as any).options);
}

export function setCronJon(cb: () => void, name: string, options: any) {
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

export function removeCronJob(name: string) {
    let cronJob = cron.getTasks().get(name)
    if (cronJob) {
        console.log("removing job " + name);
        cron.getTasks().delete(name)
        cronJob.stop();
        return true;
    }
    return false;
}
