import { useAuthStore } from "../store/auth";
import axios from "./axios";
import jwt_decode from "jwt-decode";
import Cookies from "js-cookie";
import Swal from "sweetalert2";

// Login function
export const login = async (email, password) => {
  try {
    const { data, status } = await axios.post(`user/token/`, {
      email,
      password,
    });

    if (status === 200) {
      console.log("Login successful. Setting auth tokens.");
      setAuthUser(data.access, data.refresh);
    }

    return { data, error: null };
    
    
  } catch (error) {
    console.error("Login failed:", error);
    return {
      data: null,
      error: error.response?.data?.detail || "Something went wrong",
    };
  }
};


// Register function
export const register = async (full_name, email, password, password2) => {
  try {
    const { data } = await axios.post(`user/register/`, {
      full_name,
      email,
      password,
      password2,
    });

    console.log("Registration successful. Logging in.");
    await login(email, password);
    return { data, error: null };
  } catch (error) {
    console.error("Registration failed:", error);
    return {
      data: null,
      error:
        `${error.response?.data?.full_name} - ${error.response?.data?.email}` ||
        "Something went wrong",
    };
  }
};

// Logout function
export const logout = () => {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  localStorage.removeItem("userId"); 
  useAuthStore.getState().setUser(null);
  console.log("User logged out.");
};

// Token refresh logic
export const getRefreshedToken = async () => {
  const refresh_token = Cookies.get("refresh_token");

  if (!refresh_token) {
    console.error("No refresh token found.");
    return null;
  }

  try {
    const response = await axios.post("user/token/refresh/", { refresh: refresh_token });
    if (response.data.access && response.data.refresh) {
      console.log("Token refreshed successfully.");
      setAuthUser(response.data.access, response.data.refresh);
      return response.data.access; // Return new token
    } else {
      console.warn("Refresh token failed.");
      return null;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
};


// Set authenticated user and cookies
export const setAuthUser = (access_token, refresh_token) => {
  Cookies.set("access_token", access_token, { expires: 1, sameSite: "Lax" });
  Cookies.set("refresh_token", refresh_token, { expires: 7, sameSite: "Lax" });
  console.log("Access token:", access_token);
  console.log("Refresh token:", refresh_token);

  try {
    console.log("Token being decoded:", access_token);
    const user = jwt_decode(access_token) ?? null;

    if (user) {
      console.log("Decoded user:", user);
      useAuthStore.getState().setUser(user);

      
      // Store userId in localStorage
      localStorage.setItem("userId", user.user_id);  // Assuming the payload contains `user_id`
      console.log("User ID stored in localStorage:", user.user_id);

      useAuthStore.getState().setUser(user);
    } else {
      console.error("Decoded token invalid.");
      useAuthStore.getState().setUser(null);
    }
  } catch (error) {
    console.error("Failed to decode token:", error);
    useAuthStore.getState().setUser(null);
  }

  useAuthStore.getState().setLoading(false);
};

// Handle expired token and refresh logic
export const setUser = async () => {
  const access_token = Cookies.get("access_token");
  const refresh_token = Cookies.get("refresh_token");

  if (!access_token && !refresh_token) {
    console.warn("Tokens are missing, user might be logged out.");
    return;
  }

  try {
    if (isAccessTokenExpired(access_token)) {
      console.log("Token expired, attempting to refresh...");
      const response = await getRefreshedToken();
      if (response?.access && response?.refresh) {
        console.log("Token refreshed successfully.");
        setAuthUser(response.access, response.refresh);
      } else {
        console.warn("Token refresh failed, staying logged in but requiring re-authentication.");
      }
    } else {
      console.log("Token is still valid.");
      setAuthUser(access_token, refresh_token);
    }
  } catch (error) {
    console.error("Error during token refresh:", error);
  }
};

// JWT token expiration check
export const isAccessTokenExpired = (access_token) => {
  try {
    if (!access_token) return true; // Treat as expired if missing
    const decodedToken = jwt_decode(access_token);
    const expired = decodedToken?.exp < Math.floor(Date.now() / 1000); 
    console.log("Token expiration status:", expired);
    return expired;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true; // If decoding fails, treat as expired
  }
};