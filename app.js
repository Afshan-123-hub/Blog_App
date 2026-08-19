/* ==========================================================================
   LEDGER — shared client-side logic with Backend API
   Now connected to Node.js + Express + MongoDB backend
   ========================================================================== */

const API_URL = 'http://localhost:5000/api';
const DB_SESSION = 'ledger_session';
const DB_TOKEN = 'ledger_token';

// ========== Store (localStorage for session only) ==========
const Store = {
  session(){ return JSON.parse(localStorage.getItem(DB_SESSION) || 'null'); },
  setSession(email){ localStorage.setItem(DB_SESSION, JSON.stringify({ email, at: Date.now() })); },
  clearSession(){ localStorage.removeItem(DB_SESSION); localStorage.removeItem(DB_TOKEN); },
  
  getToken(){ return localStorage.getItem(DB_TOKEN); },
  setToken(token){ localStorage.setItem(DB_TOKEN, token); },
  clearToken(){ localStorage.removeItem(DB_TOKEN); }
};

// ========== API Helper ==========
async function apiCall(endpoint, options = {}) {
  const token = Store.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  
  return data;
}

// ========== Auth APIs ==========
async function registerUser(name, email, password) {
  const data = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
  if (data.token) {
    Store.setToken(data.token);
  }
  return data;
}

async function loginUser(email, password) {
  const data = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (data.token) {
    Store.setToken(data.token);
  }
  return data;
}

async function getCurrentUser() {
  try {
    const data = await apiCall('/auth/me');
    return data.user;
  } catch {
    return null;
  }
}

// ========== Posts APIs ==========
async function createPost(title, body, tag) {
  const data = await apiCall('/posts', {
    method: 'POST',
    body: JSON.stringify({ title, body, tag })
  });
  return data.post;
}

async function getAllPosts() {
  const data = await apiCall('/posts');
  return data.posts || [];
}

async function getMyPosts() {
  const data = await apiCall('/posts/my/posts');
  return data.posts || [];
}

async function deletePost(postId) {
  await apiCall(`/posts/${postId}`, {
    method: 'DELETE'
  });
}

// ========== User Functions ==========
function currentUser(){
  const s = Store.session();
  if(!s) return null;
  return s;
}

async function requireAuth(redirectTo = 'login.html'){
  const user = currentUser();
  if(!user){
    window.location.href = redirectTo;
    return null;
  }
  try {
    const backendUser = await getCurrentUser();
    if(!backendUser){
      Store.clearSession();
      Store.clearToken();
      window.location.href = redirectTo;
      return null;
    }
    return { ...user, ...backendUser };
  } catch {
    Store.clearSession();
    Store.clearToken();
    window.location.href = redirectTo;
    return null;
  }
}

// ========== Utility Functions ==========
function cryptoId(){
  return 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function timeAgo(ts){
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if(mins < 1) return 'just now';
  if(mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if(hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if(days < 30) return days + 'd ago';
  const months = Math.floor(days / 30);
  return months + 'mo ago';
}

function escapeHtml(str){
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function excerpt(body, len = 140){
  if (!body) return '';
  const clean = body.replace(/\s+/g, ' ').trim();
  return clean.length > len ? clean.slice(0, len).trim() + '\u2026' : clean;
}

// ========== Navigation ==========
function renderNav(activePage){
  const nav = document.querySelector('[data-nav]');
  if(!nav) return;
  const user = currentUser();

  const links = [
    { href: 'index.html', label: 'Home', key: 'home' },
  ];

  if(user){
    links.push({ href: 'create-blog.html', label: 'Write', key: 'create' });
    links.push({ href: 'dashboard.html', label: 'Dashboard', key: 'dashboard' });
  } else {
    links.push({ href: 'login.html', label: 'Log in', key: 'login' });
    links.push({ href: 'register.html', label: 'Register', key: 'register' });
  }

  nav.innerHTML = links.map(l =>
    `<a href="${l.href}" class="${l.key === activePage ? 'active' : ''}">${l.label}</a>`
  ).join('');

  if(user){
    const logout = document.createElement('a');
    logout.href = '#';
    logout.textContent = 'Log out';
    logout.addEventListener('click', (e) => {
      e.preventDefault();
      Store.clearSession();
      Store.clearToken();
      window.location.href = 'index.html';
    });
    nav.appendChild(logout);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // No need to seed anymore - backend handles seed
});