// ES module import — Vite bundles this from node_modules/@supabase/supabase-js
import { createClient } from '@supabase/supabase-js';

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



let notifications = [];
let presenceChannel = null;
let dragSrcRow = null;
const positionUpdateIds = new Set();
let tasksChannel = null;
let activityChannel = null;

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
      showLogin();
    }
  });
}

async function showApp() {
  loginScreen.classList.add('hidden');
  appContainer.classList.remove('hidden');
  updateUserProfileUI();
  await fetchUsers();   // Tunggu profiles (+ avatar_url) terload dulu
  setupPresence();
  setupRealtime();
  fetchActivityLog();   // teamMembers sudah terisi, avatar bisa di-lookup
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

async function fetchUsers() {
  const { data, error } = await supabase.from('profiles').select('*').order('full_name');
  if (!error && data) {
    teamMembers = data;
    updateAssigneeDropdowns();
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
  loadingIndicator.style.display = 'block';
  taskTableBody.innerHTML = '';

  let tasks = [];

  const { data, error } = await supabase.from('tasks').select('*').order('position', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching tasks:', error);
    // Silent fail to mock data if table not available
    tasks = mockTasks;
  } else {
    tasks = data;
  }

  loadingIndicator.style.display = 'none';
  renderTasks(tasks);
}

// Helper to create a single row for a task
function createTaskRow(task) {
  const priority = task.priority || 'Medium';
  const tr = document.createElement('tr');
  tr.className = 'notion-row';
  tr.setAttribute('data-id', task.id);
  tr.setAttribute('draggable', 'true');
  
  tr.innerHTML = `
    <td class="col-drag"><span class="drag-handle">⋮⋮</span></td>
    <td class="col-name">
      <span class="row-title" data-id="${task.id}">${task.name}</span>
    </td>
    <td class="col-assignee">
      <span class="notion-chip chip-assignee">${task.assignee || '—'}</span>
    </td>
    <td class="col-company">
      <span class="notion-text">${task.company || '—'}</span>
    </td>
    <td class="col-stakeholder">
      <span class="notion-text">${task.stake_holder || '—'}</span>
    </td>
    <td class="col-priority">
      <span class="priority-badge priority-${priority.toLowerCase()}">
        <lottie-player 
          src="${getPriorityLottieUrl(priority)}" 
          background="transparent" 
          speed="1" 
          style="width: 18px; height: 18px;" 
          loop 
          autoplay>
        </lottie-player>
        ${priority}
      </span>
    </td>
    <td class="col-status">
      <span class="status-badge ${getStatusClass(task.status)}">
        <select class="status-select" data-id="${task.id}">
          <option value="To Do" ${task.status === 'To Do' ? 'selected' : ''}>To Do</option>
          <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Review" ${task.status === 'Review' ? 'selected' : ''}>Review</option>
          <option value="Done" ${task.status === 'Done' ? 'selected' : ''}>Done</option>
        </select>
      </span>
    </td>
    <td class="col-link">
      ${task.working_link
        ? `<a href="${task.working_link}" target="_blank" class="notion-link">Open ↗</a>
           <button class="btn-link-edit" data-id="${task.id}" data-link="${task.working_link}" title="Edit link">✎</button>`
        : `<button class="btn-link-add" data-id="${task.id}" title="Add link">+ Add</button>`
      }
    </td>
    <td class="col-actions">
      <div class="actions-wrapper">
        <button class="btn-icon btn-actions" data-id="${task.id}" title="Actions">⋮</button>
        <div class="actions-dropdown hidden" id="dropdown-${task.id}">
          <button class="dropdown-item view-detail" data-id="${task.id}">👁 View Details</button>
          <button class="dropdown-item delete-task" data-id="${task.id}">🗑 Delete</button>
        </div>
      </div>
    </td>
  `;

  // Attach internal row listeners
  tr.addEventListener('click', (e) => {
    if (e.target.closest('.status-select') || e.target.closest('.col-link') || 
        e.target.closest('.actions-wrapper') || e.target.closest('.btn-icon')) return;
    openDetailModal(task);
  });

  tr.querySelector('.status-select').addEventListener('change', handleStatusChange);
  tr.querySelector('.btn-actions').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleActionsMenu(task.id);
  });
  tr.querySelector('.view-detail').addEventListener('click', (e) => {
    e.stopPropagation();
    openDetailModal(task);
    closeAllDropdowns();
  });
  tr.querySelector('.delete-task').addEventListener('click', (e) => {
    e.stopPropagation();
    handleDeleteTask(e);
    closeAllDropdowns();
  });

  const linkBtn = tr.querySelector('.btn-link-add, .btn-link-edit');
  if (linkBtn) linkBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleLinkEdit(e);
  });

  setupRowDrag(tr);

  return tr;
}

