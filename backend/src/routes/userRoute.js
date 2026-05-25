import express from "express";
import {
  authMe,
  searchUserByUsername,
  uploadAvatar,
  updateProfile,
  changePassword,
  deleteAccount,
} from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/me", authMe);
router.get("/search", searchUserByUsername);
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);
router.patch("/profile", updateProfile);
router.post("/change-password", changePassword);
router.delete("/account", deleteAccount);

export default router;
