const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (d) => new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const hue = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const ICON = {
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  user: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  like: 'M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z',
  comment: 'M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z',
  share: 'M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z',
  search: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  moon: 'M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z',
  sun: 'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z',
  logout: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
  globe: 'M12 2a10 10 0 100 20 10 10 0 000-20zm-1 17.93A8 8 0 014 12c0-.62.08-1.22.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54A2 2 0 0016 16h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41a8 8 0 012.9 12.8z',
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  send: 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z',
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
};
const ico = (n, s = 24) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="currentColor"><path d="${ICON[n]}"/></svg>`;
const av = (name, cls = '') => `<span class="av ${cls}" style="background:hsl(${hue(name || '?')},45%,48%)">${esc(String(name || '?').charAt(0).toUpperCase())}</span>`;
let token = null;
let user = JSON.parse(localStorage.getItem('user') || 'null');
let page = 1, mode = 'all', authorId = null, view = 'list', current = null, registering = false;
let feed = {}, names = {}, writers = [];

function setTheme(t) { document.documentElement.dataset.theme = t; localStorage.setItem('theme', t); $('#themeBtn').innerHTML = ico(t === 'dark' ? 'sun' : 'moon', 20); }
const toggleTheme = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
$('#searchIc').innerHTML = ico('search', 18); $('#addBtn').innerHTML = ico('add', 22);
setTheme(localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

async function api(url, method = 'GET', body) {
  const r = await fetch('/api' + url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}
let nt;
function notify(text, err) {
  const m = $('#msg'); clearTimeout(nt);
  m.textContent = text; m.className = 'msg' + (err ? ' err' : ''); m.hidden = !text;
  if (text) nt = setTimeout(() => (m.hidden = true), 3500);
}
const run = (fn) => fn().catch((e) => notify(e.message, true));
function show(v) {
  notify(''); view = v;
  ['list', 'post', 'editor', 'auth'].forEach((x) => ($('#' + x).hidden = x !== v));
  renderChrome(); window.scrollTo(0, 0);
}

/* ---------- header, left menu, contacts ---------- */
function renderChrome() {
  const home = view === 'list' && mode === 'all', mine = view === 'list' && mode === 'mine', write = view === 'editor';
  $('#tabs').innerHTML =
    `<a class="tab ${home ? 'on' : ''}" onclick="goHome()" title="Home">${ico('home', 28)}</a>` +
    `<a class="tab ${mine ? 'on' : ''}" onclick="myPosts()" title="My posts">${ico('user', 28)}</a>` +
    `<a class="tab ${write ? 'on' : ''}" onclick="newPost()" title="Create post">${ico('add', 28)}</a>`;
  const me = $('#me');
  me.textContent = user ? user.name.charAt(0).toUpperCase() : '?';
  me.style.background = `hsl(${hue(user ? user.name : '?')},45%,48%)`;
  const lk = (on, fn, icon, color, label) => `<a class="lk ${on ? 'on' : ''}" onclick="${fn}"><span class="lic" style="color:${color}">${ico(icon, 28)}</span>${label}</a>`;
  $('#left').innerHTML =
    `<a class="lk" onclick="avatarClick()">${av(user ? user.name : '?')}<span>${user ? esc(user.name) : 'Log in or sign up'}</span></a>` +
    lk(home, 'goHome()', 'home', '#1877f2', 'Home') + lk(mine, 'myPosts()', 'user', '#f7b928', 'My posts') + lk(write, 'newPost()', 'add', '#45bd62', 'Create post') +
    (user ? lk(false, 'logout()', 'logout', '#8a8d91', 'Log out') : lk(view === 'auth', 'openAuth()', 'logout', '#8a8d91', 'Log in'));
  $('#right').innerHTML = writers.length
    ? `<h4>Contacts</h4>` + writers.map(([id]) => `<a class="ct" onclick="viewAuthor('${id}')">${av(names[id])}<i class="dot"></i>${esc(names[id])}</a>`).join('') : '';
}
const avatarClick = () => (user ? myPosts() : openAuth());
const goHome = () => { mode = 'all'; authorId = null; $('#search').value = ''; run(() => loadPosts(1)); };
function myPosts() {
  if (!user) return openAuth('Please log in to see your posts');
  mode = 'mine'; run(() => loadPosts(1));
}
function viewAuthor(id) { mode = 'author'; authorId = id; run(() => loadPosts(1)); }

/* ---------- post pieces ---------- */
const reactions = (x) => `<div class="rxrow"><span>${x.likeCount ? `<i class="thumbdot">${ico('like', 11)}</i>${x.likeCount}` : ''}</span>` +
  `<span class="cc" onclick="openOrFocus('${x._id}')">${x.commentCount ? x.commentCount + ' comment' + (x.commentCount === 1 ? '' : 's') : ''}</span></div>`;
const actions = (x) => `<div class="acts"><a class="${x.liked ? 'liked' : ''}" onclick="like('${x._id}')">${ico('like', 20)}Like</a>` +
  `<a onclick="openOrFocus('${x._id}')">${ico('comment', 20)}Comment</a><a onclick="share('${x._id}')">${ico('share', 20)}Share</a></div>`;
const header = (x, extra = '') => { const n = x.author?.name || 'Unknown'; return `<div class="ph">${av(n)}<div class="grow"><a class="nm" onclick="viewAuthor('${x.author?._id}')">${esc(n)}</a><div class="meta">${fmt(x.createdAt)}${x.updatedAt !== x.createdAt ? ' · Edited' : ''} · ${ico('globe', 12)}</div></div>${extra}</div>`; };
const openPostJs = (id) => `run(() => openPost('${id}'))`;
const postCard = (x) => `<div class="card post" id="p-${x._id}">${header(x)}
  <div class="ptext"><div class="pt" onclick="${openPostJs(x._id)}">${esc(x.title)}</div>
  <div class="pbody">${esc(x.content)}${x.content.length >= 220 ? `… <a class="more" onclick="${openPostJs(x._id)}">See more</a>` : ''}</div></div>
  ${reactions(x)}${actions(x)}</div>`;
const canEdit = (ownerId) => user && (user.role === 'admin' || user.id === ownerId);

/* ---------- feed ---------- */
async function loadPosts(p = 1) {
  page = p;
  const q = new URLSearchParams({ page: p, search: $('#search').value });
  if (mode === 'mine') q.set('author', user.id);
  if (mode === 'author') q.set('author', authorId);
  const d = await api('/posts?' + q);
  feed = {}; const w = {};
  d.posts.forEach((x) => { feed[x._id] = x; if (x.author) { names[x.author._id] = x.author.name; w[x.author._id] = (w[x.author._id] || 0) + 1; } });
  writers = Object.entries(w);
  show('list');
  const plain = mode === 'all' && p === 1 && !$('#search').value;
  $('#composer').innerHTML = mode === 'all' ? `<div class="card composer">${av(user ? user.name : '?')}<div class="fake" onclick="newPost()">${user ? `What's on your mind, ${esc(user.name.split(' ')[0])}?` : 'Log in to share a post'}</div></div>` : '';
  $('#stories').innerHTML = plain
    ? `<div class="stories"><div class="story mk" onclick="newPost()"><div class="mtop">${user ? av(user.name, 'xl') : ''}</div><div class="mbot"><span class="plus">${ico('add', 20)}</span>Create post</div></div>` +
      writers.slice(0, 6).map(([id]) => `<div class="story" style="background:linear-gradient(160deg,hsl(${hue(names[id])},55%,52%),hsl(${(hue(names[id]) + 40) % 360},55%,28%))" onclick="viewAuthor('${id}')">${av(names[id], 'ring')}<span class="sn">${esc(names[id])}</span></div>`).join('') + `</div>` : '';
  $('#authorHead').innerHTML = mode === 'author' || mode === 'mine'
    ? `<div class="card ahead">${av(mode === 'mine' ? user.name : names[authorId], 'xl')}<div class="grow"><h2>${esc(mode === 'mine' ? user.name : names[authorId] || 'Writer')}</h2><div class="meta">${d.total} post${d.total === 1 ? '' : 's'}</div></div>${mode === 'author' ? `<button class="btn grey" onclick="goHome()">Back to feed</button>` : ''}</div>` : '';
  $('#posts').innerHTML = d.posts.map(postCard).join('') || `<div class="card">${mode === 'mine' ? 'You have not posted anything yet.' : 'No posts found.'}</div>`;
  $('#pager').innerHTML = d.pages > 1
    ? Array.from({ length: d.pages }, (_, i) => `<button class="${i + 1 === d.page ? 'on' : ''}" onclick="run(() => loadPosts(${i + 1}))">${i + 1}</button>`).join('') : '';
  renderChrome();
}

/* ---------- single post ---------- */
async function openPost(id) {
  const [post, commentPage] = await Promise.all([api('/posts/' + id), api(`/posts/${id}/comments?page=1`)]);
  const comments = commentPage.comments;
  if (post.author) names[post.author._id] = post.author.name;
  post.commentCount = comments.length; current = post;
  show('post');
  $('#backLink').innerHTML = ico('back', 18) + ' Back to feed';
  renderArticle(); renderComments(comments);
  $('#commentForm').innerHTML = user
    ? `<div class="cwrite">${av(user.name, 'sm')}<div class="cbox"><textarea id="cText" rows="1" maxlength="1000" placeholder="Write a comment…" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();addComment()}"></textarea><button class="send" onclick="addComment()" title="Send">${ico('send', 22)}</button></div></div>`
    : `<div class="meta"><a onclick="openAuth()" style="color:var(--blue);font-weight:600">Log in</a>&nbsp;to write a comment.</div>`;
}
function renderArticle() {
  const x = current;
  const tools = canEdit(x.author?._id) ? `<button class="ibtn" title="Edit" onclick="editPost()">${ico('edit', 20)}</button><button class="ibtn" title="Delete" onclick="deletePost()">${ico('trash', 20)}</button>` : '';
  $('#article').innerHTML = `${header(x, tools)}<div class="ptext"><div class="pt big">${esc(x.title)}</div><div class="pbody">${esc(x.content)}</div></div>${reactions(x)}${actions(x)}`;
}
function renderComments(list) {
  if (current) { current.commentCount = list.length; if (view === 'post') renderArticle(); }
  $('#cHead').textContent = list.length ? `All comments (${list.length})` : 'Comments';
  $('#comments').innerHTML = list.map((c) => `
    <div class="cm">${av(c.author?.name, 'sm')}<div><div class="bubble"><b>${esc(c.author?.name || 'Unknown')}</b><span>${esc(c.text)}</span></div>
      <div class="cmeta"><span>${fmt(c.createdAt)}</span>${user && (user.role === 'admin' || user.id === c.author?._id || user.id === current.author?._id) ? `<a onclick="deleteComment('${c._id}')">Delete</a>` : ''}</div></div></div>`).join('') || '<div class="meta">No comments yet. Be the first to comment.</div>';
}
const reloadComments = async () => renderComments((await api(`/posts/${current._id}/comments?page=1`)).comments);
const addComment = () => run(async () => {
  await api(`/posts/${current._id}/comments`, 'POST', { text: $('#cText').value });
  $('#cText').value = ''; await reloadComments();
});
const deleteComment = (id) => confirm('Delete this comment?') && run(async () => { await api('/comments/' + id, 'DELETE'); await reloadComments(); });
function openOrFocus(id) { view === 'post' && current?._id === id ? ($('#cText') ? $('#cText').focus() : openAuth('Log in to comment')) : run(() => openPost(id)); }