async function saveTaskOrder() {
  const rows = taskTableBody.querySelectorAll('.notion-row');

  const updates = Array.from(rows).map((row, index) => {
    const id = row.getAttribute('data-id');
    positionUpdateIds.add(id);
    return supabase.from('tasks').update({ position: index + 1 }).eq('id', id);
  });

  await Promise.all(updates);

  // Clear IDs setelah 3 detik (jaga-jaga realtime lambat)
  setTimeout(() => positionUpdateIds.clear(), 3000);
}

function setupRowDrag(tr) {
  tr.addEventListener('dragstart', (e) => {
    dragSrcRow = tr;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => tr.classList.add('row-dragging'), 0);
  });

  tr.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!dragSrcRow || dragSrcRow === tr) return;

    document.querySelectorAll('.notion-row').forEach(r =>
      r.classList.remove('drag-over-top', 'drag-over-bottom')
    );

    const rect = tr.getBoundingClientRect();
    if (e.clientY < rect.top + rect.height / 2) {
      tr.classList.add('drag-over-top');
    } else {
      tr.classList.add('drag-over-bottom');
    }
  });

  tr.addEventListener('dragleave', () => {
    tr.classList.remove('drag-over-top', 'drag-over-bottom');
  });

  tr.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!dragSrcRow || dragSrcRow === tr) return;

    const insertBefore = tr.classList.contains('drag-over-top');
    tr.classList.remove('drag-over-top', 'drag-over-bottom');

    if (insertBefore) {
      taskTableBody.insertBefore(dragSrcRow, tr);
    } else {
      tr.after(dragSrcRow);
    }

    saveTaskOrder();
  });

  tr.addEventListener('dragend', () => {
    tr.classList.remove('row-dragging');
    document.querySelectorAll('.notion-row').forEach(r =>
      r.classList.remove('drag-over-top', 'drag-over-bottom')
    );
    dragSrcRow = null;
  });
}

function renderTasks(tasks) {
  taskTableBody.innerHTML = '';
  tasks.forEach(task => {
    const tr = createTaskRow(task);
    taskTableBody.appendChild(tr);
  });
  document.getElementById('addRowHint').onclick = () => document.getElementById('openModalBtn').click();
}

function setupRealtime() {
  if (!supabase) return;

  // Remove existing channels sebelum subscribe ulang
  if (tasksChannel) { supabase.removeChannel(tasksChannel); tasksChannel = null; }
  if (activityChannel) { supabase.removeChannel(activityChannel); activityChannel = null; }

  tasksChannel = supabase.channel('custom-all-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, (payload) => {
      const tr = createTaskRow(payload.new);
      tr.classList.add('row-enter');
      taskTableBody.prepend(tr);
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks' }, (payload) => {
      const row = document.querySelector(`.notion-row[data-id="${payload.old.id}"]`);
      if (row) {
        row.classList.add('row-exit');
        setTimeout(() => row.remove(), 250);
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, (payload) => {
      const updatedTask = payload.new;
      if (positionUpdateIds.has(updatedTask.id)) return;
      if (currentDetailTaskId === updatedTask.id) return;
      const existingRow = document.querySelector(`.notion-row[data-id="${updatedTask.id}"]`);
      if (existingRow) updateRowInPlace(existingRow, updatedTask);
    })
    .subscribe();

  activityChannel = supabase.channel('activity-log-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, (payload) => {
      const msg = payload.new.message || '';
      if (msg.toLowerCase().includes('description')) return;
      addNotification(payload.new.message, payload.new.type, new Date(payload.new.created_at), payload.new.user_name, payload.new.user_avatar, payload.new.user_id);
    })
    .subscribe();
}

