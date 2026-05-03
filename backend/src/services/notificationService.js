// Firebase Admin SDK for push notifications
let admin = null;

try {
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL
  ) {
    const firebaseAdmin = require('firebase-admin');
    admin = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } else {
    console.warn('⚠️ Firebase credentials not configured. Push notifications disabled.');
  }
} catch (err) {
  console.error('Firebase init error:', err.message);
}

/**
 * Send a push notification via Firebase Cloud Messaging
 * @param {string} fcmToken - Device FCM token
 * @param {object} payload - { title, body, data }
 */
const sendPushNotification = async (fcmToken, payload) => {
  if (!admin || !fcmToken) return;

  try {
    const messaging = require('firebase-admin').messaging();
    await messaging.send({
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: { sound: 'default', clickAction: 'FLUTTER_NOTIFICATION_CLICK' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    });
  } catch (error) {
    // Don't crash the app if FCM fails
    if (error.code !== 'messaging/registration-token-not-registered') {
      console.error('FCM error:', error.message);
    }
  }
};

module.exports = { sendPushNotification };
