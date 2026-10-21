import firebaseConfig from '../../firebase-applet-config.json';

let _adminAuth: any = null;

export async function getAdminAuth() {
  if (!_adminAuth) {
    const { initializeApp, getApps } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');
    if (!getApps().length) {
      initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
    _adminAuth = getAuth();
  }
  return _adminAuth;
}
