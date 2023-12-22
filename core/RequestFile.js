import fs from 'fs';
import path from 'path';
import { _root, wwwroot } from "../utils.js";

export const FileStatus = Object.freeze({
    "ERROR": -1,
    "NOT_FOUND": 1,
    "SUCCESS": 2,
});

export class RequestFile {

    fileName;
    filePath;
    projectName;
    projectScope;

    constructor(fileName, projectName, projectScope) {
        this.fileName = fileName;
        this.projectName = projectName;
        this.projectScope = projectScope;

        this.filePath = path.join(wwwroot, projectName, projectScope, fileName);
    }

    async readFile() {
        return new Promise((resolve, reject) => {
            fs.readFile(this.filePath, (err, data) => {
                if (err) {

                    if (["ENOENT", "ENOTDIR"].includes(err.code)) {
                        return reject(ResponseFile.NOT_FOUND);
                    }

                    return reject(new ResponseFile(FileStatus.ERROR, null, err));

                }

                return resolve(new ResponseFile(FileStatus.SUCCESS, data, err));
            })
        })
    }

    async deleteFile() {
        return RequestFile.deleteFile(this.filePath);
    }

    async preparePath() {
        return RequestFile.preparePath(this.projectName, this.projectScope);
    }

    static validJoin(...args) {
        return args.every(arg => !!arg);
    }

    static async preparePath(projectName, projectScope) {
        return new Promise((resolve, reject) => {
            if (!this.validJoin(projectName, projectScope)) {
                return reject(new ResponseFile(FileStatus.ERROR, null, "Invalid projectName or projectScope"));
            }

            const path_ = path.join(wwwroot, projectName, projectScope);
            fs.mkdir(path_, { recursive: true }, (err) => {
                if (err) {
                    reject(new ResponseFile(FileStatus.ERROR, null, err));
                }

                resolve(ResponseFile.fromPath(path_).SUCCESS);
            })
        })
    }

    static async deleteFile(filePath) {
        return new Promise((resolve, reject) => {
            
            if (!fs.existsSync(filePath)) {
                return resolve(ResponseFile.NOT_FOUND);
            }
            
            
            fs.unlink(filePath, (err) => {
                if (err) {
                    return resolve(new ResponseFile(FileStatus.ERROR, null, err));
                }
                
                try {
                    if (fs.readdirSync(path.dirname(filePath)).length === 0) {
                        fs.rmdirSync(path.dirname(filePath));
                    }
                } catch (error) {
                    console.info(error)
                }
                
                return resolve(ResponseFile.fromPath(filePath).SUCCESS);
            })
        })
    }

}

export class ResponseFile {
    
    status;
    error;
    data;
    path;

    constructor(status, data, error, path) {
        this.status = status;
        this.error = error;
        this.data = data;
        this.path = path;
    }

    static fromPath = (path) => {
        return {
            SUCCESS: new ResponseFile(FileStatus.SUCCESS, null, null, path),
            ERROR: new ResponseFile(FileStatus.ERROR, null, null, path)
        };
    }

    static NOT_FOUND = new ResponseFile(FileStatus.NOT_FOUND, null, null);

    static ERROR = new ResponseFile(FileStatus.ERROR, null, null);

    static SUCCESS = new ResponseFile(FileStatus.SUCCESS, null, null);
}

