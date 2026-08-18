/* ==========================================================================
   LEDGER — shared client-side logic.
   No backend: users and posts are persisted in localStorage so the whole
   flow (register -> login -> write -> dashboard) actually works end to end.
   ========================================================================== */

const DB_USERS = 'ledger_users';
const DB_POSTS = 'ledger_posts';
const DB_SESSION = 'ledger_session';

const Store = {
  users(){ return JSON.parse(localStorage.getItem(DB_USERS) || '[]'); },
  saveUsers(u){ localStorage.setItem(DB_USERS, JSON.stringify(u)); },

  posts(){ return JSON.parse(localStorage.getItem(DB_POSTS) || '[]'); },
  savePosts(p){ localStorage.setItem(DB_POSTS, JSON.stringify(p)); },

  session(){ return JSON.parse(localStorage.getItem(DB_SESSION) || 'null'); },
  setSession(email){ localStorage.setItem(DB_SESSION, JSON.stringify({ email, at: Date.now() })); },
  clearSession(){ localStorage.removeItem(DB_SESSION); },

  seedIfEmpty(){
    if(Store.posts().length === 0){
      const seed = [
        {
          id: cryptoId(),
          title: 'Why a ledger is the right shape for a blog',
          body: 'Most blogs bury the order posts were written in behind a busy grid. A ledger keeps the sequence honest \u2014 entry one, then two, then three \u2014 and lets the writing carry the page instead of a hero image.\n\nThis is the seed post. Register an account and write your own to replace it in the running order.',
          author: 'ledger',
          tag: 'meta',
          createdAt: Date.now() - 1000 * 60 * 60 * 26,
        },
        {
          id: cryptoId(),
          title: 'Setting up a local front-end environment',
          body: 'A minimal setup is enough to start: a code editor, a modern browser, and a way to serve static files locally so relative paths and fetch calls behave the way they will in production.\n\nNo build tools are required for a project like this one \u2014 plain HTML, CSS and JavaScript, opened straight in the browser.',
          author: 'ledger',
          tag: 'tooling',
          createdAt: Date.now() - 1000 * 60 * 60 * 50,
        },
      ];
      Store.savePosts(seed);
    }
  }
};

function cryptoId(){
  return 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function currentUser(){
  const s = Store.session();
  if(!s) return null;
  return Store.users().find(u => u.email === s.email) || null;
}

function requireAuth(redirectTo = 'login.html'){
  const u = currentUser();
  if(!u){ window.location.href = redirectTo; }
  return u;
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
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function excerpt(body, len = 140){
  const clean = body.replace(/\s+/g, ' ').trim();
  return clean.length > len ? clean.slice(0, len).trim() + '\u2026' : clean;
}

/* ------------------------------- nav / header ------------------------------- */

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
      window.location.href = 'index.html';
    });
    nav.appendChild(logout);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  Store.seedIfEmpty();
});
