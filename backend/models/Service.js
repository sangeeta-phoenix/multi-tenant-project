//models/Service.js

import mongoose  from "mongoose";

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: String,
  description: String,
});

const Service = mongoose.model("Service", serviceSchema);
export default Service;

