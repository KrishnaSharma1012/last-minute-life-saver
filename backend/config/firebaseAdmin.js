const admin = require('firebase-admin');

// We wrap initialization in a try-catch to allow the server to start
// even if the user hasn't provided the service account JSON yet.
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('🔥 Firebase Admin initialized successfully.');
  } else {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not found in .env. Push notifications will not work.');
    // Initialize without credentials just so the object exists (will fail on use)
    admin.initializeApp();
  }
} catch (err) {
  console.error('❌ Failed to initialize Firebase Admin:', err.message);
}

module.exports = admin;
