import dns from "dns"
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);

export const _root = __dirname;
export const wwwroot = path.join(_root, "wwwroot");

export type Complex = unknown;

export type FileRespose = {
    files: Array<{ filename: string, path: string }>
    file: { filename: string, path: string }
    query: { projectName: any, projectScope: any }
}

export const prepareResponseFile = (request: FileRespose | any) => {

    if (request.files) {
        return request.files.map((file: any) => {
            return {
                fileName: file.filename,
                projectName: request.query.projectName,
                projectScope: request.query.projectScope,
                filePath: stripPath(file.path)
            }
        })
    }

    return {
        fileName: request.file.filename,
        projectName: request.query.projectName,
        projectScope: request.query.projectScope,
        filePath: stripPath(request.file.path)
    }

}

export function stripPath(_path = "") {
    return parsePlatformPath(_path.slice(_path.indexOf("wwwroot") + 7));
}

export type UrlObject = {
    projectName: string,
    projectScope: string,
    fileName: string
}
export function convertObjectUrlParsed(obj: Partial<UrlObject>, isFile = false) { 
    let url = wwwroot;

    if (obj.projectName) {
        url += `/${obj.projectName}`;
    }

    if (obj.projectScope) {
        url += `/${obj.projectScope}`;
    }

    if (obj.fileName && (isFile || !obj.fileName.includes("."))) {
        url += `/${obj.fileName}`;
    }

    // check platform UNIX OR POSIX 
    return parsePlatformPath(url);
}

export function convertUrlParsedObject(url: string) {
    let urlParsed = url.split("/").filter((value) => value != "");
    
    let projectName = parsePlatformPath(urlParsed[0]);
    let fileName = parsePlatformPath(urlParsed[urlParsed.length - 1]);
    let projectScope = parsePlatformPath(urlParsed.slice(1, urlParsed.length - 1).join("/"));
    
    if (urlParsed.length <= 2) {
        projectScope = "";
    }

    return { projectName, projectScope, fileName };
}

export function parsePlatformPath(path: string) {
    const reg = new RegExp(`[\/\\\\]+`, "g");
    if (detectPlatform() == "win32") {
        return path.replaceAll(reg, "\\");
    } else {
        return path.replaceAll(reg, "/");
    }
}

export function parsePlatformPathWithRoot(path: string) {
    return parsePlatformPath(wwwroot + "/" + path);
}

export function detectPlatform() {
    return process.platform;
}

export async function isConnect() {
    return new Promise((resolve, reject) => {
        try {
            dns.lookup("google.com", (err) => {
                if (err && err.code == "ENOTFOUND") {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

export const VALIDATOR = {
    critical : (path: string, isDelete = true) => {
        preventPathTraversal(path);
        isDelete && preventRootExclusion(path);
        return path;
    }
}

function preventPathTraversal(path: string) {
    if (path.includes("..")) {
        throw new Error("path traversal is not allowed");
    }
}

function preventRootExclusion(path: string) {
    if (path === wwwroot) {
        throw new Error("root cannot change!");
    }
}


export const multipleValuesSamePurpose = <T = unknown>(values: T[], call: (value: T) => void) => {
    for (let value of values) {
        call(value);
    }
}

export const isObject = (value: unknown) => {
    return typeof value === "object" && value !== null;
}