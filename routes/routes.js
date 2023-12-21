import { Router } from "express";
import { FileProcessor } from "../core/FileProcessor.js";
import { FileStatus, RequestFile } from "../core/RequestFile.js";

export const router = Router();

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

router.post("/save", FileProcessor, async (req, res) => {
    if (req.file || req.files) {
        return res.status(201).send(prepareResponseFile(req));
    }
    res.status(400).send({message: "File missing."})
})

router.put("/update", FileProcessor, async (req, res) => {
    if (req.file || req.files) {
        return res.status(200).send(prepareResponseFile(req));
    }
    res.status(400).send({message: "File missing."})
})

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
        res.status(500).send({message: "Error getting file"});
    }
})

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
        res.status(500).send({message: "Error deleting file"});
    }

})

