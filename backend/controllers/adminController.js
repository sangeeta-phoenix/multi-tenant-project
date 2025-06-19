//controllers/adminController.js

import User from '../models/User.js';
import PendingRegistration from '../models/PendingUser.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export const approveRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        let { tenantId } = req.body;

        console.log("Approving user with ID:", id);
        console.log("Received Tenant ID:", tenantId);

        if (!tenantId) {
            logger.warn(`Approval failed: Tenant ID missing for pending user ${id}`);
            return res.status(400).json({ message: "Tenant ID is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(tenantId)) {
            logger.warn(`Approval failed: Invalid tenant ID '${tenantId}'`);
            console.error("Invalid Tenant ID:", tenantId);
            return res.status(400).json({ message: "Invalid Tenant ID format. Must be a valid MongoDB ObjectId." });
        }

        tenantId = new mongoose.Types.ObjectId(tenantId);

        const pendingUser = await PendingRegistration.findById(id);
        if (!pendingUser) {
            logger.warn(`Approval failed: Pending user ${id} not found`);
            return res.status(404).json({ message: "Pending user not found" });
        }

        const existingUser = await User.findOne({ email: pendingUser.email });
        if (existingUser) {
            logger.warn(`Approval failed: Email ${pendingUser.email} already exists`);
            return res.status(400).json({ message: "User already exists" });
        }

        const isHashed = pendingUser.password.startsWith("$2b$");
        const hashedPassword = isHashed ? pendingUser.password : await bcrypt.hash(pendingUser.password, 10);
        const user = new User({
            name: pendingUser.name,
            email: pendingUser.email,
            password: hashedPassword,  // ✅ Ensure this is always hashed
            role: pendingUser.role,
            tenantId: tenantId,
        });

        await user.save();
        await PendingRegistration.findByIdAndDelete(id);
        console.log("User approved:", user);
        logger.info(`Super Admin approved user: ${user.email} (Role: ${user.role}, TenantID: ${tenantId})`);

        res.status(201).json({ message: "User approved and created successfully", user });
    } catch (error) {
        logger.error(`Approval error: ${error.message}`);
        console.error("Error in approveRegistration:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Decline a pending user registration
export const declineRegistration = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the pending user by ID
        const pendingUser = await PendingRegistration.findById(id);
        if (!pendingUser) {
            logger.warn(`Decline failed: Pending user ${id} not found`);
            return res.status(404).json({ message: "Pending user not found" });
        }

        // Delete the pending user from the database
        await PendingRegistration.findByIdAndDelete(id);
        logger.info(`Super Admin declined registration: ${pendingUser.email}`);

        res.status(200).json({ message: "Pending registration declined and removed successfully" });
    } catch (error) {
        logger.error(`Approval error: ${error.message}`);
        console.error("Error declining registration:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ✅ Get all users
export const getAllUsers = async (req, res) => {
   try {
    const users = await User.find({}, '_id username email'); // Adjust fields as necessary
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const ActionIncident = async (req, res) => {
  const { action } = req.body;
  try {
    const updated = await Incident.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'Resolved',
          actionTaken: action,
          actionedBy: req.user?.email || 'admin',
          actionedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Incident not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Admin: Resolve Service Request
export const ActionServices = async (req, res) => {
  const { action } = req.body;
  try {
    const updated = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'Resolved',
          actionTaken: action,
          actionedBy: req.user?.email || 'admin',
          actionedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Service request not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};