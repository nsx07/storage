import { wwwroot, prepareResponseFile, convertObjectUrlParsed, parsePlatformPathWithRoot, VALIDATOR, parsePlatformPath } from "../utils.js";
import { FileStatus, RequestFile } from "../core/RequestFile.js";
import { DirectoryView } from "../core/DirectoryView.js";
import { FileService } from "../services/FileService.js";

const fservice = new FileService();

/**
 * Save file.
 * @param {Object} request.file - The file object in the request.
 * @param {string} request.query.projectName - The name of the project.
 * @param {string} request.query.projectScope - The scope of the project.
 */
export const save = async (req, res) => {
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
export const update = async (req, res) => {
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
export const get = async (req, res) => {
    try {
        const request = {
            fileName: req.query.fileName,
            projectName: req.query.projectName,
            projectScope: req.query.projectScope
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
        res.status(500).send({message: "Error getting file", error: error.message, exception: error.exception});
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
export const deleteFile = async (req, res) => {

    try {
        const request = req.query;
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
        res.status(500).send({message: "Error deleting file", error: error.message, exception: error.exception});
    }

}

/**
 * Get the list of directories and files in a tree structure.
 * 
 * @returns {object} The list of directories and files.
 */
export const listTree = async (req, res) => {
    return res.status(200).send(JSON.stringify([DirectoryView.listFromPath(wwwroot)], null, 2));
}

export const createDirectory = async (req, res) => {
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
        res.status(500).send({message: "Error creating directory", error: error.message, exception: error.exception});
    }
}

export const deleteDirectory = async (req, res) => {
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
        res.status(500).send({message: "Error deleting directory", error: error.message, exception: error.exception});
    }
}

export const rename = async (req, res) => {
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
        res.status(500).send({message: "Error renaming directory", error: error.message, error: error.message, exception: error.exception});
    }
}

export const renameFile = async (req, res) => {
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
        res.status(500).send({message: "Error renaming file", error: error.message, exception: error.exception});
    }
}

export const moveFile = async (req, res) => {
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
        res.status(500).send({message: "Error moving file", error: error.message, exception: error.exception});
    }
}

export const moveDirectory = async (req, res) => {
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
        res.status(500).send({message: "Error moving directory", error: error.message, exception: error.exception});
    }
}

export const copyFile = async (req, res) => {
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
        res.status(500).send({message: "Error copying file", error: error.message, exception: error.exception});
    }
}

export const copyDirectory = async (req, res) => {
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
        res.status(500).send({message: "Error copying directory", error: error.message, exception: error.exception});
    }
}

export const log = async (req, res) => {
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
        res.status(500).send({message: "Error logging", error: error.message, exception: error.exception});
    }
}