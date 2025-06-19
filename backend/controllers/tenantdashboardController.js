import Resource from '../models/Resource.js';
import Tenant from '../models/Tenant.js';
import logger from '../utils/logger.js';
import AccessLog from '../models/AccessLog.js';

// Get all tenants (for dropdown list)
export const getAllTenants = async (req, res) => {
  try {
    if (req.user.role !== "tenant-admin") {
      logger.warn(`Unauthorized access to tenant list by ${req.user.id}`);
      return res.status(403).json({ message: "Access denied" });
    }

    const tenants = await Tenant.find().sort({ createdAt: -1 });
    logger.info(`All tenants viewed by TenantAdmin ${req.user.id}`);
    res.status(200).json(tenants);
  } catch (error) {
    logger.error(`Error fetching tenants: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

// Get resources created by the current Tenant Admin
export const getResources = async (req, res) => {
  try {
    const { id, role } = req.user;

    if (role !== "tenant-admin") {
      logger.warn(`Unauthorized access to resources by ${id}`);
      return res.status(403).json({ message: "Access denied" });
    }

    const resources = await Resource.find({ createdBy: id });

    const formatted = await Promise.all(
      resources.map(async (res) => {
        const tenant = await Tenant.findOne({ tenantId: res.tenantId });
        return {
          ...res.toObject(),
          tenantName: tenant?.name || "Unknown Tenant",
          tenantUUID: res.tenantId
        };
      })
    );

    logger.info(`Resources viewed by TenantAdmin ${id}`);
    res.status(200).json(formatted);
  } catch (error) {
    logger.error(`Get Resources Error: ${error.message}`);
    res.status(500).json({ message: "Error fetching resources" });
  }
};

export const getAccessLogs = async (req, res) => {
  try {
    const logs = await AccessLog.find().sort({ accessedAt: -1 }); // or filtered by tenant
    res.json(logs);
  } catch (error) {
    console.error("Error fetching access logs:", error);
    res.status(500).json({ message: "Error fetching access logs" });
  }
};