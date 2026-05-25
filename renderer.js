// ES module import — Vite bundles this from node_modules/@supabase/supabase-js
import { createClient } from '@supabase/supabase-js';
import Chart from 'chart.js/auto';
import notificationSoundSrc from './assets/notification.wav';

const notifSound = new Audio(notificationSoundSrc);
notifSound.volume = 0.6;

// Optional Electron APIs (only available in Electron context)
let ipcRenderer = null;
let shell = null;
try {
  if (typeof require !== 'undefined') {
    const electron = require('electron');
    ipcRenderer = electron.ipcRenderer;
    shell = electron.shell;
  }
} catch (e) {
  // Running in browser — Electron not available
}

// ==========================================
// 🔴 REQUIRED: SUPABASE CONFIGURATION
// ==========================================
const supabaseUrl = 'https://aoolkdxiydrhezdzifnn.supabase.co';
const supabaseKey = 'sb_publishable_3q_YR7yBddZXmaSZOyOJdA_QjpXssTs';

let supabase = null;
try {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  });
} catch (err) {
  console.error('Failed to initialize Supabase:', err);
}

// Fallback in-memory data if Supabase is not configured (for UI demonstration)
let mockTasks = [
  { id: '1', name: 'Design Landing Page', assignee: 'Alice', stake_holder: 'John Doe', company: 'Acme Corp', working_link: 'https://figma.com/123', status: 'In Progress', priority: 'High', description: 'Create a responsive landing page for the new product launch.' },
  { id: '2', name: 'Setup Electron Architecture', assignee: 'Bob', stake_holder: 'Jane Smith', company: 'Internal Team', working_link: 'https://github.com', status: 'Done', priority: 'Medium', description: 'Initialize the Electron project with main and renderer processes.' },
  { id: '3', name: 'Review Q3 Budget', assignee: 'Charlie', stake_holder: 'Boss', company: 'Finance Dept', working_link: 'https://docs.google.com', status: 'To Do', priority: 'Urgent', description: 'Prepare the financial report for the upcoming board meeting.' }
];
let teamMembers = [];

// DOM Elements
const appContainer = document.getElementById('appContainer');
const loginScreen = document.getElementById('loginScreen');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const signOutBtn = document.getElementById('signOutBtn');

const taskTableBody = document.getElementById('taskTableBody');
const loadingIndicator = document.getElementById('loadingIndicator');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');

const detailModal = document.getElementById('detailModal');
const closeDetailBtn = document.getElementById('closeDetailBtn');
const detailTaskName = document.getElementById('detailTaskName');
const detailAssignee = document.getElementById('detailAssignee');
const detailPriority = document.getElementById('detailPriority');
const detailStatus = document.getElementById('detailStatus');
const detailCompany = document.getElementById('detailCompany');
const detailStakeholder = document.getElementById('detailStakeholder');
const detailLink = document.getElementById('detailLink');
const detailCreatedAt = document.getElementById('detailCreatedAt');
const detailDescription = document.getElementById('detailDescription');


const profilePage = document.getElementById('profilePage');
const backToTasks = document.getElementById('backToTasks');
const profileForm = document.getElementById('profileForm');
const fullNameInput = document.getElementById('fullName');
const displayEmail = document.getElementById('displayEmail');
const profileAvatarLarge = document.getElementById('profileAvatarLarge');
const profileEmailText = document.getElementById('profileEmail');


const notifBtn = document.getElementById('notifBtn');
const notifBadge = document.getElementById('notifBadge');
const notifPanel = document.getElementById('notifPanel');
const notifList = document.getElementById('notifList');
const closeNotif = document.getElementById('closeNotif');
const loadingScreen = document.getElementById('loadingScreen');
const floatingNav = document.getElementById('floatingNav');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.app-page');

const addNoteBtn = document.getElementById('addNoteBtn');
const notesGrid = document.getElementById('notesGrid');
const noteEditorPage = document.getElementById('noteEditorPage');
const closeEditorBtn = document.getElementById('closeEditorBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const saveStatus = document.getElementById('saveStatus');
const toolbarBtns = document.querySelectorAll('.toolbar-btn');

const notesPanelGrid = document.getElementById('notesPanelGrid');
const notesPanelListView = document.getElementById('notesPanelListView');
const notesPanelEditorView = document.getElementById('notesPanelEditorView');
const notesPanelAddBtn = document.getElementById('notesPanelAddBtn');
const closeNotesPanelBtn = document.getElementById('closeNotesPanelBtn');
const notesPanelBackBtn = document.getElementById('notesPanelBackBtn');
const notesPanelDeleteBtn = document.getElementById('notesPanelDeleteBtn');
const notesPanelTitle = document.getElementById('notesPanelTitle');
const notesPanelContent = document.getElementById('notesPanelContent');
const notesPanelSaveStatus = document.getElementById('notesPanelSaveStatus');



// ── Dark Mode ─────────────────────────────────────────
const darkModeBtn = document.getElementById('darkModeBtn');

function updateDarkModeIcon(isDark) {
  const icon = document.getElementById('darkModeIcon');
  if (!icon) return;
  icon.innerHTML = isDark
    ? `<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>`
    : `<path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>`;
}

function setDarkMode(enabled) {
  document.documentElement.classList.toggle('dark', enabled);
  localStorage.setItem('darkMode', enabled ? 'true' : 'false');
  updateDarkModeIcon(enabled);
  // Re-render charts with correct colors if on statistics page
  if (!document.getElementById('statisticsPage')?.classList.contains('hidden')) {
    fetchStatistics();
  }
}

// Initialise from saved preference
const _savedDark = localStorage.getItem('darkMode') === 'true';
if (_savedDark) { document.documentElement.classList.add('dark'); updateDarkModeIcon(true); }

if (darkModeBtn) darkModeBtn.addEventListener('click', () => {
  setDarkMode(!document.documentElement.classList.contains('dark'));
});
// ─────────────────────────────────────────────────────

let notifications = [];
let presenceChannel = null;
let dragSrcRow = null;
const positionUpdateIds = new Set();
let tasksChannel = null;
let activityChannel = null;
let currentUserInfo = null;
let pendingActivityInfo = null;
let pendingActivityTimer = null;
let isDragging = false;
let isReordering = false;
let appInitialized = false;
let tasksLoaded = false;
let allTasks = [];
let currentFilter = 'all';
let selectedDateStr = new Date().toDateString();

// Mention System Variables
const mentionSuggestions = document.getElementById('mentionSuggestions');
let selectedMentionIndex = 0;
let filteredMentions = [];
let currentMentionElement = null;
let mentionRange = null;



// Auth Logic
async function checkSession() {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized');
      // Hide loading and show login UI
      if (loadingScreen) loadingScreen.classList.add('hidden');
      showLogin();
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();
    if (loadingScreen) loadingScreen.classList.add('hidden');
    if (session || user) {
      console.log('Session or User found, showing app');
      await showApp();
      fetchTasks();
    } else {
      console.log('No session found, showing login');
      showLogin();
    }
  } catch (err) {
    console.error('Error during session check:', err);
    if (loadingScreen) loadingScreen.classList.add('hidden');
    showLogin();
  }

  // Setup auth state listener
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔔 Auth Event:', event);
    if (session) console.log('👤 Current User:', session.user.email);
    
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
      if (session) {
        showApp().then(() => fetchTasks());
      }
    } else if (event === 'SIGNED_OUT') {
      console.warn('⚠️ Session lost or signed out');
      appInitialized = false;
      tasksLoaded = false;
      showLogin();
    }
  });
}

async function showApp() {
  if (appInitialized) return;
  appInitialized = true;
  loginScreen.classList.add('hidden');
  appContainer.classList.remove('hidden');
  await updateUserProfileUI();  // await so currentUserInfo is set before fetchActivityLog
  await fetchUsers();
  setupPresence();
  setupRealtime();
  fetchActivityLog();
}

async function updateUserProfileUI() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const name = user.user_metadata?.full_name || user.email.split('@')[0];
    const initial = name.charAt(0).toUpperCase();
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

    if (profileAvatarLarge) {
      if (avatarUrl) {
        profileAvatarLarge.innerHTML = `<img src="${avatarUrl}" alt="${name}">`;
      } else {
        profileAvatarLarge.textContent = initial;
      }
    }
    if (profileEmailText) profileEmailText.textContent = user.email;
    if (displayEmail) displayEmail.value = user.email;
    if (fullNameInput) fullNameInput.value = user.user_metadata?.full_name || '';

    // Cache current user info for notification attribution
    currentUserInfo = { id: user.id, name, avatar: avatarUrl };

    // Upsert to profiles table so others can see this user as an assignee
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: name,
      email: user.email,
      avatar_url: avatarUrl,
      updated_at: new Date()
    });

    // Update presence with new name/avatar
    setupPresence();
  }
}

