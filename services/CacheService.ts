import { RedisClientOptions, createClient } from 'redis';
import { RedisClientType } from 'redis';
import { isObject } from '../utils.js';


let client: RedisClientType;

export const CacheService = {
    connect: async (options?: RedisClientOptions) => {
        options = {legacyMode: false, ...options}
        client = createClient(options) as RedisClientType;
        client.on('error', err => console.log('Redis Client Error', err));
        await client.connect();
    },
    test: async () => {
        await client.hSet('user-session:123', {
            name: 'John',
            surname: 'Smith',
            company: 'Redis',
            age: 29
        })
        
        let userSession = await client.hGetAll('user-session:123');
        console.log(JSON.stringify(userSession, null, 2));
    },
    get: async <T = any>(key: string, object: boolean = true) => {
        return (object 
            ? await client.hGetAll(key)
            : await client.get(key)) as T;
    },
    set: async (key: string, value: string | any) => {
        console.log(`setting ${key}:${value}`)
        return isObject(value)
            ? await client.hSet(key, value)
            : await client.set(key, value);
    },
    del: async (key: string) => {
        await client.del(key);
    },
    keys: async (pattern: string) => {
        const keys = await client.keys(pattern);
        return keys;
    }
}