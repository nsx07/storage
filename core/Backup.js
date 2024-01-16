import { exec } from "child_process";

export class Backup {
    
    host
    port
    user
    password
    database
    protocol
    
    constructor(host, port, user, password, database, protocol = "postgresql") {
        this.host = host;
        this.port = port;
        this.user = user;
        this.password = password;
        this.database = database;
        this.protocol = protocol;
    }

    static fromString(str) {
        const protocol = str.substring(0, str.indexOf("://"));
        const origin = str.substring(str.indexOf("://") + 3);
        const user = origin.substring(0, origin.indexOf(":"));
        const database = origin.substring(origin.lastIndexOf("/") + 1);
        const host = origin.substring(origin.indexOf("@") + 1, origin.lastIndexOf(":"));
        const password = origin.substring(origin.indexOf(":") + 1, origin.indexOf("@"));
        const port = origin.substring(origin.lastIndexOf(":") + 1, origin.lastIndexOf("/"));

        return new Backup(host, port, user, password, database, protocol);
    }

    static prepareEnv() {
        exec("apt install postgresql-client", (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            
            console.log("[OK] postgresql-client installed");
            console.log(stdout);
        })
    }
}
