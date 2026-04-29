import Cookies from "js-cookie";
import jwtDecode from "jwt-decode";

function UserData() {
  const refresh_token = Cookies.get("refresh_token");

  if (!refresh_token) {
    console.warn("Refresh token is missing");
    return null;
  }

  try {
    const decoded = jwtDecode(refresh_token);

    if (!decoded?.user_id) {
      console.error("User ID not found in token payload");
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("Failed to decode refresh token:", error);
    return null;
  }
}

export default UserData;