const EXCLUDED_USERS = ['armadevdesign@gmail.com', 'armaproduct@gmail.com'];

async function fetchUsers() {
  const { data, error } = await supabase.from('profiles').select('*').order('full_name');
  if (!error && data) {
    console.log('profiles raw:', data.map(u => ({ id: u.id, full_name: u.full_name, email: u.email })));
    teamMembers = data.filter(u => {
      const name = (u.full_name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return !EXCLUDED_USERS.some(ex => name.includes(ex) || email.includes(ex));
    });
    updateAssigneeDropdowns();
    renderSidebarAssignees();
  }
}

function updateAssigneeDropdowns() {
  const createAssignee = document.getElementById('assignee');
  const detailAssignee = document.getElementById('detailAssignee');
  
  const options = teamMembers.map(u => 
    `<option value="${u.full_name}">${u.full_name}</option>`
  ).join('');

  if (createAssignee) createAssignee.innerHTML = options;
  if (detailAssignee) detailAssignee.innerHTML = options;
}

function showLogin() {
  appContainer.classList.add('hidden');
  loginScreen.classList.remove('hidden');
}

// Handle Google Sign In Click
googleSignInBtn.addEventListener('click', async () => {
  if (ipcRenderer && shell) {
    // Electron environment: use local auth callback server
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:34567/auth/callback',
        skipBrowserRedirect: true // Let us handle opening the URL
      }
    });

    if (error) {
      console.error('Login error:', error.message);
      alert('Error logging in');
      return;
    }

    if (data?.url) {
      shell.openExternal(data.url); // Open in user's default browser
    }
  } else {
    // Web Browser environment: use standard redirect
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });

    if (error) {
      console.error('Login error:', error.message);
      alert('Error logging in');
    }
  }
});

// Listen for deep link callback from main process (Electron only)
if (ipcRenderer) {
  ipcRenderer.on('oauth-callback', async (event, url) => {
    console.log('Received auth callback URL');
    try {
      const urlObj = new URL(url);
      const hash = urlObj.hash;
      const searchParams = new URLSearchParams(urlObj.search);
      
      let result;
      if (searchParams.has('code')) {
        const code = searchParams.get('code');
        result = await supabase.auth.exchangeCodeForSession(code);
      } else if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        
        if (access_token && refresh_token) {
          result = await supabase.auth.setSession({ access_token, refresh_token });
        }
      }

      if (result?.error) {
        throw result.error;
      }

      if (result?.data?.session) {
        console.log('Session established successfully');
        showApp();
        fetchTasks();
      }
    } catch (err) {
      console.error('Error handling oauth callback:', err.message);
      alert('Authentication failed: ' + err.message);
    }
  });
}

// Handle Sign Out Click
signOutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// Task Logic
async function fetchTasks() {
  if (tasksLoaded) return;
  tasksLoaded = true;
  loadingIndicator.style.display = 'block';
  taskTableBody.innerHTML = '';

  let tasks = [];

  const { data, error } = await supabase.from('tasks').select('*').is('deleted_at', null).is('completed_at', null).order('position', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching tasks:', error);
    // Silent fail to mock data if table not available
    tasks = mockTasks;
  } else {
    tasks = data;
  }

  allTasks = tasks;
  loadingIndicator.style.display = 'none';
  renderTasks();
  updateSidebarCounts();
}

// Helper to create a single task card
function createTaskRow(task) {
  const priority = task.priority || 'Medium';
  const linkDomain = task.working_link ? (() => { try { return new URL(task.working_link).hostname; } catch(e) { return ''; } })() : '';
  const card = document.createElement('div');
  card.className = 'task-card notion-row';
  card.setAttribute('data-id', task.id);
  card.setAttribute('draggable', 'true');

  card.innerHTML = `
    <div class="task-card-check">
      <button class="task-check-circle" data-id="${task.id}" title="Mark as complete">
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </button>
    </div>
    <div class="task-card-name" data-id="${task.id}">${task.name}</div>
    <div class="task-card-meta">${[
      getAssigneeAvatarHTML(task.assignee || '—'),
      `<span class="priority-badge priority-${priority.toLowerCase()} priority-plain"><lottie-player src="${getPriorityLottieUrl(priority)}" background="transparent" speed="1" style="width:18px;height:18px;flex-shrink:0;" loop autoplay></lottie-player>${priority}</span>`,
      task.working_link ? `<a href="${task.working_link}" target="_blank" class="task-card-link" onclick="event.stopPropagation()">${linkDomain ? `<img src="https://www.google.com/s2/favicons?domain=${linkDomain}&sz=32" width="16" height="16" style="border-radius:2px;flex-shrink:0;" alt="" onerror="this.style.display='none'">` : ''}Link</a>` : null,
    ].filter(Boolean).join('<span class="meta-divider"></span>')}</div>
    <div class="task-card-drag">
      <span class="drag-handle">⋮⋮</span>
    </div>
    <div class="task-card-actions">
      <div class="actions-wrapper">
        <button class="btn-actions" data-id="${task.id}" title="Actions">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
        </button>
        <div class="actions-dropdown hidden" id="dropdown-${task.id}">
          <ul class="dropdown-list">
            <li>
              <button class="dropdown-item view-detail" data-id="${task.id}">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                View Details
              </button>
            </li>
            <li>
              <button class="dropdown-item dropdown-mark-completed" data-id="${task.id}">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Mark as Completed
              </button>
            </li>
            <li class="dropdown-divider"></li>
            <li>
              <button class="dropdown-item delete-task" data-id="${task.id}">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                Delete
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `;

  card.addEventListener('click', (e) => {
    if (e.target.closest('.status-select') || e.target.closest('.task-card-link') ||
        e.target.closest('.actions-wrapper') || e.target.closest('.task-check-circle')) return;
    openDetailModal(task);
  });

  card.querySelector('.task-check-circle').addEventListener('click', (e) => {
    e.stopPropagation();
    handleMarkCompleted(e);
  });
  card.querySelector('.btn-actions').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleActionsMenu(task.id);
  });
  card.querySelector('.view-detail').addEventListener('click', (e) => {
    e.stopPropagation();
    openDetailModal(task);
    closeAllDropdowns();
  });
  card.querySelector('.dropdown-mark-completed').addEventListener('click', (e) => {
    e.stopPropagation();
    handleMarkCompleted(e);
    closeAllDropdowns();
  });
  card.querySelector('.delete-task').addEventListener('click', (e) => {
    e.stopPropagation();
    handleDeleteTask(e);
    closeAllDropdowns();
  });

  setupRowDrag(card);

  return card;
}

async function saveTaskOrder() {
  isReordering = true;
  const rows = taskTableBody.querySelectorAll('.notion-row');

  const updates = Array.from(rows).map((row, index) => {
    const id = row.getAttribute('data-id');
    positionUpdateIds.add(id);
    return supabase.from('tasks').update({ position: index + 1 }).eq('id', id);
  });

  await Promise.all(updates);

  // Clear both guards after 3s to absorb any slow realtime callbacks or DB triggers
  setTimeout(() => { positionUpdateIds.clear(); isReordering = false; }, 3000);
}

function setupRowDrag(card) {
  card.addEventListener('dragstart', (e) => {
    if (currentFilter !== 'all') { e.preventDefault(); return; }
    dragSrcRow = card;
    isDragging = true;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => card.classList.add('row-dragging'), 0);
  });

  card.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!dragSrcRow || dragSrcRow === card) return;

    document.querySelectorAll('.notion-row').forEach(r =>
      r.classList.remove('drag-over-top', 'drag-over-bottom')
    );

    const rect = card.getBoundingClientRect();
    if (e.clientY < rect.top + rect.height / 2) {
      card.classList.add('drag-over-top');
    } else {
      card.classList.add('drag-over-bottom');
    }
  });

  card.addEventListener('dragleave', () => {
    card.classList.remove('drag-over-top', 'drag-over-bottom');
  });

  card.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!dragSrcRow || dragSrcRow === card) return;

    const insertBefore = card.classList.contains('drag-over-top');
    card.classList.remove('drag-over-top', 'drag-over-bottom');

    if (insertBefore) {
      taskTableBody.insertBefore(dragSrcRow, card);
    } else {
      card.after(dragSrcRow);
    }

    saveTaskOrder();
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('row-dragging');
    document.querySelectorAll('.notion-row').forEach(r =>
      r.classList.remove('drag-over-top', 'drag-over-bottom')
    );
    dragSrcRow = null;
    setTimeout(() => { isDragging = false; }, 500);
  });
}

