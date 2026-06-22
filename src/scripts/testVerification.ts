import mongoose from 'mongoose';
import Newsletter from '../models/Newsletter';
import Notification from '../models/Notification';
import { batchVerifyEmails } from '../services/verificationService';

async function testVerification() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/erlumedb';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    // Check stored emails
    const newsletters = await Newsletter.find({});
    const notifications = await Notification.find({});

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
    await batchVerifyEmails();

    console.log('\n✅ Batch verification completed\n');

    // Check updated status
    const updatedNewsletters = await Newsletter.find({});
    const updatedNotifications = await Notification.find({});

    console.log('📧 Updated Newsletter Subscriptions:');
    updatedNewsletters.forEach(n => {
      console.log(`   Email: ${n.email}`);
      console.log(`   Status: ${n.verificationStatus}`);
      console.log(`   Verified At: ${n.verifiedAt}`);
      if (n.verifialiaDiagnostics) console.log(`   Diagnostics: ${n.verifialiaDiagnostics}`);
      console.log();
    });

    console.log('🔔 Updated Notification Subscriptions:');
    updatedNotifications.forEach(n => {
      console.log(`   Email: ${n.email}`);
      console.log(`   Item: ${n.itemName} by ${n.brandName}`);
      console.log(`   Status: ${n.verificationStatus}`);
      console.log(`   Verified At: ${n.verifiedAt}`);
      if (n.verifialiaDiagnostics) console.log(`   Diagnostics: ${n.verifialiaDiagnostics}`);
      console.log();
    });

    await mongoose.disconnect();
    console.log('✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testVerification();
