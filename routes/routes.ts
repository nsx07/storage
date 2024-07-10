import {
  createDirectory,
  deleteDirectory,
  deleteFile,
  get,
  listTree,
  moveDirectory,
  moveFile,
  rename,
  renameFile,
  save,
  update,
  log,
  copyFile,
  copyDirectory,
  validateToken,
  downloadZip,
} from "./storage.js";
import {
  backup,
  listJobs,
  restore,
  removeBackup,
  listBackups,
  updateBackup,
} from "./backup.js";
import { FileProcessor } from "./../core/FileProcessor.js";
import { Router } from "express";
import { auth } from "./../middleware/auth.js";
import { cache } from "./../middleware/cache.js";
import { CacheService } from "./../services/CacheService.js";

export const router = Router();

//storage
router.put("/log", auth, async (req, res) => log(req, res));
router.get("/get", auth, async (req, res) => get(req, res));
router.patch("/rename", auth, async (req, res) => rename(req, res));
router.put("/copyFile", auth, async (req, res) => copyFile(req, res));
router.get("/listTree", auth, async (req, res) => listTree(req, res));
router.patch("/moveFile", auth, async (req, res) => moveFile(req, res));
router.delete("/delete", auth, async (req, res) => deleteFile(req, res));
router.get("/validateToken", (req, res) => validateToken(req, res));
router.get("/downloadZip", auth, async (req, res) => downloadZip(req, res));
router.patch("/renameFile", auth, async (req, res) => renameFile(req, res));
router.post("/save", FileProcessor, auth, async (req, res) => save(req, res));
router.put("/copyDirectory", auth, async (req, res) => copyDirectory(req, res));
router.put("/update", FileProcessor, auth, async (req, res) =>
  update(req, res)
);
router.patch("/moveDirectory", auth, async (req, res) =>
  moveDirectory(req, res)
);
router.post("/createDirectory", auth, async (req, res) =>
  createDirectory(req, res)
);
router.delete("/deleteDirectory", auth, async (req, res) =>
  deleteDirectory(req, res)
);

//backup
router.post(
  "/backup",
  auth,
  cache.open,
  async (req, res, n) => {
    await backup(req, res);
    n();
  },
  cache.close
);
router.post(
  "/restore",
  auth,
  cache.open,
  async (req, res, n) => {
    await restore(req, res);
    n();
  },
  cache.close
);
router.delete(
  "/removeBackup",
  auth,
  cache.open,
  async (req, res, n) => {
    await removeBackup(req, res);
    n();
  },
  cache.close
);
router.get(
  "/listJobs",
  auth,
  cache.open,
  async (req, res, n) => {
    await listJobs(req, res);
    n();
  },
  cache.close
);
router.get(
  "/listBackups",
  auth,
  cache.open,
  async (req, res, n) => {
    await listBackups(req, res);
    n();
  },
  cache.close
);
router.post(
  "/updateBackup",
  auth,
  cache.open,
  async (req, res, n) => {
    await updateBackup(req, res);
    n();
  },
  cache.close
);
router.get(
  "/test",
  auth,
  cache.open,
  async (req, res, n) => {
    await CacheService.test();
    res.json({
      message: "Tested",
      data: await CacheService.get("user-session:123"),
    });
    n();
  },
  cache.close
);
