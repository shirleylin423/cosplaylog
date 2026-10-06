const API_BASE_URL = (
  process.env.REACT_APP_API_URL || ""
).replace(/\/$/, "");


async function request(path, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      credentials: "include",

      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },

      ...options,
    }
  );


  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }


  if (!response.ok) {
    const message =
      data?.detail ||
      `Request failed: ${response.status}`;

    const error =
      new Error(message);

    error.status =
      response.status;

    throw error;
  }


  return data;
}


// ========================================
// Authentication
// ========================================

export async function getCurrentUser() {
  return request("/auth/me");
}


export async function login(
  email,
  password
) {
  return request(
    "/auth/login",
    {
      method: "POST",

      body: JSON.stringify({
        email,
        password,
      }),
    }
  );
}


export async function register(
  email,
  password
) {
  return request(
    "/auth/register",
    {
      method: "POST",

      body: JSON.stringify({
        email,
        password,
      }),
    }
  );
}


export async function logout() {
  return request(
    "/auth/logout",
    {
      method: "POST",
    }
  );
}


// ========================================
// Records
// ========================================

export async function getRecords() {
  return request(
    "/api/records"
  );
}


export async function createRecord(
  record
) {
  return request(
    "/api/records",
    {
      method: "POST",

      body: JSON.stringify(record),
    }
  );
}


export async function updateRecord(
  id,
  patch
) {
  return request(
    `/api/records/${id}`,
    {
      method: "PATCH",

      body: JSON.stringify(patch),
    }
  );
}


export async function deleteRecord(
  id
) {
  return request(
    `/api/records/${id}`,
    {
      method: "DELETE",
    }
  );
}
