import {
	setupKinde,
	protectRoute,
	getUser,
} from "@kinde-oss/kinde-node-express";

export function configure(app, env) {

    const config = getConfig(env);
    
    setupKinde(config, app);
}

function getConfig(env) {

    if (env.production) {
        return {
            clientId: "084939a75ce1432db7c832d292638c89",
            issuerBaseUrl: "https://nsxoseven.kinde.com",
            siteUrl: "https://storage-production.up.railway.app/",
            secret: "oo6NDizaZljYJ8X1jn0e6GgOxqXHNWKt386ctqRYMXCEjS4fq",
            redirectUrl: "https://storagex.vercel.app",
        };
    } else {
        return {
            clientId: "084939a75ce1432db7c832d292638c89",
            issuerBaseUrl: "https://nsxoseven.kinde.com",
            siteUrl: "http://localhost:3000",
            secret: "oo6NDizaZljYJ8X1jn0e6GgOxqXHNWKt386ctqRYMXCEjS4fq",
            redirectUrl: "http://localhost:4201/",
        };
    }

}