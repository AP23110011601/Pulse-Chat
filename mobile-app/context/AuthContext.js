import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api";
import { connectSocket, disconnectSocket } from "../socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistSession = async (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.setItem("token", nextToken);
    await AsyncStorage.setItem("user", JSON.stringify(nextUser));
    connectSocket(nextToken);
  };

  const clearSession = async () => {
    disconnectSocket();
    setToken(null);
    setUser(null);
    await AsyncStorage.multiRemove(["token", "user"]);
  };

useEffect(() => {

  let mounted = true;
  console.log("CHECK AUTH START");

  const checkAuth = async () => {

    try {

      const storedToken = await AsyncStorage.getItem("token");

      if (!storedToken) {
        if(mounted) {
          setLoading(false);
        }
        return;
      }


      const response = await Promise.race([
        api.get("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        }),

        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Request timeout")),
            8000
          )
        )

      ]);


      if(mounted){

        setToken(storedToken);
        setUser(response.data.user);

        connectSocket(storedToken);

      }


    } catch(error){

      console.log(
        "AUTH CHECK ERROR:",
        error.message
      );


      await AsyncStorage.multiRemove([
        "token",
        "user"
      ]);


      if(mounted){

        setToken(null);
        setUser(null);

      }
console.log("SETTING LOADING FALSE");

    } finally {

      if(mounted){

        setLoading(false);

      }

    }

  };


  checkAuth();


  return ()=>{

    mounted=false;

  };


}, []);

  const register = useCallback(async (payload) => {

  console.log("REGISTER PAYLOAD:", payload);


  const { data } =
    await api.post(
      "/api/auth/register",
      payload
    );


  await persistSession(
    data.token,
    data.user
  );


  return data.user;


}, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    await persistSession(data.token, data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await api.post("/api/auth/logout");
      }
    } catch (_error) {
      // ignore network errors on logout
    }
    await clearSession();
  }, [token]);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
    AsyncStorage.setItem("user", JSON.stringify(nextUser));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user,
      register,
      login,
      logout,
      updateUser,
    }),
    [user, token, loading, register, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
