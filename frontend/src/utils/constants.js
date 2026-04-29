import UserData from "../views/plugin/UserData";

export const API_BASE_URL = "http://127.0.0.1:8000/api/v1/";
const userData = UserData();

export const userId = userData?.user_id || 1; // Default fallback
console.log("Resolved User ID:", UserData);

export const PAYPAL_CLIENT_ID = "test";
console.log("UserData:", UserData);

export const teacherId = UserData()?.teacher_id;
