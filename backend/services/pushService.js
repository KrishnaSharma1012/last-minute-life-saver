const cron = require('node-cron');
const admin = require('../config/firebaseAdmin');

// We simulate the database for the demo mode
const checkDeadlinesAndNotify = async () => {
  try {
    // In a fully built app, you would query Firestore here:
    // const snapshot = await admin.firestore().collection('tasks').where('status', 'in', ['pending', 'in-progress']).get();
    
    // For this implementation plan, we will just log that the cron job ran successfully.
    // When the real database is hooked up, this function will iterate through tasks
    // and use `admin.messaging().send(payload)` to dispatch to the user's saved FCM token.
    console.log('[PushService] Checked deadlines at', new Date().toISOString());
    
    /* Example Firebase Messaging code for tomorrow:
    const message = {
      notification: {
        title: 'Task Due Soon!',
        body: 'Finish Hackathon Video Presentation'
      },
      token: 'USER_FCM_TOKEN_HERE'
    };
    
    // Send a message to the device corresponding to the provided registration token.
    admin.messaging().send(message)
      .then((response) => {
        console.log('Successfully sent message:', response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
    */

  } catch (error) {
    console.error('[PushService] Error running background check:', error);
  }
};

// Start the cron job to run every minute
const startPushService = () => {
  console.log('⏰ Starting Push Service background cron job...');
  cron.schedule('* * * * *', checkDeadlinesAndNotify);
};

module.exports = { startPushService };