function updateRowInPlace(row, task) {
  const priority = task.priority || 'Medium';

  const nameEl = row.querySelector('.row-title');
  if (nameEl) nameEl.textContent = task.name;

  const assigneeEl = row.querySelector('.chip-assignee');
  if (assigneeEl) assigneeEl.textContent = task.assignee || '—';

  const companyEl = row.querySelector('.col-company .notion-text');
  if (companyEl) companyEl.textContent = task.company || '—';

  const stakeholderEl = row.querySelector('.col-stakeholder .notion-text');
  if (stakeholderEl) stakeholderEl.textContent = task.stake_holder || '—';

  const priorityEl = row.querySelector('.priority-badge');
  if (priorityEl) {
    priorityEl.className = `priority-badge priority-${priority.toLowerCase()}`;
    priorityEl.innerHTML = `
      <lottie-player src="${getPriorityLottieUrl(priority)}"
        background="transparent" speed="1"
        style="width:18px;height:18px;" loop autoplay>
      </lottie-player>${priority}`;
  }

  const statusBadge = row.querySelector('.status-badge');
  const statusSelect = row.querySelector('.status-select');
  if (statusBadge && statusSelect) {
    statusBadge.className = `status-badge ${getStatusClass(task.status)}`;
    statusSelect.value = task.status;
  }

  const linkCell = row.querySelector('.col-link');
  if (linkCell && !linkCell.querySelector('.inline-link-edit')) {
    if (task.working_link) {
      linkCell.innerHTML = `<a href="${task.working_link}" target="_blank" class="notion-link">Open ↗</a>
        <button class="btn-link-edit" data-id="${task.id}" data-link="${task.working_link}" title="Edit link">✎</button>`;
      linkCell.querySelector('.btn-link-edit').addEventListener('click', (e) => { e.stopPropagation(); handleLinkEdit(e); });
    } else {
      linkCell.innerHTML = `<button class="btn-link-add" data-id="${task.id}" title="Add link">+ Add</button>`;
      linkCell.querySelector('.btn-link-add').addEventListener('click', (e) => { e.stopPropagation(); handleLinkEdit(e); });
    }
  }

  row.classList.remove('row-updated');
  void row.offsetWidth;
  row.classList.add('row-updated');
  setTimeout(() => row.classList.remove('row-updated'), 700);
}

async function logActivity(message, type) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const name = user.user_metadata?.full_name || user.email.split('@')[0];
  const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  const { error } = await supabase.from('activity_log').insert({ message, type, user_id: user.id, user_name: name, user_avatar: avatar });
  if (error) console.error('logActivity error (pastikan SQL sudah dijalankan):', error.message);
}

async function fetchActivityLog() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  console.log('Fetching activity log since:', sevenDaysAgo.toISOString());
  
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching activity log:', error);
    return;
  }

  if (data) {
    notifications = data.map(item => ({
      message: item.message,
      time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: item.type,
      userId: item.user_id || null,
      userName: item.user_name || null,
      userAvatar: item.user_avatar || null
    }));
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

function getPriorityLottieUrl(priority) {
  switch (priority) {
    case 'Low':    return 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f33f/lottie.json'; 
    case 'Medium': return 'https://fonts.gstatic.com/s/e/notoemoji/latest/26a1/lottie.json';  
    case 'High':   return 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/lottie.json'; 
    case 'Urgent': return 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f6a8/lottie.json'; 
    default:       return 'https://fonts.gstatic.com/s/e/notoemoji/latest/26a1/lottie.json';
  }
}

// Event Handlers
async function handleStatusChange(e) {
  const id = e.target.getAttribute('data-id');
  const newStatus = e.target.value;
  
  const badge = e.target.parentElement;
  badge.className = `status-badge ${getStatusClass(newStatus)}`;

  const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
  if (error) { console.error('Error updating status:', error); return; }
  const taskName = document.querySelector(`.row-title[data-id="${id}"]`)?.textContent || 'Task';
  logActivity(`updated "${taskName}" → ${newStatus}`, 'update');
}


async function handleDeleteTask(e) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  const id = e.target.getAttribute('data-id');
  const taskName = document.querySelector(`.row-title[data-id="${id}"]`)?.textContent || 'Task';
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) { console.error('Error deleting task:', error); return; }
  logActivity(`deleted task "${taskName}"`, 'delete');
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
    if (link) {
      cell.innerHTML = `<a href="${link}" target="_blank" class="notion-link">Open ↗</a>
        <button class="btn-link-edit" data-id="${id}" data-link="${link}" title="Edit link">✎</button>`;
      cell.querySelector('.btn-link-edit').addEventListener('click', (e) => { e.stopPropagation(); handleLinkEdit(e); });
    } else {
      cell.innerHTML = `<button class="btn-link-add" data-id="${id}" title="Add link">+ Add</button>`;
      cell.querySelector('.btn-link-add').addEventListener('click', (e) => { e.stopPropagation(); handleLinkEdit(e); });
    }
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
    status: document.getElementById('status').value
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

