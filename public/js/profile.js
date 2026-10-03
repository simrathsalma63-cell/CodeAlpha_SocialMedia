const token = localStorage.getItem("token");
const currentUser = JSON.parse(localStorage.getItem("user") || "null");
const params = new URLSearchParams(location.search);
const username = params.get("username") || currentUser?.username;

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function showToast(message) {
  const box = document.getElementById("toast");
  box.innerHTML = `<div class="toast">${escapeHtml(message)}</div>`;
  setTimeout(() => box.innerHTML = "", 2500);
}

async function api(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

function formatDate(date) {
  return new Date(date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function setupNav() {
  const nav = document.getElementById("navLinks");
  nav.innerHTML = currentUser
    ? `<div class="nav-actions"><a class="nav-user" href="/profile.html?username=${encodeURIComponent(currentUser.username)}">@${escapeHtml(currentUser.username)}</a><button class="btn secondary small" onclick="logout()">Logout</button></div>`
    : `<div class="nav-actions"><a class="btn primary small" href="/login.html">Login</a></div>`;
}

function logout() {
  localStorage.clear();
  location.href = "/";
}

async function loadProfile() {
  if (!username) {
    location.href = "/login.html";
    return;
  }

  try {
    const profile = await api(`/api/users/${encodeURIComponent(username)}`);

    document.getElementById("profile").innerHTML = `
      <div class="profile-top">
        <div>
          <div class="avatar">${escapeHtml(profile.username[0].toUpperCase())}</div>
        </div>
        <div style="flex:1">
          <p class="profile-name">@${escapeHtml(profile.username)}</p>
          <p class="muted">${escapeHtml(profile.bio || "No bio yet.")}</p>
          <div class="stats">
            <div class="stat"><strong>${profile.post_count}</strong><span>Posts</span></div>
            <div class="stat"><strong>${profile.followers_count}</strong><span>Followers</span></div>
            <div class="stat"><strong>${profile.following_count}</strong><span>Following</span></div>
          </div>
        </div>
        ${currentUser && currentUser.username !== profile.username ? `
          <button class="btn ${profile.is_following ? "secondary" : "primary"}" onclick="followUser()">
            ${profile.is_following ? "Unfollow" : "Follow"}
          </button>` : ""}
      </div>
      ${currentUser && currentUser.username === profile.username ? `
        <form class="edit-form" id="editProfile">
          <label>Username<input id="editUsername" value="${escapeHtml(profile.username)}" maxlength="50"></label>
          <label>Bio<textarea id="editBio" maxlength="255">${escapeHtml(profile.bio || "")}</textarea></label>
          <button class="btn primary" type="submit">Save profile</button>
        </form>` : ""}
    `;

    document.getElementById("editProfile")?.addEventListener("submit", async event => {
      event.preventDefault();
      try {
        const updated = await api("/api/users/profile", {
          method: "PUT",
          body: JSON.stringify({
            username: document.getElementById("editUsername").value,
            bio: document.getElementById("editBio").value
          })
        });
        localStorage.setItem("user", JSON.stringify({ ...currentUser, username: updated.username }));
        showToast("Profile updated");
        setTimeout(() => location.href = `/profile.html?username=${encodeURIComponent(updated.username)}`, 700);
      } catch (error) {
        showToast(error.message);
      }
    });

    const posts = await api(`/api/users/${encodeURIComponent(username)}/posts`);
    document.getElementById("profilePosts").innerHTML = posts.length
      ? posts.map(post => `
        <article class="post card">
          <div class="date">${formatDate(post.created_at)}</div>
          <div class="post-content">${escapeHtml(post.content)}</div>
          <div class="post-actions">
            <span class="action">♥ ${post.like_count}</span>
            <span class="action">💬 ${post.comment_count}</span>
          </div>
        </article>`).join("")
      : `<div class="card post"><p class="muted">No posts yet.</p></div>`;
  } catch (error) {
    document.getElementById("profile").innerHTML = `<div class="post"><p>${escapeHtml(error.message)}</p></div>`;
  }
}

async function followUser() {
  try {
    const data = await api(`/api/follows/${encodeURIComponent(username)}`, { method: "POST" });
    showToast(data.message);
    loadProfile();
  } catch (error) {
    showToast(error.message);
  }
}

setupNav();
loadProfile();