"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Newsletter_1 = __importDefault(require("../models/Newsletter"));
const Notification_1 = __importDefault(require("../models/Notification"));
const verificationService_1 = require("../services/verificationService");
function testVerification() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/erlumedb';
            yield mongoose_1.default.connect(uri);
            console.log('✅ Connected to MongoDB\n');
            // Check stored emails
            const newsletters = yield Newsletter_1.default.find({});
            const notifications = yield Notification_1.default.find({});
            console.log('📧 Newsletter Subscriptions:');
            newsletters.forEach(n => {
                console.log(`   Email: ${n.email}`);
                console.log(`   Status: ${n.verificationStatus}`);
                console.log(`   Verified At: ${n.verifiedAt || 'pending'}\n`);
            });
            console.log('🔔 Notification Subscriptions:');
            notifications.forEach(n => {
                console.log(`   Email: ${n.email}`);
                console.log(`   Item: ${n.itemName} by ${n.brandName}`);
                console.log(`   Status: ${n.verificationStatus}`);
                console.log(`   Verified At: ${n.verifiedAt || 'pending'}\n`);
            });
            console.log('\n⏳ Running batch verification...\n');
            yield (0, verificationService_1.batchVerifyEmails)();
            console.log('\n✅ Batch verification completed\n');
            // Check updated status
            const updatedNewsletters = yield Newsletter_1.default.find({});
            const updatedNotifications = yield Notification_1.default.find({});
            console.log('📧 Updated Newsletter Subscriptions:');
            updatedNewsletters.forEach(n => {
                console.log(`   Email: ${n.email}`);
                console.log(`   Status: ${n.verificationStatus}`);
                console.log(`   Verified At: ${n.verifiedAt}`);
                if (n.verifialiaDiagnostics)
                    console.log(`   Diagnostics: ${n.verifialiaDiagnostics}`);
                console.log();
            });
            console.log('🔔 Updated Notification Subscriptions:');
            updatedNotifications.forEach(n => {
                console.log(`   Email: ${n.email}`);
                console.log(`   Item: ${n.itemName} by ${n.brandName}`);
                console.log(`   Status: ${n.verificationStatus}`);
                console.log(`   Verified At: ${n.verifiedAt}`);
                if (n.verifialiaDiagnostics)
                    console.log(`   Diagnostics: ${n.verifialiaDiagnostics}`);
                console.log();
            });
            yield mongoose_1.default.disconnect();
            console.log('✅ Test completed successfully!');
        }
        catch (error) {
            console.error('❌ Error:', error);
            process.exit(1);
        }
    });
}
testVerification();