function getTaskDate(task) {
  if (task.task_date) return new Date(task.task_date);
  return new Date(task.created_at || Date.now());
}

async function carryTasksToToday() {
  const todayISO = new Date().toISOString().split('T')[0];
  const tasksToCarry = allTasks.filter(t => getTaskDate(t).toDateString() === selectedDateStr);
  if (!tasksToCarry.length) return;

  const btn = document.getElementById('carryToTodayBtn');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }

  await Promise.all(tasksToCarry.map(t =>
    supabase.from('tasks').update({ task_date: todayISO }).eq('id', t.id)
  ));

  tasksToCarry.forEach(t => { t.task_date = todayISO; });
  selectedDateStr = new Date().toDateString();
  renderTasks();

  if (btn) { btn.disabled = false; btn.style.opacity = ''; }
}

function getTabDateLabel(date) {
  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
  if (date.toDateString() === todayStr) return 'Today';
  if (date.toDateString() === yesterdayStr) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function renderDateTabs() {
  const bar = document.getElementById('dateTabsBar');
  if (!bar) return;

  const todayStr = new Date().toDateString();
  const dateMap = {};
  allTasks.forEach(t => {
    const d = getTaskDate(t);
    const key = d.toDateString();
    if (!dateMap[key]) dateMap[key] = d;
  });
  if (!dateMap[todayStr]) dateMap[todayStr] = new Date();

  const sorted = Object.values(dateMap).sort((a, b) => {
    if (a.toDateString() === todayStr) return -1;
    if (b.toDateString() === todayStr) return 1;
    return b - a;
  });

  bar.innerHTML = '';
  sorted.forEach(date => {
    const key = date.toDateString();
    const tab = document.createElement('button');
    tab.className = 'date-tab' + (key === selectedDateStr ? ' active' : '');
    tab.textContent = getTabDateLabel(date);
    tab.addEventListener('click', () => {
      selectedDateStr = key;
      renderDateTabs();
      renderTasks();
    });
    bar.appendChild(tab);
  });
}

function renderTasks() {
  renderDateTabs();

  const filtered = currentFilter === 'all'
    ? allTasks
    : allTasks.filter(t => t.assignee === currentFilter);

  const dateTasks = filtered.filter(t => getTaskDate(t).toDateString() === selectedDateStr);

  taskTableBody.innerHTML = '';
  dateTasks.forEach(task => taskTableBody.appendChild(createTaskRow(task)));

  const carryBanner = document.getElementById('carryBanner');
  const carryBannerText = document.getElementById('carryBannerText');
  if (carryBanner && carryBannerText) {
    const isToday = selectedDateStr === new Date().toDateString();
    if (!isToday && dateTasks.length > 0) {
      carryBanner.style.display = 'flex';
      carryBannerText.textContent = `${dateTasks.length} task${dateTasks.length !== 1 ? 's' : ''} on this day`;
    } else {
      carryBanner.style.display = 'none';
    }
  }

  const titleEl = document.getElementById('taskMainTitle');
  if (titleEl) titleEl.textContent = currentFilter === 'all' ? 'All Tasks' : currentFilter;
}

function renderSidebarAssignees() {
  const container = document.getElementById('sidebarAssigneeList');
  if (!container) return;
  const bgMap = { A: '#1c64f2', S: '#7c3aed', R: '#059669', C: '#d97706' };
  container.innerHTML = '';
  teamMembers.forEach(member => {
    const initial = (member.full_name || '?').charAt(0).toUpperCase();
    const bg = bgMap[initial] || '#6b7280';
    const imgHtml = member.avatar_url
      ? `<img src="${member.avatar_url}" alt="${member.full_name}" onerror="this.style.display='none'">`
      : '';
    const btn = document.createElement('button');
    btn.className = 'sidebar-item';
    btn.setAttribute('data-filter', member.full_name);
    btn.innerHTML = `
      <div class="sidebar-avatar" style="background:${bg};">${initial}${imgHtml}</div>
      <span class="sidebar-item-name">${member.full_name}</span>
      <span class="sidebar-count" id="filterCount${member.id}"></span>
    `;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = member.full_name;
      renderTasks();
    });
    container.appendChild(btn);
  });
  updateSidebarCounts();
}

function updateSidebarCounts() {
  const el = document.getElementById('filterCountAll');
  if (el) el.textContent = allTasks.length || '';
  teamMembers.forEach(member => {
    const countEl = document.getElementById(`filterCount${member.id}`);
    if (countEl) {
      const n = allTasks.filter(t => t.assignee === member.full_name).length;
      countEl.textContent = n || '';
    }
  });
}

function setupRealtime() {
  if (!supabase) return;

  // Remove existing channels sebelum subscribe ulang
  if (tasksChannel) { supabase.removeChannel(tasksChannel); tasksChannel = null; }
  if (activityChannel) { supabase.removeChannel(activityChannel); activityChannel = null; }

  tasksChannel = supabase.channel('custom-all-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, (payload) => {
      const newTask = payload.new;
      allTasks.unshift(newTask);
      updateSidebarCounts();
      if (currentFilter === 'all' || newTask.assignee === currentFilter) {
        const card = createTaskRow(newTask);
        card.classList.add('row-enter');
        taskTableBody.prepend(card);
      }
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks' }, (payload) => {
      allTasks = allTasks.filter(t => t.id !== payload.old.id);
      updateSidebarCounts();
      const row = document.querySelector(`.notion-row[data-id="${payload.old.id}"]`);
      if (row) {
        row.classList.add('row-exit');
        setTimeout(() => row.remove(), 250);
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, (payload) => {
      const updatedTask = payload.new;
      if (positionUpdateIds.has(updatedTask.id)) return;
      const idx = allTasks.findIndex(t => t.id === updatedTask.id);
      if (idx !== -1) allTasks[idx] = updatedTask;
      updateSidebarCounts();
      const existingRow = document.querySelector(`.notion-row[data-id="${updatedTask.id}"]`);
      if (!existingRow) return;
      if (updatedTask.completed_at || updatedTask.deleted_at) {
        removeRowFromTable(updatedTask.id);
        return;
      }
      if (currentDetailTaskId === updatedTask.id) return;
      updateRowInPlace(existingRow, updatedTask);
    })
    .subscribe();

  activityChannel = supabase.channel('activity-log-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, (payload) => {
      if (isReordering) return;
      const type = payload.new.type;
      if (type !== 'insert' && type !== 'update') return;
      const msg = payload.new.message || '';
      // Only accept messages written by client code:
      // - update: must contain "→" (e.g. "updated "x" → Done" or "updated "x" priority → High")
      // - insert: must start with "created task" (e.g. "created task "x"")
      if (type === 'update' && !msg.includes('→')) return;
      if (type === 'insert' && !msg.startsWith('created task')) return;
      addNotification(msg, type, new Date(payload.new.created_at), payload.new.user_name, payload.new.user_avatar, payload.new.user_id);
    })
    .subscribe();
}

function updateRowInPlace(row, task) {
  const priority = task.priority || 'Medium';

  const nameEl = row.querySelector('.task-card-name');
  if (nameEl) nameEl.textContent = task.name;

  const assigneeEl = row.querySelector('.chip-assignee');
  if (assigneeEl) {
    const member = teamMembers.find(m => m.full_name === task.assignee);
    const initial = (task.assignee || '?').charAt(0).toUpperCase();
    const bgMap = { A: '#1c64f2', S: '#7c3aed', R: '#059669', C: '#d97706' };
    assigneeEl.style.background = bgMap[initial] || '#6b7280';
    assigneeEl.title = task.assignee || '';
    assigneeEl.innerHTML = `${initial}${member?.avatar_url ? `<img src="${member.avatar_url}" alt="${task.assignee}" onerror="this.style.display='none'">` : ''}`;
  }

  const priorityEl = row.querySelector('.priority-badge');
  if (priorityEl) {
    priorityEl.className = `priority-badge priority-${priority.toLowerCase()}`;
    priorityEl.innerHTML = `<lottie-player src="${getPriorityLottieUrl(priority)}" background="transparent" speed="1" style="width:18px;height:18px;flex-shrink:0;" loop autoplay></lottie-player>${priority}`;
  }

  row.classList.remove('row-updated');
  void row.offsetWidth;
  row.classList.add('row-updated');
  setTimeout(() => row.classList.remove('row-updated'), 700);
}

