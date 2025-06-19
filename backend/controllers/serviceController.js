//controllers/serviceController.js

import Service from "../models/Service.js";

export const getServiceByTitle = async (req, res) => {
    try {
      const service = await Service.findOne({ title: req.query.title });
      if (!service) return res.status(404).json({ error: "Service not found" });
      res.json(service);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch service" });
    }
  };
  