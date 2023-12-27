import fs from "fs";
import path from "path";
import process from "process";
import { ResponseFile, FileStatus } from "../core/RequestFile.js";

export class FileService {

    path;

    constructor(path) {
        this.path = path;
    }

    async createFile(filePath, data) {
        
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, data, (err) => {
                if (err) {
                    reject(new ResponseFile(FileStatus.ERROR, null, err));
                }

                resolve(ResponseFile.fromPath(filePath).SUCCESS);
            })
        })
    }

    async deleteFile(filePath) {
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

    async createDirectory(directoryPath) {
        return new Promise((resolve, reject) => {
            fs.mkdir(directoryPath, (err) => {
                if (err) {
                    reject(new ResponseFile(FileStatus.ERROR, null, err));
                }

                resolve(ResponseFile.fromPath(directoryPath).SUCCESS);
            })
        })
    }

    async deleteDirectory(directoryPath, force = true) {
        return new Promise((resolve, reject) => {
            
            if (!fs.existsSync(directoryPath)) 
                return resolve(ResponseFile.NOT_FOUND);
            
            fs.rm(directoryPath, {force: force, recursive: force}, (err) => {
                if (err) {
                    return resolve(new ResponseFile(FileStatus.ERROR, null, err));
                }

                return resolve(ResponseFile.fromPath(directoryPath).SUCCESS);
            })
        })
    }

    async rename(oldPath, newPath) {
        return new Promise((resolve, reject) => {
            
            if (!fs.existsSync(oldPath)) 
                return resolve(ResponseFile.NOT_FOUND);
            
            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    return resolve(new ResponseFile(FileStatus.ERROR, null, err));
                }

                return resolve(ResponseFile.fromPath(newPath).SUCCESS);
            })
        })
    }

    async copyFile(oldPath, newPath) {
        return new Promise((resolve, reject) => {
            
            if (!fs.existsSync(oldPath)) 
                return resolve(ResponseFile.NOT_FOUND);
            
            fs.copyFile(oldPath, newPath, (err) => {
                if (err) {
                    return resolve(new ResponseFile(FileStatus.ERROR, null, err));
                }

                return resolve(ResponseFile.fromPath(newPath).SUCCESS);
            })
        })
    }

    async copyDirectory(oldPath, newPath) {
        return new Promise((resolve, reject) => {
            var readStream = fs.createReadStream(oldPath);
            var writeStream = fs.createWriteStream(newPath);

            const cbErr = (err) => resolve(new ResponseFile(FileStatus.ERROR, null, err));
    
            readStream.on('error', cbErr);
            writeStream.on('error', cbErr);
    
            readStream.on('close', function () {
                fs.unlink(oldPath, callback);
                resolve(ResponseFile.fromPath(newPath).SUCCESS);
            });
    
            readStream.pipe(writeStream);
        })
    }

    async moveFile(oldPath, newPath) {
        return new Promise((resolve, reject) => {
            
            if (!fs.existsSync(oldPath)) 
                return resolve(ResponseFile.NOT_FOUND);
            
            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    return resolve(new ResponseFile(FileStatus.ERROR, null, err));
                }

                return resolve(ResponseFile.fromPath(newPath).SUCCESS);
            })
        })
    }

    async moveDirectory(oldPath, newPath) {
        return new Promise((resolve, reject) => {
            reject("Not implemented")
        })
    }

}