async function logActivity(message, type) {
  if (isDragging) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const name = user.user_metadata?.full_name || user.email.split('@')[0];
  const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

  // Cache user info so realtime callback can show avatar even without DB columns
  pendingActivityInfo = { id: user.id, name, avatar };
  if (pendingActivityTimer) clearTimeout(pendingActivityTimer);
  pendingActivityTimer = setTimeout(() => { pendingActivityInfo = null; pendingActivityTimer = null; }, 5000);

  // Try insert with user columns; fall back to basic insert if columns don't exist
  const { error } = await supabase.from('activity_log').insert({ message, type, user_id: user.id, user_name: name, user_avatar: avatar });
  if (error) {
    if (error.code === '42703') {
      // Columns don't exist yet — fall back and remind to run migration
      console.warn('logActivity: kolom user_id/user_name/user_avatar belum ada. Jalankan SQL migration di Supabase!');
      await supabase.from('activity_log').insert({ message, type });
    } else if (error.code === '42501' || error.message?.includes('row-level security')) {
      console.error('logActivity: akses ditolak RLS. Tambahkan INSERT policy di Supabase untuk tabel activity_log.');
    } else {
      console.error('logActivity error:', error.message);
    }
  }
}

async function fetchActivityLog() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  console.log('Fetching activity log since:', sevenDaysAgo.toISOString());
  
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .gte('created_at', sevenDaysAgo.toISOString())
    .in('type', ['insert', 'update'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching activity log:', error);
    return;
  }

  if (data) {
    notifications = data.map(item => {
      const userId = item.user_id || null;
      let userName = item.user_name || null;
      let userAvatar = item.user_avatar || null;

      // Fallback: if this is the current user but DB columns are missing
      if (!userName && currentUserInfo && userId === currentUserInfo.id) {
        userName = currentUserInfo.name;
        userAvatar = currentUserInfo.avatar;
      }
      // Fallback: look up by user_id in teamMembers profiles
      if (!userAvatar && userId) {
        const member = teamMembers.find(m => m.id === userId);
        if (member) { userName = userName || member.full_name; userAvatar = member.avatar_url || null; }
      }

      return {
        message: item.message,
        time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: item.type,
        userId,
        userName,
        userAvatar
      };
    }).filter(n => n.userName); // hide old entries with no user info

    updateNotifUI();
  }
}

function toggleActionsMenu(id) {
  const dropdown = document.getElementById(`dropdown-${id}`);
  const isHidden = dropdown.classList.contains('hidden');
  closeAllDropdowns();
  if (isHidden) dropdown.classList.remove('hidden');
}

function closeAllDropdowns() {
  document.querySelectorAll('.actions-dropdown').forEach(d => d.classList.add('hidden'));
}

// Close dropdowns on outside click
document.addEventListener('click', closeAllDropdowns);

function getStatusClass(status) {
  switch (status) {
    case 'To Do': return 'status-todo';
    case 'In Progress': return 'status-progress';
    case 'Review': return 'status-review';
    case 'Done': return 'status-done';
    default: return 'status-todo';
  }
}

function renderLinkCell(taskId, url) {
  if (!url) return `<button class="btn-link-add" data-id="${taskId}" title="Add link">+ Add</button>`;
  let favicon = '';
  try {
    const domain = new URL(url).hostname;
    favicon = `<img class="link-favicon" src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" alt="" onerror="this.style.display='none'">`;
  } catch (_) {}
  return `${favicon}<a href="${url}" target="_blank" class="notion-link">Open ↗</a><button class="btn-link-edit" data-id="${taskId}" data-link="${url}" title="Edit link">✎</button>`;
}

function getAssigneeAvatarHTML(name) {
  const member = teamMembers.find(m => m.full_name === name);
  const initial = (name || '?').charAt(0).toUpperCase();
  const bgMap = { A: '#1c64f2', S: '#7c3aed', R: '#059669', C: '#d97706' };
  const bg = bgMap[initial] || '#6b7280';
  const img = member?.avatar_url
    ? `<img src="${member.avatar_url}" alt="${name}" onerror="this.style.display='none'">`
    : '';
  return `<span class="chip-assignee card-assignee-avatar" style="background:${bg};" title="${name}">${initial}${img}</span>`;
}

function getPriorityLottieUrl(priority) {
  switch (priority) {
    case 'Low':    return 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f33f/lottie.json'; 
    case 'Medium': return 'https://fonts.gstatic.com/s/e/notoemoji/latest/26a1/lottie.json';  
    case 'High':   return 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/lottie.json'; 
    case 'Urgent': return 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f6a8/lottie.json'; 
    default:       return 'https://fonts.gstatic.com/s/e/notoemoji/latest/26a1/lottie.json';
  }
}

// Resize a card status <select> to fit its selected option text
function fitSelectWidth(sel) {
  const text = sel.options[sel.selectedIndex]?.text || '';
  const tmp = document.createElement('span');
  tmp.style.cssText = 'position:fixed;top:-9999px;font:500 0.78rem/1 Inter,system-ui,sans-serif;white-space:nowrap;visibility:hidden;pointer-events:none;';
  tmp.textContent = text;
  document.body.appendChild(tmp);
  sel.style.width = (tmp.offsetWidth + 22) + 'px';
  document.body.removeChild(tmp);
}

// Event Handlers
async function handleStatusChange(e) {
  if (isDragging) return;
  const id = e.target.getAttribute('data-id');
  const newStatus = e.target.value;
  
  const badge = e.target.parentElement;
  badge.className = `status-badge ${getStatusClass(newStatus)}`;
  fitSelectWidth(e.target);

  const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
  if (error) { console.error('Error updating status:', error); return; }
  const taskName = document.querySelector(`.task-card-name[data-id="${id}"]`)?.textContent || 'Task';
  logActivity(`updated "${taskName}" → ${newStatus}`, 'update');
}


async function handleMarkCompleted(e) {
  const id = e.target.closest('[data-id]').getAttribute('data-id');
  const { error } = await supabase.from('tasks').update({ completed_at: new Date().toISOString() }).eq('id', id);
  if (error) { console.error('Error marking task completed:', error); return; }
  removeRowFromTable(id);
}

async function handleDeleteTask(e) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  const id = e.target.closest('[data-id]').getAttribute('data-id');
  const { error } = await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) { console.error('Error deleting task:', error); return; }
  removeRowFromTable(id);
}

function removeRowFromTable(id) {
  const row = document.querySelector(`.notion-row[data-id="${id}"]`);
  if (!row) return;
  row.style.transition = 'opacity 0.25s';
  row.style.opacity = '0';
  setTimeout(() => row.remove(), 250);
}

async function handleLinkEdit(e) {
  const btn = e.currentTarget;
  const id = btn.getAttribute('data-id');
  const existingLink = btn.getAttribute('data-link') || '';
  const cell = btn.closest('td');

  // Replace cell content with an inline input
  cell.innerHTML = `
    <div class="inline-link-edit">
      <input type="url" class="inline-url-input" placeholder="https://..." value="${existingLink}">
      <button class="inline-save-btn" title="Save">✓</button>
      <button class="inline-cancel-btn" title="Cancel">✕</button>
    </div>
  `;

  const input = cell.querySelector('.inline-url-input');
  const saveBtn = cell.querySelector('.inline-save-btn');
  const cancelBtn = cell.querySelector('.inline-cancel-btn');
  input.focus();

  const restoreCell = (link) => {
    cell.innerHTML = renderLinkCell(id, link);
    const linkBtn = cell.querySelector('.btn-link-add, .btn-link-edit');
    if (linkBtn) linkBtn.addEventListener('click', (e) => { e.stopPropagation(); handleLinkEdit(e); });
  };

  const save = async () => {
    const newLink = input.value.trim();
    const { error } = await supabase.from('tasks').update({ working_link: newLink }).eq('id', id);
    if (error) { console.error('Error updating link:', error); restoreCell(existingLink); return; }
    restoreCell(newLink);
  };

  saveBtn.addEventListener('click', save);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') restoreCell(existingLink);
  });
  cancelBtn.addEventListener('click', () => restoreCell(existingLink));
}

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const assigneeName = document.getElementById('assignee').value;

  const newTask = {
    name: document.getElementById('taskName').value,
    assignee: assigneeName,
    stake_holder: document.getElementById('stakeHolder').value,
    company: document.getElementById('company').value,
    working_link: document.getElementById('workingLink').value,
    description: document.getElementById('taskDescription').value,
    priority: document.getElementById('priority').value,
    status: document.getElementById('status').value,
    position: 0
  };

  const { error } = await supabase.from('tasks').insert([newTask]);
  if (error) {
    console.error('Error adding task:', error.message, error.details);
    alert('Failed to add task: ' + error.message);
  } else {
    logActivity(`created task "${newTask.name}"`, 'insert');
  }

  closeModal();
  taskForm.reset();
});

// Modal Logic
function openModal() {
  taskModal.classList.remove('hidden');
  floatingNav.classList.add('nav-hidden');
}

