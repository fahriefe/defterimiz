import { Platform } from 'react-native';

/** Adres çubuğuna ?demo eklenince uygulama örnek verilerle, Firebase'e hiçbir şey yazmadan çalışır (portfolyo demosu). */
export const isDemo = Platform.OS === 'web' && typeof location !== 'undefined' && /[?&]demo(=|&|$)/.test(location.search);
