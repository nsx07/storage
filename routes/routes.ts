import { createDirectory, deleteDirectory, deleteFile, get, listTree, moveDirectory, moveFile, rename, renameFile, save, update, log, copyFile, copyDirectory, validateToken, downloadZip } from "./storage.js";
import { backup, listJobs, restore, removeBackup, listBackups, updateBackup } from "./backup.js";
import { FileProcessor } from "../core/FileProcessor.js";
import { Router } from "express";

export const router = Router();

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
router.get("/validateToken", (req, res) => validateToken(req, res))
router.get("/downloadZip", async (req, res) => downloadZip(req, res))   

//backup
router.post("/backup", async (req, res) => backup(req, res))
router.post("/restore", async (req, res) => restore(req, res))
router.delete("/removeBackup", async (req, res) => removeBackup(req, res))
router.get("/listJobs", async (req, res) => listJobs(req, res))
router.get("/listBackups", async (req, res) => listBackups(req, res))
router.post("/updateBackup", async (req, res) => updateBackup(req, res))
