const token = localStorage.getItem("token");
const currentUser = JSON.parse(localStorage.getItem("user") || "null");

const navLinks = document.getElementById("navLinks");
const feedSection = document.getElementById("feedSection");
const welcomeSection = document.getElementById("welcomeSection");

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function showToast(message) {
  const box = document.getElementById("toast");
  if (!box) return;
  box.innerHTML = `<div class="toast">${escapeHtml(message)}</div>`;
  setTimeout(() => box.innerHTML = "", 2500);
}

function setupNav() {
  if (!navLinks) return;

  if (currentUser) {
    navLinks.innerHTML = `
      <div class="nav-actions">
        <a class="nav-user" href="/profile.html?username=${encodeURIComponent(currentUser.username)}">@${escapeHtml(currentUser.username)}</a>
        <button class="btn secondary small" onclick="logout()">Logout</button>
      </div>`;
  } else {
    navLinks.innerHTML = `
      <div class="nav-actions">
        <a class="btn secondary small" href="/login.html">Login</a>
        <a class="btn primary small" href="/register.html">Register</a>
      </div>`;
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  location.href = "/";
}

async function api(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

function formatDate(date) {
  return new Date(date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

async function loadFeed() {
  if (!feedSection) return;

  if (!token) {
    feedSection.classList.add("hidden");
    return;
  }

  welcomeSection?.classList.add("hidden");
  feedSection.classList.remove("hidden");

  try {
    const posts = await api("/api/posts");
    const feed = document.getElementById("feed");

    if (!posts.length) {
      feed.innerHTML = `<div class="card post"><p class="muted">No posts yet. Be the first to share something!</p></div>`;
      return;
    }

    feed.innerHTML = posts.map(post => `
      <article class="post card" data-post-id="${post.id}">
        <div class="post-top">
          <div>
            <a class="author" href="/profile.html?username=${encodeURIComponent(post.username)}">@${escapeHtml(post.username)}</a>
            <div class="date">${formatDate(post.created_at)}</div>
          </div>
          ${currentUser && currentUser.id === post.user_id ? `
            <button class="btn danger small" onclick="deletePost(${post.id})">Delete</button>` : ""}
        </div>
        <div class="post-content">${escapeHtml(post.content)}</div>
        <div class="post-actions">
          <button class="action ${post.liked ? "liked" : ""}" onclick="toggleLike(${post.id})">
            ${post.liked ? "♥" : "♡"} Like (${post.like_count})
          </button>
          <button class="action" onclick="toggleComments(${post.id})">💬 Comments (${post.comment_count})</button>
          ${currentUser && currentUser.id === post.user_id ? `
            <button class="action" onclick="editPost(${post.id}, '${encodeURIComponent(post.content)}')">✎ Edit</button>` : ""}
        </div>
        <div id="comments-${post.id}" class="comments">
          <div id="comment-list-${post.id}"></div>
          ${token ? `
          <form class="comment-form" onsubmit="addComment(event, ${post.id})">
            <input id="comment-input-${post.id}" placeholder="Write a comment..." maxlength="500" required>
            <button class="btn primary small">Send</button>
          </form>` : ""}
        </div>
      </article>
    `).join("");
  } catch (error) {
    showToast(error.message);
  }
}

async function toggleLike(postId) {
  try {
    await api(`/api/likes/${postId}`, { method: "POST" });
    loadFeed();
  } catch (error) {
    showToast(error.message);
  }
}

async function toggleComments(postId) {
  const box = document.getElementById(`comments-${postId}`);
  if (box.style.display === "block") {
    box.style.display = "none";
    return;
  }

  box.style.display = "block";

  try {
    const comments = await api(`/api/comments/post/${postId}`);
    const list = document.getElementById(`comment-list-${postId}`);

    list.innerHTML = comments.length
      ? comments.map(c => `
        <div class="comment">
          <div class="comment-content">
            <a class="comment-user" href="/profile.html?username=${encodeURIComponent(c.username)}">@${escapeHtml(c.username)}</a>
            <div class="comment-text">${escapeHtml(c.content)}</div>
          </div>
          ${currentUser && currentUser.id === c.user_id ? `<button class="action" onclick="deleteComment(${c.id}, ${postId})">Delete</button>` : ""}
        </div>`).join("")
      : `<p class="muted">No comments yet.</p>`;
  } catch (error) {
    showToast(error.message);
  }
}

async function addComment(event, postId) {
  event.preventDefault();
  const input = document.getElementById(`comment-input-${postId}`);

  try {
    await api(`/api/comments/post/${postId}`, {
      method: "POST",
      body: JSON.stringify({ content: input.value })
    });
    input.value = "";
    toggleComments(postId);
    toggleComments(postId);
  } catch (error) {
    showToast(error.message);
  }
}

async function deleteComment(commentId, postId) {
  if (!confirm("Delete this comment?")) return;
  try {
    await api(`/api/comments/${commentId}`, { method: "DELETE" });
    const box = document.getElementById(`comments-${postId}`);
    box.style.display = "none";
    toggleComments(postId);
  } catch (error) {
    showToast(error.message);
  }
}

async function deletePost(postId) {
  if (!confirm("Delete this post?")) return;
  try {
    await api(`/api/posts/${postId}`, { method: "DELETE" });
    loadFeed();
  } catch (error) {
    showToast(error.message);
  }
}

async function editPost(postId, encodedContent) {
  const content = prompt("Edit your post:", decodeURIComponent(encodedContent));
  if (content === null) return;

  try {
    await api(`/api/posts/${postId}`, {
      method: "PUT",
      body: JSON.stringify({ content })
    });
    loadFeed();
  } catch (error) {
    showToast(error.message);
  }
}

document.getElementById("postForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  const content = document.getElementById("postContent").value.trim();
  if (!content) return;

  try {
    await api("/api/posts", {
      method: "POST",
      body: JSON.stringify({ content })
    });
    document.getElementById("postContent").value = "";
    showToast("Post published");
    loadFeed();
  } catch (error) {
    showToast(error.message);
  }
});

setupNav();
loadFeed();