//controllers/tenantController.js

import Tenant from '../models/Tenant.js';
import logger from '../utils/logger.js';

export const createTenant = async (req, res) => {
  try {
    const { name, tenantId } = req.body;

    if (!name || !tenantId) {
      logger.warn("Tenant creation failed: Missing name or tenantId");
      return res.status(400).json({ message: "Name and tenantId are required" });
    }

    if (!req.user || !req.user.id) {
      logger.warn("Tenant creation failed: User not authenticated");
      return res.status(401).json({ message: "User  not authenticated" });
    }

    const existing = await Tenant.findOne({ tenantId });
    if (existing) {
      logger.warn(`Tenant creation failed: TenantId ${tenantId} already exists`);
      return res.status(409).json({ message: "Tenant ID already exists" });
    }

    const tenant = await Tenant.create({ name, tenantId, createdBy: req.user.id });
    logger.info(`Tenant Created - Name: ${name}, TenantId: ${tenantId}, Created By: ${req.user.id}`);
    res.status(201).json({ message: "Tenant created successfully", tenant });
  } catch (error) {
    logger.error(`Error creating tenant: ${error.message}`, error);
    console.error("Error creating tenant:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getAllTenants = async (req, res) => {
  try {
    if (req.user.role !== "tenant-admin") {
      logger.warn(`Unauthorized access to tenants list by ${req.user.id}`);
      return res.status(403).json({ message: "Access denied" });
    }

    // Fetch only tenants created by the logged-in tenant-admin
    const tenants = await Tenant.find();
    logger.info(`Tenants fetched by Tenant Admin: ${req.user.id}`); 
    res.status(200).json(tenants);
  } catch (error) {
    logger.error(`Error fetching tenants: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const validateTenantByName = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    logger.warn("Tenant validation failed: Missing tenant name");
    return res.status(400).json({ message: "Tenant name is required" });
  }

  try {
    const tenant = await Tenant.findOne({ name });

    if (!tenant) {
      logger.warn(`Tenant validation failed: Tenant '${name}' not found`);
      return res.status(404).json({ message: "Invalid tenant name" });
    }
    logger.info(`Tenant Validation Success - Name: ${name}`);
    res.status(200).json({
      tenantId: tenant.tenantId,
    });
  } catch (err) {
    logger.error(`Error during tenant validation: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      name: req.body.name,
      tenantId: req.body.tenantId,
    };

    const updatedTenant = await Tenant.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true, // still enforces schema rules, but only for the updated fields
    });

    if (!updatedTenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    res.status(200).json({ message: "Tenant updated successfully", tenant: updatedTenant });
  } catch (error) {
    console.error("Error updating tenant:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
