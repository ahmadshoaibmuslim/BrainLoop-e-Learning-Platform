import axios from "axios";
import { getRefreshedToken, setAuthUser } from "./auth"; // Ensure these functions are defined properly
import { API_BASE_URL } from "./constants";
import Cookies from "js-cookie";
import jwt_decode from "jwt-decode";

// Function to check if the token is expired
const isAccessTokenExpired = (accessToken) => {
  try {
    const decodedToken = jwt_decode(accessToken);
    const currentTime = Date.now() / 1000; // Convert to seconds
    return decodedToken.exp < currentTime;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true; // If decoding fails, treat token as expired
  }
};

const useAxios = () => {
  const accessToken = Cookies.get("access_token");
  const refreshToken = Cookies.get("refresh_token");

  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  axiosInstance.interceptors.request.use(
    async (req) => {
      if (isAccessTokenExpired(accessToken)) {
        console.log("Access token expired, attempting to refresh...");

        try {
          const response = await getRefreshedToken(refreshToken);
          setAuthUser(response.access, response.refresh); // Update cookies and store
          req.headers.Authorization = `Bearer ${response.access}`; // Use new access token
        } catch (error) {
          console.error("Failed to refresh access token", error);
          // Optionally, handle logout here or redirect to login page
        }
      }

      return req;
    },
    (error) => {
      // Handle error in request
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export default useAxios;