function closeModal() {
  taskModal.classList.add('hidden');
  floatingNav.classList.remove('nav-hidden');
}

openModalBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
taskModal.addEventListener('click', (e) => {
  if (e.target === taskModal) closeModal();
});

// Detail Modal Logic
let currentDetailTaskId = null;

function initPanelResize() {
  const handle = document.getElementById('panelResizeHandle');
  const container = document.getElementById('detailModal');
  if (!handle || !container) return;

  let isResizing = false;
  let startX = 0;
  let startWidth = 0;
  const MIN_WIDTH = 280;
  const MAX_WIDTH = 720;

  handle.addEventListener('mousedown', e => {
    isResizing = true;
    startX = e.clientX;
    startWidth = container.offsetWidth;
    handle.classList.add('resizing');
    container.style.transition = 'none';
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!isResizing) return;
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + (startX - e.clientX)));
    container.style.width = newWidth + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    handle.classList.remove('resizing');
    container.style.transition = '';
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    localStorage.setItem('detailPanelWidth', container.offsetWidth);
  });
}

async function openDetailModal(task) {
  closeNotesSidePanel();
  currentDetailTaskId = task.id;
  detailTaskName.textContent = task.name;
  detailAssignee.value = task.assignee || 'Arma';
  detailPriority.value = task.priority || 'Medium';
  detailStatus.value = task.status || 'To Do';
  detailCompany.value = task.company || '';
  detailStakeholder.value = task.stake_holder || '';
  detailLink.value = task.working_link || '';

  const dateObj = task.created_at ? new Date(task.created_at) : new Date();
  detailCreatedAt.textContent = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  detailDescription.innerHTML = task.description || '';

  const savedWidth = parseInt(localStorage.getItem('detailPanelWidth'));
  if (savedWidth >= 280) detailModal.style.width = savedWidth + 'px';
  detailModal.classList.add('detail-panel-open');
}

function closeDetailModal() {
  detailModal.classList.remove('detail-panel-open');
  detailModal.style.width = '';
  currentDetailTaskId = null;
}

closeDetailBtn.addEventListener('click', closeDetailModal);

// Auto-save logic helper
async function updateTaskProperty(property, value) {
  if (!currentDetailTaskId) return;
  
  let updateData = { [property]: value };

  // Update Supabase
  const { error } = await supabase.from('tasks').update(updateData).eq('id', currentDetailTaskId);
  if (error) {
    console.error(`Error updating ${property}:`, error);
    return;
  }

  // Update the task card in the background without a full re-render
  const nameEl = document.querySelector(`.task-card-name[data-id="${currentDetailTaskId}"]`);
  if (nameEl) {
    const card = nameEl.closest('.task-card');
    if (!card) return;

    if (property === 'name') nameEl.textContent = value;
    if (property === 'assignee') {
      const chip = card.querySelector('.chip-assignee');
      if (chip) chip.textContent = value || '—';
      const task = allTasks.find(t => t.id === currentDetailTaskId);
      if (task) task.assignee = value;
      updateSidebarCounts();
    }
    if (property === 'priority') {
      const badge = card.querySelector('.priority-badge');
      if (badge) {
        badge.className = `priority-badge priority-${value.toLowerCase()}`;
        badge.innerHTML = `<lottie-player src="${getPriorityLottieUrl(value)}" background="transparent" speed="1" style="width:18px;height:18px;flex-shrink:0;" loop autoplay></lottie-player>${value}`;
      }
      logActivity(`updated "${nameEl.textContent}" priority → ${value}`, 'update');
    }
    if (property === 'status') {
      const badge = card.querySelector('.status-badge');
      if (badge) {
        badge.className = `status-badge ${getStatusClass(value)} task-card-status-badge`;
        const select = badge.querySelector('select');
        if (select) select.value = value;
      }
      logActivity(`updated "${nameEl.textContent}" status → ${value}`, 'update');
    }
  }
}

// Auto-save listeners
detailTaskName.addEventListener('blur', () => updateTaskProperty('name', detailTaskName.textContent.trim()));
detailAssignee.addEventListener('change', () => updateTaskProperty('assignee', detailAssignee.value));
detailPriority.addEventListener('change', () => updateTaskProperty('priority', detailPriority.value));
detailStatus.addEventListener('change', () => updateTaskProperty('status', detailStatus.value));
detailCompany.addEventListener('blur', () => updateTaskProperty('company', detailCompany.value.trim()));
detailStakeholder.addEventListener('blur', () => updateTaskProperty('stake_holder', detailStakeholder.value.trim()));
detailLink.addEventListener('blur', () => updateTaskProperty('working_link', detailLink.value.trim()));
detailDescription.addEventListener('blur', () => updateTaskProperty('description', detailDescription.innerHTML.trim()));

// Initialize Mentions
setupMentions(detailDescription);
setupMentions(noteContent);

// Profile Page Logic


backToTasks.addEventListener('click', () => {
  switchPage('tasklist');
});

// Page Switching Logic
function switchPage(pageId) {
  console.log('Switching to page:', pageId);
  
  // Update UI visibility
  pages.forEach(page => {
    if (page.id === `${pageId}Page`) {
      page.classList.remove('hidden');
    } else {
      page.classList.add('hidden');
    }
  });

  // Update Nav Active State
  navItems.forEach(item => {
    if (item.getAttribute('data-page') === pageId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Special logic per page
  if (pageId !== 'tasklist') closeDetailModal();
  if (pageId === 'profile') updateUserProfileUI();
  if (pageId === 'notes') fetchNotes();
  if (pageId === 'statistics') fetchStatistics();
}

// Add Nav Listeners
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const pageId = item.getAttribute('data-page');
    if (pageId === 'notes') {
      toggleNotesSidePanel();
    } else {
      closeNotesSidePanel();
      switchPage(pageId);
    }
  });
});

// ── Statistics ───────────────────────────────────────
let statusChartInstance = null;
let completionChartInstance = null;

async function fetchStatistics() {
  // Fetch task counts in parallel
  const [activeRes, completedRes, deletedRes] = await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true }).is('deleted_at', null).is('completed_at', null),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).not('completed_at', 'is', null),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).not('deleted_at', 'is', null),
  ]);

  const activeCount = activeRes.count ?? 0;
  const completedCount = completedRes.count ?? 0;
  const deletedCount = deletedRes.count ?? 0;

  const activeEl = document.getElementById('statActiveCount');
  const completedEl = document.getElementById('statCompletedCount');
  const deletedEl = document.getElementById('statDeletedCount');
  if (activeEl) activeEl.textContent = activeCount;
  if (completedEl) completedEl.textContent = completedCount;
  if (deletedEl) deletedEl.textContent = deletedCount;

  // Fetch active tasks for status donut chart
  const { data: activeTasks } = await supabase
    .from('tasks').select('status').is('deleted_at', null).is('completed_at', null);

  const statusCounts = { 'To Do': 0, 'In Progress': 0, 'Review': 0, 'Done': 0 };
  (activeTasks || []).forEach(t => {
    if (t.status in statusCounts) statusCounts[t.status]++;
  });

  const isDark = document.documentElement.classList.contains('dark');
  const clr = {
    legendText:  isDark ? '#9ca3af' : '#6b7280',
    gridLine:    isDark ? '#374151' : '#f3f4f6',
    tickText:    isDark ? '#6b7280' : '#9ca3af',
    cardBorder:  isDark ? '#1f2937' : '#fff',
  };

  if (statusChartInstance) statusChartInstance.destroy();
  const donutCtx = document.getElementById('statusDonutChart');
  if (donutCtx) {
    statusChartInstance = new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: isDark
            ? ['#374151', '#1d4ed8', '#b45309', '#15803d']
            : ['#e5e7eb', '#3b82f6', '#f59e0b', '#22c55e'],
          borderWidth: 2,
          borderColor: clr.cardBorder,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 16, font: { family: 'Inter', size: 12 }, color: clr.legendText }
          }
        }
      }
    });
  }

  // Fetch completions for last 7 days
  const dayLabels = [];
  const dayCounts = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
    dayCounts.push(0);
  }

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data: recentCompleted } = await supabase
    .from('tasks').select('completed_at')
    .not('completed_at', 'is', null)
    .gte('completed_at', sevenDaysAgo.toISOString());

  (recentCompleted || []).forEach(t => {
    const d = new Date(t.completed_at);
    const msAgo = now.getTime() - d.getTime();
    const daysAgo = Math.floor(msAgo / 86400000);
    const idx = 6 - daysAgo;
    if (idx >= 0 && idx < 7) dayCounts[idx]++;
  });

  if (completionChartInstance) completionChartInstance.destroy();
  const barCtx = document.getElementById('completionBarChart');
  if (barCtx) {
    completionChartInstance = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: dayLabels,
        datasets: [{
          label: 'Completed',
          data: dayCounts,
          backgroundColor: '#1c64f2',
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: clr.tickText, font: { family: 'Inter', size: 11 } },
            grid: { color: clr.gridLine },
            border: { display: false }
          },
          x: {
            ticks: { color: clr.tickText, font: { family: 'Inter', size: 11 } },
            grid: { display: false },
            border: { display: false }
          }
        }
      }
    });
  }

  fetchHistory();
}

