import { Document, Types } from "mongoose";
// _id = demand._id // This is the demand_id --> auto generated in mongodb

export interface IDemand extends Document {
	demand_name: string;
	demand_rate: string;
}
