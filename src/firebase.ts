import { Platform } from 'react-native';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FA from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './firebaseConfig';

const fresh = getApps().length === 0;
const app = fresh ? initializeApp(firebaseConfig) : getApp();

export const auth = !fresh
  ? FA.getAuth(app)
  : Platform.OS === 'web'
    ? FA.initializeAuth(app, { persistence: [FA.indexedDBLocalPersistence, FA.browserLocalPersistence, FA.inMemoryPersistence] })
    : FA.initializeAuth(app, { persistence: (FA as any).getReactNativePersistence(AsyncStorage) });
// Bazı telefon tarayıcılarında / ana ekran uygulamalarında varsayılan bağlantı takılıyor; otomatik uzun-yoklama (long polling) yedeği açık.
export const db = fresh ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true }) : getFirestore(app);