// ── History ──────────────────────────────────────────
let activeHistoryTab = 'completed';

async function fetchHistory(tab = activeHistoryTab) {
  activeHistoryTab = tab;
  const historyList = document.getElementById('historyList');
  if (!historyList) return;

  // Sync tab UI
  document.querySelectorAll('.history-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
  });

  historyList.innerHTML = `<div class="history-empty"><svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><p>Loading…</p></div>`;

  const isCompleted = tab === 'completed';
  const col = isCompleted ? 'completed_at' : 'deleted_at';
  const { data, error } = await supabase
    .from('tasks').select('*')
    .not(col, 'is', null)
    .order(col, { ascending: false });

  if (error) {
    historyList.innerHTML = `<div class="history-empty"><p>Failed to load</p><span>${error.message}</span></div>`;
    return;
  }

  const emptyLabel = isCompleted
    ? ['No completed tasks', 'Mark a task as completed to see it here']
    : ['No deleted tasks', 'Tasks you delete will appear here'];

  if (!data || data.length === 0) {
    historyList.innerHTML = `
      <div class="history-empty">
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <p>${emptyLabel[0]}</p><span>${emptyLabel[1]}</span>
      </div>`;
    return;
  }

  historyList.innerHTML = '';
  data.forEach(task => historyList.appendChild(createHistoryItem(task, isCompleted)));
}

// Tab click listeners (delegated from document since page is hidden on load)
document.addEventListener('click', (e) => {
  const tab = e.target.closest('.history-tab');
  if (tab) fetchHistory(tab.getAttribute('data-tab'));
});

function createHistoryItem(task, isCompleted = false) {
  const dateVal = isCompleted ? task.completed_at : task.deleted_at;
  const date = new Date(dateVal);
  const timeAgo = formatTimeAgo(date);
  const fullDate = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const wrapper = document.createElement('div');
  wrapper.className = 'history-item';
  wrapper.innerHTML = `
    <div class="history-timeline">
      <div class="history-dot ${isCompleted ? 'history-dot-completed' : ''}"></div>
      <div class="history-line"></div>
    </div>
    <div class="history-card">
      <div class="history-card-top">
        <span class="history-task-name ${isCompleted ? 'history-task-completed' : ''}">${task.name}</span>
        <span class="history-time" title="${fullDate}">${timeAgo}</span>
      </div>
      <div class="history-card-meta">
        <span class="status-badge ${getStatusClass(task.status)}" style="position:relative;width:auto;padding:0 10px;">${task.status || 'To Do'}</span>
        <span class="priority-badge priority-${(task.priority || 'medium').toLowerCase()}">${task.priority || 'Medium'}</span>
        ${task.assignee ? `<span class="history-assignee">${task.assignee}</span>` : ''}
        ${task.company ? `<span class="history-company">· ${task.company}</span>` : ''}
      </div>
      <div class="history-card-actions">
        <button class="btn-restore" data-id="${task.id}">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Restore to Tasks
        </button>
        <button class="btn-delete-permanent" data-id="${task.id}">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          Delete Permanently
        </button>
      </div>
    </div>`;

  const restoreField = isCompleted ? 'completed_at' : 'deleted_at';
  wrapper.querySelector('.btn-restore').addEventListener('click', () => restoreTask(task.id, wrapper, restoreField));
  wrapper.querySelector('.btn-delete-permanent').addEventListener('click', () => permanentDeleteTask(task.id, wrapper));
  return wrapper;
}

async function restoreTask(id, el, field = 'deleted_at') {
  const { error } = await supabase.from('tasks').update({ [field]: null }).eq('id', id);
  if (error) { console.error('Error restoring task:', error); return; }
  el.style.opacity = '0';
  el.style.transition = 'opacity 0.25s';
  setTimeout(() => el.remove(), 250);
}

async function permanentDeleteTask(id, el) {
  if (!confirm('Permanently delete this task? This cannot be undone.')) return;
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) { console.error('Error permanently deleting task:', error); return; }
  el.style.opacity = '0';
  el.style.transition = 'opacity 0.25s';
  setTimeout(() => el.remove(), 250);
}

function formatTimeAgo(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}
// ─────────────────────────────────────────────────────

async function fetchNotes() {
  console.log('Fetching notes...');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    return;
  }

  renderNotes(data || []);
}

function renderNotes(notes) {
  if (!notesGrid) return;
  
  if (notes.length === 0) {
    notesGrid.innerHTML = `
      <div class="note-card-placeholder">
        <h3>📓 No notes yet</h3>
        <p>Click "+ New Note" to start your first idea.</p>
      </div>
    `;
    return;
  }

  notesGrid.innerHTML = notes.map(note => {
    // Basic HTML to Text for excerpt
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.content || '';
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const excerpt = textContent.substring(0, 150) + (textContent.length > 150 ? '...' : '');
    const date = new Date(note.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    return `
      <div class="note-card" data-id="${note.id}">
        <h3>${note.title || 'Untitled'}</h3>
        <p class="note-excerpt">${excerpt || 'No content...'}</p>
        <span class="note-date">Updated ${date}</span>
      </div>
    `;
  }).join('');

  // Attach click listeners to cards
  document.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      const note = notes.find(n => n.id === id);
      openNoteEditor(note);
    });
  });
}

let currentNoteId = null;
let saveTimeout = null;

function openNoteEditor(note = null) {
  currentNoteId = note ? note.id : null;
  noteTitle.value = note ? note.title : '';
  noteContent.innerHTML = note ? note.content : '';
  saveStatus.textContent = note ? 'All changes saved' : 'New Note';
  
  // Toggle Page
  document.querySelectorAll('.app-page').forEach(p => p.classList.add('hidden'));
  noteEditorPage.classList.remove('hidden');
  
  // Hide Nav while editing for "Full View"
  document.getElementById('floatingNav').classList.add('hidden');
}

async function saveNote() {
  saveStatus.textContent = 'Saving...';
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const noteData = {
    user_id: user.id,
    title: noteTitle.value || 'Untitled',
    content: noteContent.innerHTML,
    updated_at: new Date().toISOString()
  };

  let result;
  if (currentNoteId) {
    result = await supabase.from('notes').update(noteData).eq('id', currentNoteId);
  } else {
    result = await supabase.from('notes').insert([noteData]).select();
    if (result.data) currentNoteId = result.data[0].id;
  }

  if (result.error) {
    console.error('Save error:', result.error);
    saveStatus.textContent = 'Error saving';
  } else {
    saveStatus.textContent = 'All changes saved';
  }
}

function triggerAutoSave() {
  saveStatus.textContent = 'Unsaved changes';
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveNote, 1500);
}

// Event Listeners
if (addNoteBtn) addNoteBtn.addEventListener('click', () => openNoteEditor());

if (closeEditorBtn) closeEditorBtn.addEventListener('click', () => {
  noteEditorPage.classList.add('hidden');
  document.getElementById('notesPage').classList.remove('hidden');
  document.getElementById('floatingNav').classList.remove('hidden');
  // Update the grid
  fetchNotes();
});

if (deleteNoteBtn) deleteNoteBtn.addEventListener('click', async () => {
  if (!currentNoteId) {
    closeEditorBtn.click();
    return;
  }
  
  if (confirm('Are you sure you want to delete this note?')) {
    const { error } = await supabase.from('notes').delete().eq('id', currentNoteId);
    if (!error) closeEditorBtn.click();
  }
});

if (noteTitle) noteTitle.addEventListener('input', triggerAutoSave);
if (noteContent) noteContent.addEventListener('input', triggerAutoSave);

// Toolbar logic (main note editor only — panel editor uses data-panel-command)
toolbarBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const command = btn.getAttribute('data-command');
    if (!command) return;
    const value = btn.getAttribute('data-value') || null;
    document.execCommand(command, false, value);
    noteContent.focus();
    triggerAutoSave();
  });
});

// ── Notes Side Panel ──────────────────────────────────
let currentPanelNoteId = null;
let panelSaveTimeout = null;
let notesPanelOpen = false;

