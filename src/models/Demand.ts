import mongoose, { Schema } from "mongoose";
import { DemandInterface } from "../interfaces/Demand";

const DemandSchema: Schema = new Schema(
	{
		demand_name: { type: String, required: true },
		demand_rate: { type: String, required: true },
	},
	{ timestamps: true },
);

const Demand = mongoose.model<DemandInterface>("Demand", DemandSchema);

export default Demand;
