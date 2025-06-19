// routes/serviceRoutes.js
import express from "express";
const router = express.Router();
import { getServiceByTitle } from "../controllers/serviceController.js";

// GET - get a service by title
router.get("/", getServiceByTitle);

export default router;
