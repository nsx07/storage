import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { FileService } from "../services/FileService.js";
import { FileProcessor } from "../core/FileProcessor.js";
import { DirectoryView } from "../core/DirectoryView.js";
import { wwwroot, prepareResponseFile, convertObjectUrlParsed } from "../utils.js";
import { FileStatus, RequestFile } from "../core/RequestFile.js";
import swaggerJson from "../swagger.json" assert { type: "json" };

export const router = Router();
const fservice = new FileService(wwwroot);

router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerJson, { explorer: true }));

/**
 * Save file.
 * @param {Object} request.file - The file object in the request.
 * @param {string} request.query.projectName - The name of the project.
 * @param {string} request.query.projectScope - The scope of the project.
 */
router.post("/save", FileProcessor, async (req, res) => {
    try {
        if (req.file || req.files) {
            return res.status(201).send(prepareResponseFile(req));
        }
        res.status(400).send({message: "File missing."})
    } catch (error) {
        res.status(400).send({message: error.message || "Error saving file"});
    }
})

/**
 * Update file.
 * @param {Object} request.file - The file object in the request.
 * @param {string} request.query.projectName - The name of the project.
 * @param {string} request.query.projectScope - The scope of the project.
 * @param {string} request.query.oldFileName - The name of the file to update.
 */
router.put("/update", FileProcessor, async (req, res) => {
    try {
        if (req.file || req.files) {
            return res.status(201).send(prepareResponseFile(req));
        }
        res.status(400).send({message: "File missing."})
    } catch (error) {
        res.status(400).send({message: error.message || "Error saving file"});
    }
})

/**
 * Get file information.
 * 
 * @param {string} fileName - The name of the file.
 * @param {string} projectName - The name of the project.
 * @param {string} projectScope - The scope of the project.
 * @returns {object} The file information.
 */
router.get("/get", async (req, res) => {
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
            
            return res.status(500).send({message: "Error saving file"});
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
        res.status(500).send({message: "Error getting file"});
    }
})

/**
 * Delete a file.
 * 
 * @param {string} fileName - The name of the file.
 * @param {string} projectName - The name of the project.
 * @param {string} projectScope - The scope of the project.
 * @returns {object} The result of the deletion.
 */
router.delete("/delete", async (req, res) => {

    try {
        const request = req.body;
        const fileRequest = new RequestFile(request.fileName, request.projectName, request.projectScope);
        
        const result = await fileRequest.deleteFile();
    
        if (result.status != FileStatus.SUCCESS) {
            
            if (result.status === FileStatus.NOT_FOUND) {
                return res.status(404).send({message: "File not found"});
            }
            
            return res.status(500).send({message: "Error deleting file"});
        }
    
        res.status(200).send(JSON.stringify({
            fileName: fileRequest.fileName,
            projectName: fileRequest.projectName,
            projectScope: fileRequest.projectScope,
            filePath: fileRequest.filePath,
        }))
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error deleting file"});
    }

})

/**
 * Get the list of directories and files in a tree structure.
 * 
 * @returns {object} The list of directories and files.
 */
router.get("/listTree", async (req, res) => {
    
    return res.status(200).send(JSON.stringify([DirectoryView.listFromPath(wwwroot)], null, 2));

})

router.post("/createDirectory", async (req, res) => {
    try {
        const body = req.body;

        const result = await fservice.createDirectory(body.path);

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error creating directory"});
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error creating directory"});
    }
})

router.delete("/deleteDirectory", async (req, res) => {
    try {
        const body = req.body;

        console.log(convertObjectUrlParsed(body));
        const result = await fservice.deleteDirectory(convertObjectUrlParsed(body));

        console.log(result);

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error deleting directory"});
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error deleting directory"});
    }
})

router.patch("/renameDirectory", async (req, res) => {
    try {
        const body = req.body;

        const result = await fservice.rename(body.oldPath, body.newPath);

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error renaming directory"});
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error renaming directory"});
    }
})

router.patch("/renameFile", async (req, res) => {
    try {
        const body = req.body;

        const result = await fservice.rename(body.oldPath, body.newPath);

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error renaming file"});
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error renaming file"});
    }
})

router.patch("/moveFile", async (req, res) => {
    try {
        const body = req.body;

        const result = await fservice.rename(body.oldPath, body.newPath);

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error moving file"});
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error moving file"});
    }
})

router.patch("/moveDirectory", async (req, res) => {
    try {
        const body = req.body;

        const result = await fservice.rename(body.oldPath, body.newPath);

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error moving directory"});
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error moving directory"});
    }
})

router.put("/copyFile", async (req, res) => {
    try {
        const body = req.body;

        const result = await fservice.copyFile(body.oldPath, body.newPath);

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error copying file"});
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error copying file"});
    }
})

router.put("/copyDirectory", async (req, res) => {
    try {
        const body = req.body;

        const result = await fservice.copyDirectory(body.oldPath, body.newPath);

        if (result.status != FileStatus.SUCCESS) {
            return res.status(500).send({message: "Error copying directory"});
        }

        res.status(200).send(JSON.stringify({
            path: result.path,
            status: result.status
        }))
        
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "Error copying directory"});
    }
})
