import { createDirectory, deleteDirectory, deleteFile, get, listTree, moveDirectory, moveFile, rename, renameFile, save, update, log } from "./storage.js";
import { backup, listJobs, restore, removeJob } from "./backup.js";
import swaggerJson from "../swagger.json" assert { type: "json" };
import { FileProcessor } from "../core/FileProcessor.js";
import swaggerUi from "swagger-ui-express";
import { wwwroot } from "../utils.js";
import { Router } from "express";

export const router = Router();

//docs
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerJson, { explorer: true }));

//storage
router.put("/log", async (req, res) => log(req, res))
router.get("/get", async (req, res) => get(req, res))
router.patch("/rename", async (req, res) => rename(req, res))
router.put("/copyFile", async (req, res) => copyFile(req, res))
router.get("/listTree", async (req, res) => listTree(req, res))
router.patch("/moveFile", async (req, res) => moveFile(req, res))
router.delete("/delete", async (req, res) => deleteFile(req, res))
router.patch("/renameFile", async (req, res) => renameFile(req, res))
router.post("/save", FileProcessor, async (req, res) => save(req, res))
router.put("/copyDirectory", async (req, res) => copyDirectory(req, res))
router.put("/update", FileProcessor, async (req, res) => update(req, res))
router.patch("/moveDirectory", async (req, res) => moveDirectory(req, res))
router.post("/createDirectory", async (req, res) => createDirectory(req, res))
router.delete("/deleteDirectory", async (req, res) => deleteDirectory(req, res))

//backup
router.post("/backup", async (req, res) => backup(req, res))
router.post("/restore", async (req, res) => restore(req, res))
router.post("/removeJob", async (req, res) => removeJob(req, res))
router.get("/listJobs", async (req, res) => listJobs(req, res))

