//controllers/authController.js

import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import PendingRegistration from "../models/PendingUser.js";
import mongoose from "mongoose";
import logger from '../utils/logger.js';
import Tenant from "../models/Tenant.js";
import AccessLog from "../models/AccessLog.js";
// Register a new user or admin
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate input
        if (!name || !email || !password || !role) {
            logger.warn("Registration failed: Missing required fields");
            return res.status(400).json({ message: "All fields are required." });
        }

        // Check if user already exists
        const existingPendingUser  = await PendingRegistration.findOne({ email });
        if (existingPendingUser ) {
            logger.warn(`Registration attempt failed: Email ${email} already pending approval`);
            return res.status(400).json({ message: "User  already registered and pending approval." });
        }

        const existingUser  = await User.findOne({ email });
        if (existingUser ) {
            logger.warn(`Registration attempt failed: Email ${email} already pending approval`);
            return res.status(400).json({ message: "User  already exists." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        logger.info(`User Registration Attempt - Email: ${email}, Role: ${role}`);

        // If the role is tenant-admin, create the user directly
        if (role === "super-admin" || role === "tenant-admin") {
            const tenantId = new mongoose.Types.ObjectId(); // Unique tenant ID
            const user = new User({
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role,
                tenantId
            });
            await user.save();
            logger.info(`User Registered - ID: ${user._id}, Role: ${role}, TenantId: ${user.tenantId}`);
            return res.status(201).json({
                message: `${role === 'super-admin' ? "Super Admin" : "Tenant Admin"} registered successfully.`,
                tenantId,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role
                }
            });
        }

        // Create user in Pending Registration for other roles
        const pendingUserData = { name, email: email.toLowerCase(), password: hashedPassword, role };
        const pendingUser  = await PendingRegistration.create(pendingUserData);
        logger.info(`Pending User Registered - Email: ${email}, Role: ${role}`);
        res.status(201).json({ message: "User  created successfully", pendingUser  });
    } catch (error) {
        console.error("Registration Error:", error);
        logger.info(`Pending User Registered - Email: ${email}, Role: ${role}`);
        res.status(500).json({ message: "Server error", error });
    }
};

// Login an existing user or admin
export const login = async (req, res) => {
    try {
        const { email, password,tenantId } = req.body;

        // Validate input
        if (!email || !password) {
            logger.warn("Login failed: Missing email or password");
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find user by email
        const user = await User.findOne({ email:email.toLowerCase() });
        if (!user) {
            logger.warn(`Login failed: User not found with email ${email}`);
            return res.status(404).json({ message: "User not found" });
        }
        logger.info(`User Login Attempt - Email: ${email}`);
        // Compare entered password with stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn(`Login failed: Invalid password for user ${email}`);
            console.log("Password mismatch: Entered -", password, "Stored -", user.password);
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const finalTenantId = tenantId || user.tenantId;
        // Generate JWT token
        const token = jwt.sign(
            { id: user._id.toString(), tenantId: finalTenantId.toString(), role: user.role, email: user.email,  },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        
        const tenant = await Tenant.findOne({ tenantId: finalTenantId });
        const tenantName = tenant ? tenant.name : "Unknown Tenant";

        // Create access log entry
        await AccessLog.create({
            username: user.username || user.email,
            email: user.email,
            role: user.role,
            tenantId: finalTenantId,
            tenantName,
            accessedAt: new Date()
        });
        
        
        
        logger.info(`User Logged In - ID: ${user._id}, Role: ${user.role}, TenantId: ${tenantId || user.tenantId}`);
    
        // Respond with token and user info
        res.json({ token, user: { id: user._id, email: user.email, role: user.role ,tenantId:tenantId||user.tenantId,} });
    } catch (error) {
        console.error("Login Error:", error);
        logger.error(`Login error: ${error.message}`);
        res.status(500).json({ message: "Server error" });
    }
};