function openNotesSidePanel() {
  notesPanelOpen = true;
  const panel = document.getElementById('notesSidePanel');
  if (panel) panel.classList.add('notes-panel-open');
  closeDetailModal();
  // Stay on tasklist page, mark Notes nav active
  pages.forEach(page => {
    if (page.id !== 'tasklistPage') page.classList.add('hidden');
  });
  const tasklistPage = document.getElementById('tasklistPage');
  if (tasklistPage) tasklistPage.classList.remove('hidden');
  navItems.forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-page') === 'notes');
  });
  showNotesPanelListView();
  fetchNotesPanel();
}

function closeNotesSidePanel() {
  if (!notesPanelOpen) return;
  notesPanelOpen = false;
  const panel = document.getElementById('notesSidePanel');
  if (panel) panel.classList.remove('notes-panel-open');
  navItems.forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-page') === 'tasklist');
  });
}

function toggleNotesSidePanel() {
  if (notesPanelOpen) {
    closeNotesSidePanel();
  } else {
    openNotesSidePanel();
  }
}

function showNotesPanelListView() {
  if (notesPanelListView) notesPanelListView.classList.remove('hidden');
  if (notesPanelEditorView) notesPanelEditorView.classList.add('hidden');
}

function showNotesPanelEditorView() {
  if (notesPanelListView) notesPanelListView.classList.add('hidden');
  if (notesPanelEditorView) notesPanelEditorView.classList.remove('hidden');
}

async function fetchNotesPanel() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data, error } = await supabase
    .from('notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
  if (!error) renderNotesPanelGrid(data || []);
}

function renderNotesPanelGrid(notes) {
  if (!notesPanelGrid) return;
  if (notes.length === 0) {
    notesPanelGrid.innerHTML = '<div class="notes-panel-empty">No notes yet.<br>Click "+ New" to start.</div>';
    return;
  }
  notesPanelGrid.innerHTML = '';
  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = 'notes-panel-card';
    const tmp = document.createElement('div');
    tmp.innerHTML = note.content || '';
    const text = tmp.textContent || '';
    const excerpt = text.substring(0, 100) + (text.length > 100 ? '...' : '');
    const date = new Date(note.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    card.innerHTML = `
      <h4>${note.title || 'Untitled'}</h4>
      <p class="note-panel-excerpt">${excerpt || 'No content...'}</p>
      <span class="note-panel-date">Updated ${date}</span>
    `;
    card.addEventListener('click', () => openNoteInPanel(note));
    notesPanelGrid.appendChild(card);
  });
}

function openNoteInPanel(note = null) {
  currentPanelNoteId = note ? note.id : null;
  if (notesPanelTitle) notesPanelTitle.value = note ? (note.title || '') : '';
  if (notesPanelContent) notesPanelContent.innerHTML = note ? (note.content || '') : '';
  if (notesPanelSaveStatus) notesPanelSaveStatus.textContent = note ? 'All changes saved' : 'New Note';
  showNotesPanelEditorView();
}

async function savePanelNote() {
  if (!notesPanelSaveStatus) return;
  notesPanelSaveStatus.textContent = 'Saving...';
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const noteData = {
    user_id: user.id,
    title: notesPanelTitle ? notesPanelTitle.value || 'Untitled' : 'Untitled',
    content: notesPanelContent ? notesPanelContent.innerHTML : '',
    updated_at: new Date().toISOString()
  };
  let result;
  if (currentPanelNoteId) {
    result = await supabase.from('notes').update(noteData).eq('id', currentPanelNoteId);
  } else {
    result = await supabase.from('notes').insert([noteData]).select();
    if (result.data && result.data[0]) currentPanelNoteId = result.data[0].id;
  }
  if (result.error) {
    notesPanelSaveStatus.textContent = 'Error saving';
  } else {
    notesPanelSaveStatus.textContent = 'All changes saved';
  }
}

function triggerPanelAutoSave() {
  if (notesPanelSaveStatus) notesPanelSaveStatus.textContent = 'Unsaved changes';
  if (panelSaveTimeout) clearTimeout(panelSaveTimeout);
  panelSaveTimeout = setTimeout(savePanelNote, 1500);
}

if (notesPanelAddBtn) notesPanelAddBtn.addEventListener('click', () => openNoteInPanel());

if (closeNotesPanelBtn) closeNotesPanelBtn.addEventListener('click', () => closeNotesSidePanel());

if (notesPanelBackBtn) notesPanelBackBtn.addEventListener('click', () => {
  showNotesPanelListView();
  fetchNotesPanel();
});

if (notesPanelDeleteBtn) notesPanelDeleteBtn.addEventListener('click', async () => {
  if (!currentPanelNoteId) {
    showNotesPanelListView();
    return;
  }
  if (confirm('Are you sure you want to delete this note?')) {
    const { error } = await supabase.from('notes').delete().eq('id', currentPanelNoteId);
    if (!error) {
      showNotesPanelListView();
      fetchNotesPanel();
    }
  }
});

if (notesPanelTitle) notesPanelTitle.addEventListener('input', triggerPanelAutoSave);
if (notesPanelContent) notesPanelContent.addEventListener('input', triggerPanelAutoSave);

document.querySelectorAll('[data-panel-command]').forEach(btn => {
  btn.addEventListener('click', () => {
    const command = btn.getAttribute('data-panel-command');
    const value = btn.getAttribute('data-panel-value') || null;
    document.execCommand(command, false, value);
    if (notesPanelContent) notesPanelContent.focus();
    triggerPanelAutoSave();
  });
});

profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newName = fullNameInput.value.trim();
  
  const { data, error } = await supabase.auth.updateUser({
    data: { full_name: newName }
  });

  if (error) {
    console.error('Error updating profile:', error.message);
    alert('Error updating profile');
  } else {
    alert('Profile updated successfully!');
    updateUserProfileUI();
  }
});

// Realtime Subscription


// Notification Logic
function addNotification(message, type, date = new Date(), userName = null, userAvatar = null, userId = null) {
  // If DB doesn't have user columns yet, use the pending cache (current user just triggered this)
  if (!userName && pendingActivityInfo) {
    userName = pendingActivityInfo.name;
    userAvatar = pendingActivityInfo.avatar;
    userId = pendingActivityInfo.id;
    pendingActivityInfo = null;
    if (pendingActivityTimer) { clearTimeout(pendingActivityTimer); pendingActivityTimer = null; }
  }

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  notifications.unshift({ message, time: timeStr, type, userName, userAvatar, userId });
  if (notifications.length > 50) notifications.pop(); 
  
  updateNotifUI();
  
  // Show badge only for real-time new notifications
  if (date > new Date(Date.now() - 5000)) {
    notifBadge.classList.remove('hidden');
    
    // Trigger Custom Desktop Banner Window (Electron) or floating glassmorphic Toast (Web)
    if (ipcRenderer) {
      ipcRenderer.send('show-notification', { message, type });
    } else {
      showWebToast(message, type);
    }

    notifSound.currentTime = 0;
    notifSound.play().catch(() => {});
  }
}

