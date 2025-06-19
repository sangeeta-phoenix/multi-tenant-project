//models/Resource.js

import mongoose from "mongoose";

const ResourceSchema = new mongoose.Schema({
  name: String,
  type: String,
  provider: { type: String, enum: ["AWS", "Azure", "GCP","OCI"] },
  region: String,
  cost: Number,
  status: { type: String, enum: ["Active", "Idle", "Terminated"] },
  tenantId: {
    type: String,
    ref: 'Tenant',
    required: true
  },  
  cpu: { type: String, default: "N/A" }, // ✅ New field
  processor: { type: String, default: "N/A" }, // ✅ New field
  memory: { type: String, default: "N/A" }, // ✅ New field
  createdAt: { type: Date, default: Date.now },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // ✅ this must be here
    required: true,
  },
},{ timestamps: true });


const Resource = mongoose.model("Resource", ResourceSchema);
export default Resource;




