import path from "path";
import multer from "multer";
import { _root, wwwroot } from "../utils.js";
import { RequestFile } from "./RequestFile.js";

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
  "audio/mp3": "mp3",
  "application/javascript": "js",
  "application/json": "json",
  "application/xml": "xml",
  "text/plain": "txt",
  "text/html": "html",
  "text/css": "css",
  "text/javascript": "js",
};

const methodHandler = {
    POST: async (req) => {
        const request = {
            projectName: req.query.projectName,
            projectScope: req.query.projectScope,
        };
    }, 
    PUT: async (req) => {
        const request = {
            projectName: req.query.projectName,
            projectScope: req.query.projectScope,
            oldFileName: req.query.oldFileName
        };

        if (request.oldFileName) {
            console.log(request.oldFileName);
            await RequestFile.deleteFile(path.join(wwwroot, request.projectName, request.projectScope, request.oldFileName));
        }
    },
}

const storage = multer.diskStorage({
  destination: async (req, file, callback) => {
    let path;

    try {
      methodHandler[req.method](req);
      const prepare = await RequestFile.preparePath(req.query.projectName, req.query.projectScope);
      path = prepare.path;
    } catch (error) {
      req._destroy(error)

      console.log(error)
    }

    callback(null, path);

  },
  filename: (req, file, callback) => {
    const lastDot = file.originalname.lastIndexOf(".");
    const name = file.originalname.slice(0, lastDot).split(" ").join("_");
    const extensionFile = file.originalname.slice(lastDot);
    const extension = MIME_TYPES[file.mimetype] || 
                      (Object.values(MIME_TYPES).includes(extensionFile) 
                              ? extensionFile 
                              : "txt");
    callback(null, `${name}.${extension}`);
  },
});

export const FileProcessor = multer({ storage: storage, fileFilter: (req, file, cb) => {
  if (!req.query.projectName || !req.query.projectScope) {
    return cb(new Error("Invalid projectName or projectScope"));
  }

  if (!RequestFile.validJoin(req.query.projectName, req.query.projectScope)) {
    return cb(new Error("Invalid path! wwwroot is a reserved path"));
  }

  cb(null, true);
} }).array("file", 5);