/**
 * Firebase Configuration
 *
 * 설정 방법:
 * 1. https://console.firebase.google.com/ 에서 프로젝트 생성
 * 2. Firestore Database 및 Storage 활성화
 * 3. 프로젝트 설정 > 앱 추가 > 웹 앱에서 설정값 복사
 * 4. 프로젝트 루트에 .env 파일 생성 후 아래 값 입력:
 *
 *    VITE_FIREBASE_API_KEY=...
 *    VITE_FIREBASE_AUTH_DOMAIN=...
 *    VITE_FIREBASE_PROJECT_ID=...
 *    VITE_FIREBASE_STORAGE_BUCKET=...
 *    VITE_FIREBASE_MESSAGING_SENDER_ID=...
 *    VITE_FIREBASE_APP_ID=...
 *
 * 5. 터미널에서: npm install firebase
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

let _db: Firestore | undefined;
let _storage: FirebaseStorage | undefined;

export const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;

if (isFirebaseConfigured) {
  const app: FirebaseApp = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
  _db = getFirestore(app);
  _storage = getStorage(app);
}

export const db = _db;
export const storage = _storage;
