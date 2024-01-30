import { wwwroot, prepareResponseFile, convertObjectUrlParsed, parsePlatformPathWithRoot, VALIDATOR, parsePlatformPath } from "../utils.js";
import { FileStatus, RequestFile } from "../core/RequestFile.js";
import { DirectoryView } from "../core/DirectoryView.js";
import { FileService } from "../services/FileService.js";
import { Request, Response } from "express";
import path from "path";

const fservice = new FileService();

/**
 * Save file.
 * @param {Object} request.file - The file object in the request.
 * @param {string} request.query.projectName - The name of the project.
 * @param {string} request.query.projectScope - The scope of the project.
 */
export const save = async (req: Request, res: Response) => {
    try {
        if (req.file || req.files) {
            return res.status(201).send(prepareResponseFile(req));
        }
        res.status(400).send({message: "File missing."})
    } catch (error) {
        res.status(500).send({message: "Error saving file", error: error});
    }
}

/**
 * Update file.
 * @param {Object} request.file - The file object in the request.
 * @param {string} request.query.projectName - The name of the project.
 * @param {string} request.query.projectScope - The scope of the project.
 * @param {string} request.query.oldFileName - The name of the file to update.
 */
export const update = async (req: Request, res: Response) => {
    try {
        if (req.file || req.files) {
            return res.status(201).send(prepareResponseFile(req));
        }
        res.status(400).send({message: "File missing."})
    } catch (error) {
        res.status(400).send({message: "Error saving file", error: error});
    }
}

/**
 * Get file information.
 * 
 * @param {string} fileName - The name of the file.
 * @param {string} projectName - The name of the project.
 * @param {string} projectScope - The scope of the project.
 * @returns {object} The file information.
 */
export const get = async (req: Request, res: Response) => {
    try {
        const request = {
            fileName: req.query.fileName as string,
            projectName: req.query.projectName as string,
            projectScope: req.query.projectScope as string
        };
    
        const fileRequest = new RequestFile(request.fileName, request.projectName, request.projectScope);
        
        const result = await fileRequest.readFile();
    
        if (result.status != FileStatus.SUCCESS) {
            
            if (result.status === FileStatus.NOT_FOUND) {
                return res.status(404).send({message: "File not found"});
            }
            
            return res.status(500).send({message: "Error saving file", error: result.error});
        }
    
        res.status(200).send(JSON.stringify({
            fileName: fileRequest.fileName,
            projectName: fileRequest.projectName,
            projectScope: fileRequest.projectScope,
            filePath: fileRequest.filePath,
            data: result.data
        }))
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error getting file", error: (error as Error).name, exception: (error as Error).message});
    }
}

/**
 * Delete a file.
 * 
 * @param {string} fileName - The name of the file.
 * @param {string} projectName - The name of the project.
 * @param {string} projectScope - The scope of the project.
 * @returns {object} The result of the deletion.
 */
export const deleteFile = async (req: Request, res: Response) => {

    try {
        const request = req.query as Record<string, string>;
        const fileRequest = new RequestFile(request.fileName, request.projectName, request.projectScope);
        
        const result = await fileRequest.deleteFile();
    
        if (result.status != FileStatus.SUCCESS) {
            
            if (result.status === FileStatus.NOT_FOUND) {
                return res.status(404).send({message: "File not found"});
            }
            
            return res.status(500).send({message: "Error deleting file", error: result.error});
        }
    
        res.status(200).send(JSON.stringify({
            fileName: fileRequest.fileName,
            projectName: fileRequest.projectName,
            projectScope: fileRequest.projectScope,
            filePath: fileRequest.filePath,
        }))
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error deleting file", error: (error as Error).name, exception: (error as Error).message});
    }

}

/**
 * Get the list of directories and files in a tree structure.
 * 
 * @returns {object} The list of directories and files.
 */
export const listTree = async (req: Request, res: Response) => {
    return res.status(200).send(JSON.stringify([DirectoryView.listFromPath(wwwroot)], null, 2));
}

