import cron from "node-cron";

export function getJobs() {
    return Array.from(cron.getTasks().values()).map((x) => (x as any).options);
}

export type ScheduleResult = {
    hasError: boolean;
    error?: any;
}
export function setCronJon(cb: () => void, name: string, options: any) {
    return new Promise<ScheduleResult>((resolve, reject) => {
        options.cron = options.cron ?? "0 0 1 * * *";

        try {
            const schedule = cron.schedule(options.cron, () => cb(), {name: `${name}`, timezone: "America/Sao_Paulo", scheduled: true, ...options});
            schedule.start();
            console.log("setting job " + name);
            
            resolve({hasError: false});
        } catch (error) {
            console.log("failed to set job " + name);
            console.log(error)
            
            cron.getTasks().delete(name);
            resolve({hasError: true, error: error});
        }
    })
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
