import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra || {};

function getApiUrl() {
  if (extra.apiUrl) {
    console.log("Using configured API URL:", extra.apiUrl);
    return extra.apiUrl.replace(/\/$/, "");
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost ||
    "";

  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      console.log("Using Expo host IP:", ip);
      return `http://${ip}:5000`;
    }
  }

  const fallback = extra.apiUrl || "http://10.87.211.72:5000";
  console.log("Using fallback API URL", fallback);
  return fallback.replace(/\/$/, "");
}


export const API_URL = getApiUrl();

console.log(
  "API URL:",
  API_URL
);