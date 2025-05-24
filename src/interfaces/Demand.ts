import { Document } from "mongoose";
// _id = demand._id // This is the demand_id --> auto generated in mongodb

export interface DemandInterface extends Document {
	demand_name: string;
	demand_rate: string;
}
