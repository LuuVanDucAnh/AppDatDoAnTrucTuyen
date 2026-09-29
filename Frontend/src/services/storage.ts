import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'datdoan.accessToken';
const REFRESH_TOKEN_KEY = 'datdoan.refreshToken';

export interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export async function loadTokens(): Promise<StoredTokens> {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      AsyncStorage.getItem(ACCESS_TOKEN_KEY),
      AsyncStorage.getItem(REFRESH_TOKEN_KEY),
    ]);
    return { accessToken, refreshToken };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

export async function saveTokens(accessToken: string, refreshToken?: string | null) {
  try {
    const writes = [AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken)];
    if (refreshToken) writes.push(AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken));
    await Promise.all(writes);
  } catch {
    // Không lưu được (chế độ riêng tư, storage bị chặn...) — vẫn dùng token trong RAM.
  }
}

export async function clearTokens() {
  try {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  } catch {
    // bỏ qua
  }
}
