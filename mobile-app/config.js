// SafeNet AI — Shared API Configuration
//
// Change API_BASE to point to your backend:
//   Android emulator  → http://10.0.2.2:8080/v1   (localhost tunnelled into the emulator)
//   iOS simulator     → http://localhost:8080/v1
//   Real device       → http://<your-machine-LAN-IP>:8080/v1  (e.g. http://192.168.1.5:8080/v1)
//   Production        → https://api.safenet.ai/v1

export const API_BASE = "http://192.168.0.102:8080/v1";

// Stable device identifier — in a real release, replace with
// expo-device serial or a UUID stored in SecureStore.
export const DEVICE_USER_ID = "mobile_user";