// Float glassmorphic web toast notifications in standard browser
function showWebToast(message, type) {
  const container = document.getElementById('webToastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `web-toast type-${type}`;

  let iconText = '💬';
  let titleText = 'Project Update';
  
  if (type === 'insert') {
    iconText = '✨';
    titleText = 'New Task Created';
  } else if (type === 'update') {
    iconText = '🔄';
    titleText = 'Task Updated';
  } else if (type === 'delete') {
    iconText = '🗑️';
    titleText = 'Task Deleted';
  }

  toast.innerHTML = `
    <div class="web-toast-icon">${iconText}</div>
    <div class="web-toast-content">
      <div class="web-toast-title">${titleText}</div>
      <div class="web-toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  // Auto-remove after 4.5 seconds with sleek transition
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 350);
  }, 4500);
}


function updateNotifUI() {
  if (notifications.length === 0) {
    notifList.innerHTML = '<div class="notif-empty">No recent activity</div>';
    return;
  }

  notifList.innerHTML = notifications.map(n => {
    // Lookup avatar dari profiles — coba user_id dulu, fallback ke full_name
    const member = teamMembers.find(m =>
      (n.userId && m.id === n.userId) ||
      (n.userName && m.full_name === n.userName)
    ) || null;
    const avatarSrc = n.userAvatar || member?.avatar_url || null;
    const displayName = n.userName || member?.full_name || null;
    const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';

    const avatarHtml = avatarSrc
      ? `<img src="${avatarSrc}" alt="${displayName}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        + `<span class="notif-avatar-initial" style="display:none">${initial}</span>`
      : `<span class="notif-avatar-initial">${initial}</span>`;

    return `
      <div class="notif-item">
        <div class="notif-avatar">${avatarHtml}</div>
        <div class="notif-item-body">
          <div class="notif-item-title">${n.message}</div>
          <div class="notif-item-meta">
            ${displayName ? `<span class="notif-user">${displayName}</span>` : ''}
            <span class="notif-item-time">${n.time}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

notifBtn.addEventListener('click', (e) => {
  console.log('Notification button clicked');
  e.stopPropagation();
  notifPanel.classList.toggle('hidden');
  notifBadge.classList.add('hidden');
  console.log('Panel hidden status:', notifPanel.classList.contains('hidden'));
});

closeNotif.addEventListener('click', () => {
  notifPanel.classList.add('hidden');
});

document.addEventListener('click', (e) => {
  if (!notifPanel.contains(e.target) && e.target !== notifBtn) {
    notifPanel.classList.add('hidden');
  }
});

// Presence Logic
async function setupPresence() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const name = user.user_metadata?.full_name || user.email.split('@')[0];
  const initial = name.charAt(0).toUpperCase();
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

  // If already subscribed, unsubscribe first to avoid duplicates
  if (presenceChannel) {
    await presenceChannel.unsubscribe();
  }

  presenceChannel = supabase.channel('online-users', {
    config: {
      presence: {
        key: user.id,
      },
    },
  });

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      updatePresenceUI(state);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({
          user_id: user.id,
          name: name,
          initial: initial,
          email: user.email,
          avatar_url: avatarUrl,
          online_at: new Date().toISOString(),
        });
      }
    });
}

function updatePresenceUI(presenceState) {
  const activeUsersContainer = document.getElementById('activeUsers');
  if (!activeUsersContainer) return;

  // Flatten the presence state to unique users
  const users = Object.values(presenceState).map(p => p[0]);
  
  // Sort by online_at to keep order stable
  users.sort((a, b) => new Date(a.online_at) - new Date(b.online_at));

  activeUsersContainer.innerHTML = users.map(u => `
    <div class="user-avatar-tiny" title="${u.name} (${u.email})">
      ${u.avatar_url
        ? `<img src="${u.avatar_url}" alt="${u.name}">`
        : u.initial}
    </div>
  `).join('');
}

// Mention System Logic
function setupMentions(element) {
  if (!element) return;

  element.addEventListener('input', (e) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    
    // Only trigger if we are in a text node
    if (range.startContainer.nodeType !== Node.TEXT_NODE) return;

    const text = range.startContainer.textContent.substring(0, range.startOffset);
    const lastAt = text.lastIndexOf('@');

    // Trigger only if @ is at start or after a space
    if (lastAt !== -1 && (lastAt === 0 || text[lastAt - 1] === ' ' || text[lastAt - 1] === '\u00A0')) {
      const query = text.substring(lastAt + 1).toLowerCase();
      
      // Don't trigger if there's a space after @
      if (query.includes(' ')) {
        hideMentionSuggestions();
        return;
      }

      mentionRange = range.cloneRange();
      mentionRange.setStart(range.startContainer, lastAt);
      currentMentionElement = element;
      showMentionSuggestions(query, range);
    } else {
      hideMentionSuggestions();
    }
  });

  element.addEventListener('keydown', (e) => {
    if (mentionSuggestions.classList.contains('hidden')) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedMentionIndex = (selectedMentionIndex + 1) % filteredMentions.length;
      renderMentionSuggestions(); // Re-render to update selected class
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedMentionIndex = (selectedMentionIndex - 1 + filteredMentions.length) % filteredMentions.length;
      renderMentionSuggestions();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredMentions[selectedMentionIndex]) {
        insertMention(filteredMentions[selectedMentionIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      hideMentionSuggestions();
    }
  });
}

function showMentionSuggestions(query, range) {
  filteredMentions = teamMembers.filter(m => 
    m.full_name.toLowerCase().includes(query) || 
    m.email.toLowerCase().includes(query)
  );

  if (filteredMentions.length === 0) {
    hideMentionSuggestions();
    return;
  }

  selectedMentionIndex = 0;
  renderMentionSuggestions();

  // Position the dropdown near the cursor
  const rect = range.getBoundingClientRect();
  
  // Ensure it doesn't go off screen
  let top = window.scrollY + rect.bottom + 5;
  let left = window.scrollX + rect.left;
  
  mentionSuggestions.style.top = `${top}px`;
  mentionSuggestions.style.left = `${left}px`;
  mentionSuggestions.classList.remove('hidden');
}

function renderMentionSuggestions() {
  mentionSuggestions.innerHTML = filteredMentions.map((m, i) => {
    const initial = m.full_name.charAt(0).toUpperCase();
    return `
      <div class="mention-item ${i === selectedMentionIndex ? 'selected' : ''}" data-index="${i}">
        <div class="mention-item-avatar">${initial}</div>
        <span>${m.full_name}</span>
      </div>
    `;
  }).join('');

  mentionSuggestions.querySelectorAll('.mention-item').forEach(item => {
    item.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevent focus loss
      const index = parseInt(item.getAttribute('data-index'));
      insertMention(filteredMentions[index]);
    });
  });
}

function insertMention(user) {
  if (!mentionRange) return;

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(mentionRange);
  
  // Delete the @query
  document.execCommand('delete');

  const chip = document.createElement('span');
  chip.className = 'mention-chip';
  chip.contentEditable = 'false';
  chip.textContent = `@${user.full_name}`;
  
  // Insert the chip
  const range = selection.getRangeAt(0);
  range.insertNode(chip);
  
  // Move cursor after the chip and add a space
  range.setStartAfter(chip);
  range.collapse(true);
  
  const space = document.createTextNode('\u00A0');
  range.insertNode(space);
  range.setStartAfter(space);
  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);

  hideMentionSuggestions();
  
  // Trigger update/save
  if (currentMentionElement === noteContent) {
    triggerAutoSave();
  } else if (currentMentionElement === detailDescription) {
    updateTaskProperty('description', detailDescription.innerHTML);
  }
  
  currentMentionElement.focus();
}

function hideMentionSuggestions() {
  mentionSuggestions.classList.add('hidden');
  mentionRange = null;
}

function updateGreeting() {
  const hour = new Date().getHours();
  let text, lottieUrl;
  if (hour >= 5 && hour < 12) {
    text = 'Good Morning';
    lottieUrl = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f31e/lottie.json'; // 🌞
  } else if (hour >= 12 && hour < 17) {
    text = 'Good Afternoon';
    lottieUrl = 'https://fonts.gstatic.com/s/e/notoemoji/latest/26c5/lottie.json'; // ⛅
  } else if (hour >= 17 && hour < 21) {
    text = 'Good Evening';
    lottieUrl = 'https://fonts.gstatic.com/s/e/notoemoji/latest/26c5/lottie.json'; // ⛅
  } else {
    text = 'Good Night';
    lottieUrl = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f31c/lottie.json'; // 🌜
  }
  const textEl = document.getElementById('greetingText');
  if (textEl) textEl.textContent = text;

  const lottieEl = document.getElementById('greetingLottie');
  if (lottieEl) {
    const fresh = document.createElement('lottie-player');
    fresh.id = 'greetingLottie';
    fresh.setAttribute('src', lottieUrl);
    fresh.setAttribute('background', 'transparent');
    fresh.setAttribute('speed', '1');
    fresh.setAttribute('loop', '');
    fresh.setAttribute('autoplay', '');
    fresh.style.cssText = 'width:72px;height:72px;flex-shrink:0;';
    lottieEl.replaceWith(fresh);
  }
}

// Start
// Start the app after the DOM is ready to ensure elements exist
document.addEventListener('DOMContentLoaded', () => {
  updateGreeting();

  const tabsScroll = document.getElementById('dateTabsBar');
  document.getElementById('tabArrowLeft')?.addEventListener('click', () => {
    tabsScroll?.scrollBy({ left: -160, behavior: 'smooth' });
  });
  document.getElementById('tabArrowRight')?.addEventListener('click', () => {
    tabsScroll?.scrollBy({ left: 160, behavior: 'smooth' });
  });
  document.getElementById('carryToTodayBtn')?.addEventListener('click', carryTasksToToday);
  initPanelResize();

  // Sidebar filter listeners
  document.querySelectorAll('.sidebar-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderTasks();
    });
  });

  // Add row hint
  const addRowHint = document.getElementById('addRowHint');
  if (addRowHint) addRowHint.addEventListener('click', () => document.getElementById('openModalBtn').click());

  // Initiate session check
  checkSession();

  // Safety timeout: if loading screen is still visible after 8 seconds, hide it and show login
  setTimeout(() => {
    if (!loadingScreen.classList.contains('hidden')) {
      console.warn('Session check timed out, displaying login screen.');
      loadingScreen.classList.add('hidden');
      showLogin();
    }
  }, 8000);
});
