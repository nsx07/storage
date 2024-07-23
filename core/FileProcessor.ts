import path from "path";
import multer from "multer";
import { _root, wwwroot } from "../utils.js";
import { RequestFile } from "./RequestFile.js";

const methodHandler = {
  POST: async (req: any): Promise<void> => {
    const request = {
      projectName: req.query.projectName,
      projectScope: req.query.projectScope,
    };
  },
  PUT: async (req: any): Promise<void> => {
    const request = {
      projectName: req.query.projectName,
      projectScope: req.query.projectScope,
      oldFileName: req.query.oldFileName,
    };

    if (request.oldFileName) {
      console.log(request.oldFileName);
      await RequestFile.deleteFile(
        path.join(
          wwwroot,
          request.projectName,
          request.projectScope,
          request.oldFileName
        )
      );
    }
  },
};

const storage = multer.diskStorage({
  destination: async (req, file, callback) => {
    let path;

    try {
      //@ts-ignore
      await methodHandler[req.method](req);
      const prepare = await RequestFile.preparePath(
        (req.query as any).projectName,
        (req.query as any).projectScope
      );
      path = prepare.path;
    } catch (error) {
      req._destroy(error as Error, (d) => {
        console.log(d);
      });

      console.log(error);
    }

    callback(null, path!);
  },
  filename: (req, file, callback) => {
    const lastDot = file.originalname.lastIndexOf(".");
    const name = file.originalname.slice(0, lastDot).split(" ").join("_");
    const extensionFile = file.originalname.slice(lastDot + 1);
    callback(null, `${name}.${extensionFile}`);
  },
});

export const FileProcessor = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      !RequestFile.validJoin(
        req.query.projectName as string
        //req.query.projectScope as string
      )
    ) {
      return cb(new Error("Invalid project name or scope"));
    }

    cb(null, true);
  },
}).array("file", 5);
