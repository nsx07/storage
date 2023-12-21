import { Router } from "express";
import { fileProcessor } from "../core/fileProcessor.js";
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

router.post("/save", fileProcessor, async (req, res) => {
    res.status(201).send(prepareResponseFile(req));
})

router.put("/update", fileProcessor, async (req, res) => {
    res.status(200).send(prepareResponseFile(req));
})

router.get("/get", async (req, res) => {
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
})

router.delete("/delete", async (req, res) => {

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

})

