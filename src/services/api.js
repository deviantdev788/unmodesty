const API_URL = import.meta.env.VITE_API_URL;

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("unmodesty_token");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body && !(options.body instanceof FormData) && { "Content-Type": "application/json" }),      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationErrors = data.errors
      ? Object.values(data.errors).flat().join(" ")
      : null;

    throw new Error(validationErrors || data.message || "Request failed.");
  }

  return data;
}

export async function registerUser(userData) {
  const data = await request("/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });

  localStorage.setItem("unmodesty_token", data.token);

  return data;
}

export async function loginUser(credentials) {
  const data = await request("/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  localStorage.setItem("unmodesty_token", data.token);

  return data;
}

export async function logoutUser() {
  try {
    return await request("/logout", {
      method: "POST",
    });
  } finally {
    localStorage.removeItem("unmodesty_token");
  }
}

export async function getCurrentUser() {
  return request("/user");
}

export async function updateProfile(profileData) {
  return request("/profile", {
    method: "PATCH",
    body: JSON.stringify(profileData),
  });
}

export async function uploadProfilePicture(file) {
  const formData = new FormData();
  formData.append("image", file);

  return request("/profile/picture", {
    method: "POST",
    body: formData,
  });
}

export async function deleteProfilePicture() {
  return request("/profile/picture", {
    method: "DELETE",
  });
}