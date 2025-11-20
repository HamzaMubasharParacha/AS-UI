import { BASE_URL } from "../api/config";

// ✅ Get token from localStorage dynamically
function getToken() {
  return localStorage.getItem("accessToken");
}

// ✅ Centralized GET request function
export async function apiGet(endpoint) {
  let token = getToken();

  try {
    let response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error in apiGet:", error);
    throw error;
  }
}