export const createDirectory = async (req: Request, res: Response) => {
    try {
        const body = req.body;

        const result = await fservice.createDirectory(VALIDATOR.critical(wwwroot + body.path));

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error creating directory", error: result.error})
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error creating directory", error: (error as Error).name, exception: (error as Error).message});
    }
}

export const deleteDirectory = async (req: Request, res: Response) => {
    try {
        const body = req.query;
        
        console.log(convertObjectUrlParsed(body));
        const result = await fservice.deleteDirectory(VALIDATOR.critical(convertObjectUrlParsed(body)));
        

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error deleting directory", error: result.error});
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error deleting directory", error: (error as Error).name, exception: (error as Error).message});
    }
}

export const rename = async (req: Request, res: Response) => {
    try {
        const body = req.body;
        console.log(body);

        const result = await fservice.rename(
            VALIDATOR.critical(parsePlatformPathWithRoot(body.oldPath)), 
            VALIDATOR.critical(parsePlatformPathWithRoot(body.newPath))
        );

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error renaming directory", error: result.error});
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error renaming directory", error: (error as Error).name, exception: (error as Error).message});
    }
}

export const renameFile = async (req: Request, res: Response) => {
    try {
        const body = req.body;

        const result = await fservice.rename(VALIDATOR.critical(body.oldPath), VALIDATOR.critical(body.newPath));

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error renaming file", error: result.error});
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error renaming file", error: (error as Error).name, exception: (error as Error).message});
    }
}

export const moveFile = async (req: Request, res: Response) => {
    try {
        const body = req.body;

        const result = await fservice.rename(VALIDATOR.critical(body.oldPath), VALIDATOR.critical(body.newPath));

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error moving file", error: result.error});
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error moving file", error: (error as Error).name, exception: (error as Error).message});
    }
}

export const moveDirectory = async (req: Request, res: Response) => {
    try {
        const body = req.body;

        const result = await fservice.rename(VALIDATOR.critical(body.oldPath), VALIDATOR.critical(body.newPath));

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error moving directory", error: result.error});
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error moving directory", error: (error as Error).name, exception: (error as Error).message});
    }
}

export const copyFile = async (req: Request, res: Response) => {
    try {
        const body = req.body;

        const result = await fservice.copyFile(VALIDATOR.critical(body.oldPath), VALIDATOR.critical(body.newPath));

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error copying file", error: result.error});
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error copying file", error: (error as Error).name, exception: (error as Error).message});
    }
}

export const copyDirectory = async (req: Request, res: Response) => {
    try {
        const body = req.body;

        const result = await fservice.copyDirectory(VALIDATOR.critical(body.oldPath), VALIDATOR.critical(body.newPath));

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error copying directory", error: result.error});
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error copying directory", error: (error as Error).name, exception: (error as Error).message});
    }
}

export const log = async (req: Request, res: Response) => {
    try {
        const body = req.body;

        const result = await fservice.log(VALIDATOR.critical(parsePlatformPath("/logs/" + body.path)), body.content);

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error logging", error: result.error});
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error logging", error: (error as Error).name, exception: (error as Error).message});
    }
}

export const validateToken = (req: Request, res: Response) => {

    const token = req.query.token;

    if (!token) {
        res.status(400).send({ success: false, message: "Token is missing" })
        return
    }

    if (token != process.env.STORAGE_TOKEN) {
        res.status(401).send({ success: false, message: "Token is invalid" })
        return
    }

    res.status(200).send({ success: true, message: "Token validated" })
}

export const downloadZip = async (req: Request, res: Response) => {
    try {
        const query = req.query;

        let out = `${wwwroot}/temp_${Date.now()}.zip`
        
        const result = await fservice.zipDirectory(VALIDATOR.critical(path.join(wwwroot, query.path as string), false), out);
        
        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error downloading zip", error: result.error});
        }
        
        if (!fservice.fileExists(result.path!)) {
            return res.status(500).send({message: "Error reading zip", error: result.error});
        }

        const fileZip = await fservice.readFile(result.path!, "base64");

        fservice.deleteFile(result.path!);
        
        res.status(200).send(JSON.stringify({
            dataZip: fileZip.data,
            path: result.path,
            status: result.status,
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error downloading zip", error: (error as Error).name, exception: (error as Error).message});
    }
}