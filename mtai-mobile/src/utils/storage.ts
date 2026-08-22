import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'mtai_token';
const USER_KEY = 'mtai_user';

export async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function removeToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

export async function saveUser(user: any) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<any | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearAuth() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}
