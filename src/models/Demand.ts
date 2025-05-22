import mongoose, { Schema } from "mongoose";
import { IDemand } from "../interfaces/IDemand";

const DemandSchema: Schema = new Schema(
	{
		demand_name: { type: String, required: true },
		demand_rate: { type: String, required: true },
	},
	{ timestamps: true },
);

const Demand = mongoose.model<IDemand>("Demand", DemandSchema);

export default Demand;
