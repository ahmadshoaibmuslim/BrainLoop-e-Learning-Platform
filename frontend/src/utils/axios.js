import axios from "axios";
import { API_BASE_URL } from "./constants";
import Cookies from "js-cookie";

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add Authorization header
apiInstance.interceptors.request.use((config) => {
  const access_token = Cookies.get("access_token");
  if (access_token) {
    config.headers.Authorization = `Bearer ${access_token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default apiInstance;
