import { getToken, onMessage } from 'firebase/messaging'
import { messaging, isDemoMode } from '../config/firebase'

export const requestFCMToken = async (userId) => {
  if (isDemoMode) {
    console.log('[FCM] Demo Mode active. Skipping FCM token request.');
    return null;
  }

  try {
    console.log('[FCM] Requesting notification permission...');
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('[FCM] Permission granted. Fetching token...');
      const currentToken = await getToken(messaging, {
        // NOTE: The user needs to add their VAPID key to .env as VITE_FIREBASE_VAPID_KEY
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'REPLACE_ME_TOMORROW'
      });

      if (currentToken) {
        console.log('[FCM] Token acquired. Sending to backend...');
        // We would send this token to the backend here
        // Example: await fetch('/api/auth/register-fcm-token', { method: 'POST', body: JSON.stringify({ token: currentToken }) })
        return currentToken;
      } else {
        console.log('[FCM] No registration token available. Request permission to generate one.');
      }
    } else {
      console.log('[FCM] Notification permission denied.');
    }
  } catch (err) {
    console.error('[FCM] An error occurred while retrieving token: ', err);
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (isDemoMode) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
