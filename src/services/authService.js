import { BACKEND_BASE_URL } from '../config/config';

export const loginUser = async (username, password) => {
  const response = await fetch(`${BACKEND_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      username: username,
      password: password,
      grant_type: "password"
    }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();
  localStorage.setItem("authToken", data.access_token);
  return data;
};