/* ---------- like & share ---------- */
const like = (id) => run(async () => {
  if (!user) return openAuth('Log in to like posts');
  const r = await api(`/posts/${id}/like`, 'POST');
  const x = view === 'post' && current?._id === id ? current : feed[id];
  x.liked = r.liked; x.likeCount = r.likeCount;
  view === 'post' ? renderArticle() : ($('#p-' + id).outerHTML = postCard(x));
});
function share(id) {
  const url = location.origin + '/#post=' + id;
  (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => notify('Link copied to clipboard'), () => prompt('Copy this link:', url));
}

/* ---------- editor ---------- */
function newPost() {
  if (!user) return openAuth('Please log in to create a post');
  show('editor'); $('#editorTitle').textContent = 'Create post';
  $('#editorUser').innerHTML = `${av(user.name)}<div><span class="nm">${esc(user.name)}</span><div class="meta">${ico('globe', 12)} Public</div></div>`;
  $('#eContent').placeholder = `What's on your mind, ${user.name.split(' ')[0]}?`;
  $('#eId').value = ''; $('#eTitle').value = ''; $('#eContent').value = '';
}
function editPost() {
  newPost(); $('#editorTitle').textContent = 'Edit post';
  $('#eId').value = current._id; $('#eTitle').value = current.title; $('#eContent').value = current.content;
}
const savePost = () => run(async () => {
  const id = $('#eId').value;
  const saved = await api(id ? '/posts/' + id : '/posts', id ? 'PUT' : 'POST', { title: $('#eTitle').value, content: $('#eContent').value });
  await openPost(saved._id); notify(id ? 'Post updated' : 'Post published');
});
const deletePost = () => confirm('Delete this post and its comments?') && run(async () => { await api('/posts/' + current._id, 'DELETE'); mode = 'all'; await loadPosts(1); notify('Post deleted'); });

/* ---------- auth ---------- */
function openAuth(message) { show('auth'); if (message) notify(message, true); }
function toggleAuth() {
  registering = !registering;
  $('#authTitle').textContent = registering ? 'Create a new account' : 'Log in to Inkwell';
  $('#aName').hidden = !registering;
  $('#authBtn').textContent = registering ? 'Sign up' : 'Log in';
  $('#authSwitch').textContent = registering ? 'Already have an account?' : 'Create new account';
}
const submitAuth = () => run(async () => {
  const d = await api(registering ? '/auth/register' : '/auth/login', 'POST', { name: $('#aName').value, email: $('#aEmail').value, password: $('#aPass').value });
  user = d.user;
  localStorage.setItem('user', JSON.stringify(user));
  mode = 'all'; await loadPosts(1);
});
function logout() { run(async () => { await api('/auth/logout', 'POST'); token = null; user = null; localStorage.removeItem('user'); mode = 'all'; await loadPosts(1); }); }

renderChrome();
const hash = location.hash.match(/^#post=([0-9a-f]{24})$/);
run(() => (hash ? openPost(hash[1]) : loadPosts(1)));
