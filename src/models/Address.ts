import mongoose, { Schema } from "mongoose";
import { AddressInterface } from "../interfaces/Address";

const AddressSchema: Schema = new Schema({
    street: {
        type: String,
        required: [true, 'Street is required']
    },
    city: {
        type: String,
        required: [true, 'City is required']
    },
    block: {
        type: String,
        required: false
    },
    governorate: {
        type: String,
        required: false
    },
    house: {
        type: String,
        required: [true, 'House number is required']
    },
    flat: {
        type: String,
        required: false
    }
}, { _id: false }); // _id: false prevents creating an _id for subdocuments

const Address = mongoose.model<AddressInterface>("Address", AddressSchema);

export { AddressSchema }; // Export the schema for use in User model
export default Address; 