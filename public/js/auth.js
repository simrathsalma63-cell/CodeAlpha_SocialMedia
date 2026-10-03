async function submitAuth(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

const loginForm = document.getElementById("loginForm");
loginForm?.addEventListener("submit", async event => {
  event.preventDefault();
  const message = document.getElementById("message");
  message.textContent = "";

  try {
    const data = await submitAuth("/api/auth/login", {
      email: document.getElementById("email").value,
      password: document.getElementById("password").value
    });

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    location.href = "/";
  } catch (error) {
    message.textContent = error.message;
  }
});

const registerForm = document.getElementById("registerForm");
registerForm?.addEventListener("submit", async event => {
  event.preventDefault();
  const message = document.getElementById("message");
  message.textContent = "";

  try {
    const data = await submitAuth("/api/auth/register", {
      username: document.getElementById("username").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
      bio: document.getElementById("bio").value
    });

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    location.href = "/";
  } catch (error) {
    message.textContent = error.message;
  }
});