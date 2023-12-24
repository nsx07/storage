import { Router } from "express";
import { FileProcessor } from "../core/FileProcessor.js";
import { FileStatus, RequestFile } from "../core/RequestFile.js";
import { DirectoryView } from "../core/DirectoryView.js";
import { wwwroot } from "../utils.js";
import swaggerUi from "swagger-ui-express";
import swaggerJson from "../swagger.json" assert { type: "json" };

export const router = Router();

router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerJson, { explorer: true }));

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
const prepareResponseFile = (request) => {

    if (request.files) {
        return request.files.map(file => {
            return {
                fileName: file.filename,
                projectName: request.query.projectName,
                projectScope: request.query.projectScope,
                filePath: file.path
            }
        })
    }

    return {
        fileName: request.file.filename,
        projectName: request.query.projectName,
        projectScope: request.query.projectScope,
        filePath: request.file.path
    }

}

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

