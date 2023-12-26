import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);

export const _root = __dirname;
export const wwwroot = path.join(_root, "wwwroot");


/**
 * Generates a response file object based on the given request.
 *
 * @param {Object} request - The request object.
 * @param {Array} request.files - The array of files in the request.
 * @param {Object} request.file - The file object in the request.
 * @param {string} request.file.filename - The name of the file.
 * @param {string} request.query.projectName - The name of the project.
 * @param {string} request.query.projectScope - The scope of the project.
 * @param {string} request.file.path - The file path.
 * @return {Object|Array} - The response file object or array of response file objects.
 */
export const prepareResponseFile = (request) => {

    if (request.files) {
        return request.files.map(file => {
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
    return _path.slice(_path.indexOf("wwwroot") + 7).replaceAll(/[\/\\]+/g, "/");
}


export function convertObjectUrlParsed(obj) { 
    let url = wwwroot;

    if (obj.projectName) {
        url += `/${obj.projectName}`;
    }

    if (obj.projectScope) {
        url += `/${obj.projectScope}`;
    }

    if (obj.fileName) {
        url += `/${obj.fileName}`;
    }

    // check platform UNIX OR POSIX 
    return url.replaceAll(/[\/\\]+/g, "/");
}

export function convertUrlParsedObject(url) {
    let urlParsed = url.split("/").filter((value) => value != "");
    
    let projectName = urlParsed[0];
    let fileName = urlParsed[urlParsed.length - 1];
    let projectScope = urlParsed.slice(1, urlParsed.length - 1).join("/");
    
    if (urlParsed.length <= 2) {
        projectScope = "";
    }

    return { projectName, projectScope, fileName };
}