async function openDetailModal(task) {
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
  
  detailModal.classList.remove('hidden');
}

function closeDetailModal() {
  detailModal.classList.add('hidden');
  currentDetailTaskId = null;
}

closeDetailBtn.addEventListener('click', closeDetailModal);
detailModal.addEventListener('click', (e) => {
  if (e.target === detailModal) closeDetailModal();
});

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

  // Update the table row in the background silently without a full fetch/re-render
  const rowTitle = document.querySelector(`.row-title[data-id="${currentDetailTaskId}"]`);
  if (rowTitle) {
    const row = rowTitle.closest('tr');
    if (!row) return;

    if (property === 'name') rowTitle.textContent = value;
    if (property === 'assignee') {
      const chip = row.querySelector('.chip-assignee');
      if (chip) chip.textContent = value || '—';
    }
    if (property === 'priority') {
      const badge = row.querySelector('.priority-badge');
      if (badge) {
        badge.className = `priority-badge priority-${value.toLowerCase()}`;
        badge.innerHTML = `<span class="priority-emoji">${getPriorityEmoji(value)}</span> ${value}`;
      }
    }
    if (property === 'status') {
      const badge = row.querySelector('.status-badge');
      if (badge) {
        badge.className = `status-badge ${getStatusClass(value)}`;
        const select = badge.querySelector('select');
        if (select) select.value = value;
      }
    }
    if (property === 'company') {
      const text = row.querySelector('.col-company .notion-text');
      if (text) text.textContent = value || '—';
    }
    if (property === 'stake_holder') {
      const text = row.querySelector('.col-stakeholder .notion-text');
      if (text) text.textContent = value || '—';
    }
    if (property === 'working_link') {
      const linkCell = row.querySelector('.col-link');
      if (linkCell) {
        if (value) {
          linkCell.innerHTML = `<a href="${value}" target="_blank" class="notion-link">Open ↗</a>
                                <button class="btn-link-edit" data-id="${currentDetailTaskId}" data-link="${value}" title="Edit link">✎</button>`;
          linkCell.querySelector('.btn-link-edit').addEventListener('click', handleLinkEdit);
        } else {
          linkCell.innerHTML = `<button class="btn-link-add" data-id="${currentDetailTaskId}" title="Add link">+ Add</button>`;
          linkCell.querySelector('.btn-link-add').addEventListener('click', handleLinkEdit);
        }
      }
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
  if (pageId === 'profile') updateUserProfileUI();
  if (pageId === 'notes') fetchNotes(); // Placeholder for now
}

// Add Nav Listeners
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const pageId = item.getAttribute('data-page');
    switchPage(pageId);
  });
});

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

// Toolbar logic
toolbarBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const command = btn.getAttribute('data-command');
    const value = btn.getAttribute('data-value') || null;
    document.execCommand(command, false, value);
    noteContent.focus();
    triggerAutoSave();
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

    // AI Voice Notification: "Ada UI"
    const utterance = new SpeechSynthesisUtterance("Ada UI");
    utterance.lang = 'id-ID'; // Set to Indonesian
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
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

// Start
// Start the app after the DOM is ready to ensure elements exist
document.addEventListener('DOMContentLoaded', () => {
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
