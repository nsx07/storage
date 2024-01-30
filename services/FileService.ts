import fs from "fs";
import path from "path";
import { wwwroot } from "../utils.js";
import { ResponseFile, FileStatus, RequestFile } from "../core/RequestFile.js";
import { Zipper } from "../core/Zipper.js";

export class FileService {

    path;

    constructor(path?: string) {
        this.path = path;
    }

    fileExists(filePath: string) {
        return [null, undefined, ""].every(x => x != filePath) && fs.existsSync(filePath);
    }

    async createFile(filePath: string, data: string) {
        
        return new Promise<ResponseFile>((resolve, reject) => {
            fs.writeFile(filePath, data, (err) => {
                if (err) {
                    reject(new ResponseFile(FileStatus.ERROR, null, err));
                }

                resolve(ResponseFile.fromPath(filePath).SUCCESS);
            })
        })
    }

    async deleteFile(filePath: string) {
        return new Promise<ResponseFile>((resolve, reject) => {
            
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

    static async createDirectory(directoryPath: string) {
        return new Promise<ResponseFile>((resolve, reject) => {

            if (fs.existsSync(directoryPath)) {
                resolve(ResponseFile.fromPath(directoryPath).SUCCESS);
                return;
            }

            fs.mkdir(directoryPath, (err) => {
                if (err) {
                    reject(new ResponseFile(FileStatus.ERROR, null, err));
                }

                resolve(ResponseFile.fromPath(directoryPath).SUCCESS);
            })
        })
    }

    async createDirectory(directoryPath: string) {
        return FileService.createDirectory(directoryPath);
    }

    async deleteDirectory(directoryPath: string, force = true) {
        return new Promise<ResponseFile>((resolve, reject) => {
            
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

    async rename(oldPath: string, newPath: string) {
        return new Promise<ResponseFile>((resolve, reject) => {
            
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

    async copyFile(oldPath: string, newPath: string) {
        return new Promise<ResponseFile>((resolve, reject) => {
            
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

    async copyDirectory(oldPath: string, newPath: string) {
        return new Promise<ResponseFile>((resolve, reject) => {
            var readStream = fs.createReadStream(oldPath);
            var writeStream = fs.createWriteStream(newPath);

            const cbErr = (err: Error) => resolve(new ResponseFile(FileStatus.ERROR, null, err));
    
            readStream.on('error', cbErr);
            writeStream.on('error', cbErr);
    
            readStream.on('close', function () {
                fs.unlink(oldPath, x => {
                    if (x) {
                        return resolve(new ResponseFile(FileStatus.ERROR, null, x));
                    }
                });
                resolve(ResponseFile.fromPath(newPath).SUCCESS);
            });
    
            readStream.pipe(writeStream);
        })
    }

    async moveFile(oldPath: string, newPath: string) {
        return new Promise<ResponseFile>((resolve, reject) => {
            
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

    async moveDirectory(oldPath: string, newPath: string) {
        return new Promise<ResponseFile>((resolve, reject) => {
            reject("Not implemented")
        })
    }

    static async readFile(filePath: string, encoding: BufferEncoding = "base64url") {
        return new Promise<ResponseFile>((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) {

                    if (["ENOENT", "ENOTDIR"].includes(err.code!)) {
                        return reject(ResponseFile.NOT_FOUND);
                    }

                    return reject(new ResponseFile(FileStatus.ERROR, null, err));

                }

                return resolve(new ResponseFile(FileStatus.SUCCESS, data.toString(encoding), err));
            })
        })
    }

    async log(path: string, content: string) {
        return new Promise<ResponseFile>(async (resolve, reject) => {
            const ncontent = `[${new Date().toISOString()}] - ${content}\n`;
            path += ".txt";
            
            
            try {
                await this.createDirectory(wwwroot + "/logs")
                    .catch((err) => {
                        reject(err);
                    })
                
                fs.appendFileSync(wwwroot + path, ncontent, {encoding: "utf-8"});
                
            } catch (error) {
                reject(error)
            }

        })
    }

    async readFile(filePath: string, encoding: BufferEncoding = "hex") {
        return new Promise<ResponseFile>((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) {

                    if (["ENOENT", "ENOTDIR"].includes(err.code!)) {
                        return reject(ResponseFile.NOT_FOUND);
                    }

                    return reject(new ResponseFile(FileStatus.ERROR, null, err));

                }

                return resolve(new ResponseFile(FileStatus.SUCCESS, data.toString(encoding), err));
            })
        })
    }

    async zipDirectory(directory: string, out: string) {
        return Zipper.zipDirectory(directory, out)
            .then(z => z ? ResponseFile.fromPath(out).SUCCESS : ResponseFile.fromPath(out).ERROR)
            .catch(err => ResponseFile.fromPath(out).ERROR);
    }

    async zipFile(files: string[], out: string) {
        return Zipper.zipFile(files, out)
            .then(z => z ? ResponseFile.fromPath(out).SUCCESS : ResponseFile.fromPath(out).ERROR)
            .catch(err => ResponseFile.fromPath(out).ERROR);
    }

    async unzipDirectory(source: string, out: string) {
        return Zipper.unzipDirectory(source, out)
            .then(z => z ? ResponseFile.fromPath(out).SUCCESS : ResponseFile.fromPath(out).ERROR)
            .catch(err => ResponseFile.fromPath(out).ERROR);
    }

}