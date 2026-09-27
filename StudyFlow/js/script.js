/* =========================================================
   StudyFlow — Core Application Script
   Shared data layer (localStorage), theme, navigation, header
   ========================================================= */

const SF = (() => {

  const KEYS = {
    tasks: 'sf_tasks',
    goals: 'sf_goals',
    events: 'sf_events',
    sessions: 'sf_sessions',
    settings: 'sf_settings',
    theme: 'sf_theme',
    notifications: 'sf_notifications',
    user: 'sf_user',
    seeded: 'sf_seeded_v1'
  };

  /* ---------------- Generic storage helpers ---------------- */
  function get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('SF storage read error', key, e);
      return fallback;
    }
  }
  function set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
  function todayISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }
  function addDays(iso, n) {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function fmtDate(iso, opts) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric' });
  }

  /* ---------------- Seed default data (first run) ---------------- */
  function seed() {
    if (get(KEYS.seeded, false)) return;

    const today = todayISO();
    const tasks = [
      { id: uid(), name: 'Mathematics Homework', subject: 'Mathematics', description: 'Chapter 7, exercises 1-15', dueDate: today, dueTime: '16:00', priority: 'High', completed: false },
      { id: uid(), name: 'Science Revision', subject: 'Science', description: 'Revise photosynthesis unit', dueDate: today, dueTime: '18:00', priority: 'Medium', completed: false },
      { id: uid(), name: 'English Assignment', subject: 'English', description: 'Essay on climate change', dueDate: today, dueTime: '20:00', priority: 'Medium', completed: true },
      { id: uid(), name: 'Hindi Grammar', subject: 'Hindi', description: 'Practice worksheet 4', dueDate: today, dueTime: '17:00', priority: 'Low', completed: true },
      { id: uid(), name: 'Geography Notes', subject: 'Geography', description: 'Summarise chapter on rivers', dueDate: today, dueTime: '19:00', priority: 'Low', completed: false },
      { id: uid(), name: 'Physics Problem Set', subject: 'Physics', description: 'Numerical problems set 3', dueDate: addDays(today, 1), dueTime: '15:00', priority: 'High', completed: false },
      { id: uid(), name: 'Chemistry Lab Report', subject: 'Chemistry', description: 'Write up titration experiment', dueDate: addDays(today, 2), dueTime: '11:00', priority: 'Medium', completed: false },
      { id: uid(), name: 'History Reading', subject: 'History', description: 'Read chapter on independence movement', dueDate: addDays(today, -1), dueTime: '10:00', priority: 'Low', completed: false }
    ];

    const goals = [
      { id: uid(), name: 'Finish Mathematics Chapter 5', deadline: addDays(today, 3), progress: 60, status: 'In Progress' },
      { id: uid(), name: 'Study 2 hours today', deadline: today, progress: 40, status: 'In Progress' },
      { id: uid(), name: 'Complete Science revision', deadline: addDays(today, 1), progress: 85, status: 'In Progress' },
      { id: uid(), name: 'Finish homework before 8 PM', deadline: today, progress: 100, status: 'Completed' }
    ];

    const events = [
      { id: uid(), name: 'Mathematics Homework Due', date: today, time: '16:00', type: 'Homework', description: 'Submit chapter 7 exercises' },
      { id: uid(), name: 'Science Exam', date: addDays(today, 2), time: '09:00', type: 'Exam', description: 'Unit test: photosynthesis & respiration' },
      { id: uid(), name: 'Focused Study Session', date: addDays(today, 1), time: '17:00', type: 'Study', description: 'Pomodoro session — Physics' },
      { id: uid(), name: 'English Essay Submission', date: addDays(today, 3), time: '12:00', type: 'Assignment', description: 'Climate change essay, 800 words' },
      { id: uid(), name: 'Parent-Teacher Meeting', date: addDays(today, 5), time: '14:00', type: 'Other', description: 'Term progress discussion' }
    ];

    const sessions = [
      { id: uid(), date: addDays(today, -6), minutes: 95, subject: 'Mathematics' },
      { id: uid(), date: addDays(today, -5), minutes: 60, subject: 'Science' },
      { id: uid(), date: addDays(today, -4), minutes: 120, subject: 'English' },
      { id: uid(), date: addDays(today, -3), minutes: 45, subject: 'Physics' },
      { id: uid(), date: addDays(today, -2), minutes: 80, subject: 'Chemistry' },
      { id: uid(), date: addDays(today, -1), minutes: 100, subject: 'Mathematics' },
      { id: uid(), date: today, minutes: 50, subject: 'Geography' }
    ];

    const notifications = [
      { id: uid(), text: 'Mathematics homework is due today.', time: '2h ago', read: false, icon: 'bi-journal-text' },
      { id: uid(), text: 'Science exam is tomorrow.', time: '5h ago', read: false, icon: 'bi-mortarboard' },
      { id: uid(), text: 'You completed your study goal.', time: '1d ago', read: true, icon: 'bi-check-circle' },
      { id: uid(), text: 'Congratulations! 12-day streak achieved.', time: '2d ago', read: true, icon: 'bi-fire' }
    ];

    const settings = {
      appearance: 'light',
      language: 'English',
      notifications: { taskReminders: true, examReminders: true, studyReminders: true, dailyMotivation: false }
    };

    const user = { name: 'Nikhil Sharma', email: 'nikhil.sharma@studyflow.app', grade: 'Grade 11', avatar: '' };

    set(KEYS.tasks, tasks);
    set(KEYS.goals, goals);
    set(KEYS.events, events);
    set(KEYS.sessions, sessions);
    set(KEYS.notifications, notifications);
    set(KEYS.settings, settings);
    set(KEYS.user, user);
    set(KEYS.seeded, true);
  }

  /* ---------------- Data accessors ---------------- */
  const Tasks = {
    all: () => get(KEYS.tasks, []),
    save: (list) => set(KEYS.tasks, list),
    add: (task) => { const l = Tasks.all(); l.unshift(task); Tasks.save(l); return task; },
    update: (id, patch) => { const l = Tasks.all().map(t => t.id === id ? { ...t, ...patch } : t); Tasks.save(l); },
    remove: (id) => { Tasks.save(Tasks.all().filter(t => t.id !== id)); },
    toggle: (id) => { const l = Tasks.all().map(t => t.id === id ? { ...t, completed: !t.completed } : t); Tasks.save(l); }
  };

  const Goals = {
    all: () => get(KEYS.goals, []),
    save: (list) => set(KEYS.goals, list),
    add: (g) => { const l = Goals.all(); l.unshift(g); Goals.save(l); return g; },
    update: (id, patch) => { const l = Goals.all().map(g => g.id === id ? { ...g, ...patch } : g); Goals.save(l); },
    remove: (id) => { Goals.save(Goals.all().filter(g => g.id !== id)); }
  };

  const Events = {
    all: () => get(KEYS.events, []),
    save: (list) => set(KEYS.events, list),
    add: (e) => { const l = Events.all(); l.unshift(e); Events.save(l); return e; },
    remove: (id) => { Events.save(Events.all().filter(e => e.id !== id)); },
    onDate: (iso) => Events.all().filter(e => e.date === iso)
  };

  const Sessions = {
    all: () => get(KEYS.sessions, []),
    save: (list) => set(KEYS.sessions, list),
    add: (s) => { const l = Sessions.all(); l.unshift(s); Sessions.save(l); return s; },
    totalMinutesOn: (iso) => Sessions.all().filter(s => s.date === iso).reduce((a, s) => a + s.minutes, 0)
  };

  const Notifications = {
    all: () => get(KEYS.notifications, []),
    save: (list) => set(KEYS.notifications, list),
    unreadCount: () => Notifications.all().filter(n => !n.read).length,
    markRead: (id) => { const l = Notifications.all().map(n => n.id === id ? { ...n, read: true } : n); Notifications.save(l); },
    markAllRead: () => { const l = Notifications.all().map(n => ({ ...n, read: true })); Notifications.save(l); }
  };

  const Settings = {
    get: () => get(KEYS.settings, { appearance: 'light', language: 'English', notifications: {} }),
    save: (s) => set(KEYS.settings, s)
  };

  const User = {
    get: () => get(KEYS.user, { name: 'Student', email: '', grade: '', avatar: '' }),
    save: (u) => set(KEYS.user, u)
  };

  /* ---------------- Streak calculation ---------------- */
  function studyStreak() {
    const sessions = Sessions.all();
    const days = new Set(sessions.map(s => s.date));
    let streak = 0;
    let cursor = todayISO();
    // count backwards from today while a session exists that day
    while (days.has(cursor)) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  function weekDatesMonToSun() {
    const d = new Date();
    const day = d.getDay(); // 0 sun..6 sat
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = addDays(todayISO(), diffToMonday);
    const arr = [];
    for (let i = 0; i < 7; i++) arr.push(addDays(monday, i));
    return arr;
  }

  /* ---------------- Theme ---------------- */
  function applyTheme(mode) {
    let effective = mode;
    if (mode === 'system') {
      effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effective);
  }
  function initTheme() {
    const settings = Settings.get();
    const mode = settings.appearance || 'light';
    applyTheme(mode);
    if (mode === 'system' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme('system'));
    }
  }
  function toggleQuickTheme() {
    const settings = Settings.get();
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    settings.appearance = next;
    Settings.save(settings);
    applyTheme(next);
  }

  /* ---------------- Toast ---------------- */
  function toast(message, icon) {
    let stack = document.querySelector('.sf-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'sf-toast-stack';
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = 'sf-toast';
    el.innerHTML = `<i class="bi ${icon || 'bi-check-circle'}"></i><span>${message}</span>`;
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 2800);
  }

  /* ---------------- App shell templates (sidebar / header) ---------------- */
  const FOX_MARK = `<img src="assets/images/logo-mark.png" alt="StudyFlow fox mascot">`;

  const NAV_ITEMS = [
    { page: 'dashboard', href: 'dashboard.html', icon: 'bi-grid-1x2', label: 'Dashboard' },
    { page: 'tasks', href: 'tasks.html', icon: 'bi-check2-square', label: 'My Tasks' },
    { page: 'calendar', href: 'calendar.html', icon: 'bi-calendar3', label: 'Calendar' },
    { page: 'analytics', href: 'analytics.html', icon: 'bi-bar-chart-line', label: 'Analytics' },
    { page: 'sessions', href: 'dashboard.html#sessions', icon: 'bi-stopwatch', label: 'Study Sessions' },
    { page: 'goals', href: 'dashboard.html#goals', icon: 'bi-flag', label: 'Goals' },
    { page: 'settings', href: 'settings.html', icon: 'bi-gear', label: 'Settings' }
  ];

  function sidebarHTML(activePage) {
    const links = NAV_ITEMS.map(item => `
      <a href="${item.href}" class="sf-nav-link ${item.page === activePage ? 'active' : ''}" data-page="${item.page}">
        <i class="bi ${item.icon}"></i><span>${item.label}</span>
      </a>`).join('');
    return `
      <div class="sf-sidebar-top">
        <a href="dashboard.html" class="sf-logo">
          <span class="sf-logo-mark">${FOX_MARK}</span> StudyFlow
        </a>
      </div>
      <nav class="sf-sidebar-nav">${links}</nav>
      <div class="sf-sidebar-bottom">
        <div class="sf-user-chip" data-sf-user-toggle>
          <div class="sf-avatar" data-sf-user-initials>S</div>
          <div class="flex-grow-1 overflow-hidden">
            <div class="fw-semibold text-truncate" style="font-size:.88rem" data-sf-user-name>Student</div>
            <div class="text-muted-sf text-truncate" style="font-size:.76rem" data-sf-user-email></div>
          </div>
          <i class="bi bi-chevron-expand text-muted-sf"></i>
        </div>
        <button class="btn btn-sf-ghost w-100 mt-2 text-start" data-sf-logout>
          <i class="bi bi-box-arrow-right me-2"></i>Log Out
        </button>
      </div>`;
  }

  function headerHTML(title) {
    return `
      <div class="d-flex align-items-center gap-3">
        <button class="btn-sf-icon d-lg-none" data-sf-sidebar-toggle aria-label="Open menu"><i class="bi bi-list"></i></button>
        <div>
          <h1 class="sf-page-title">${title}</h1>
        </div>
        <div class="sf-header-search ms-lg-4 position-relative d-none d-md-flex">
          <i class="bi bi-search"></i>
          <input type="text" placeholder="Search tasks, subjects, events…" data-sf-search-input>
        </div>
        <div class="sf-search-results" data-sf-search-results></div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <div class="position-relative">
          <button class="btn-sf-icon" data-sf-notif-toggle aria-label="Notifications">
            <i class="bi bi-bell"></i>
            <span class="sf-badge-dot" data-sf-notif-badge></span>
          </button>
          <div class="sf-dropdown-panel" data-sf-notif-panel>
            <div class="sf-dropdown-header">
              <span>Notifications</span>
              <button class="btn btn-sf-ghost btn-sm p-0 px-2" data-sf-mark-all-read style="font-size:.78rem">Mark all read</button>
            </div>
            <div data-sf-notif-list></div>
          </div>
        </div>
        <button class="btn-sf-icon" data-sf-theme-toggle aria-label="Toggle theme"><i class="bi bi-moon-stars"></i></button>
        <div class="position-relative d-none d-sm-block">
          <div class="sf-avatar sf-avatar-sm" style="cursor:pointer" data-sf-user-toggle data-sf-user-initials>S</div>
          <div class="sf-dropdown-panel" data-sf-user-panel style="width:220px;">
            <div class="p-2">
              <a href="settings.html" class="sf-nav-link" style="color:var(--sf-text-soft)"><i class="bi bi-person"></i>Profile</a>
              <a href="settings.html" class="sf-nav-link" style="color:var(--sf-text-soft)"><i class="bi bi-gear"></i>Settings</a>
              <button class="sf-nav-link w-100 text-start border-0 bg-transparent" style="color:var(--sf-danger)" data-sf-logout><i class="bi bi-box-arrow-right"></i>Log Out</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function footerHTML() {
    return `
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <div class="sf-logo" style="font-size:1.05rem"><span class="sf-logo-mark" style="width:30px;height:30px">${FOX_MARK}</span>StudyFlow</div>
          <p class="text-muted-sf small mb-0 mt-1">Plan smarter. Study better. Achieve more.</p>
        </div>
        <div class="d-flex gap-3 flex-wrap small">
          <a href="dashboard.html" class="text-soft-sf">Dashboard</a>
          <a href="tasks.html" class="text-soft-sf">Tasks</a>
          <a href="calendar.html" class="text-soft-sf">Calendar</a>
          <a href="analytics.html" class="text-soft-sf">Analytics</a>
          <a href="settings.html" class="text-soft-sf">Settings</a>
        </div>
      </div>
      <div class="text-center text-muted-sf small mt-3">© 2026 StudyFlow. All rights reserved.</div>`;
  }

  function mountShell() {
    const sidebarSlot = document.querySelector('[data-sf-sidebar-slot]');
    const headerSlot = document.querySelector('[data-sf-header-slot]');
    const footerSlot = document.querySelector('[data-sf-footer-slot]');
    const page = document.body.getAttribute('data-page');
    const title = document.body.getAttribute('data-title') || 'Dashboard';
    if (sidebarSlot) sidebarSlot.innerHTML = sidebarHTML(page);
    if (headerSlot) headerSlot.innerHTML = headerHTML(title);
    if (footerSlot) footerSlot.innerHTML = footerHTML();
  }

  /* ---------------- Sidebar / header wiring ---------------- */
  function initChrome() {
    mountShell();
    // Mobile sidebar toggle
    const openBtn = document.querySelector('[data-sf-sidebar-toggle]');
    const sidebar = document.querySelector('.sf-sidebar');
    const backdrop = document.querySelector('.sf-sidebar-backdrop');
    function closeSidebar() { sidebar?.classList.remove('open'); backdrop?.classList.remove('show'); }
    function openSidebar() { sidebar?.classList.add('open'); backdrop?.classList.add('show'); }
    openBtn?.addEventListener('click', openSidebar);
    backdrop?.addEventListener('click', closeSidebar);
    document.querySelectorAll('.sf-nav-link').forEach(l => l.addEventListener('click', closeSidebar));

    // Theme quick toggle
    function syncThemeIcon() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.querySelectorAll('[data-sf-theme-toggle] i').forEach(i => {
        i.className = isDark ? 'bi bi-sun' : 'bi bi-moon-stars';
      });
    }
    syncThemeIcon();
    document.querySelectorAll('[data-sf-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', () => { toggleQuickTheme(); syncThemeIcon(); });
    });

    // Notifications dropdown
    const notifBtn = document.querySelector('[data-sf-notif-toggle]');
    const notifPanel = document.querySelector('[data-sf-notif-panel]');
    notifBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      renderNotifications();
      notifPanel?.classList.toggle('show');
      document.querySelector('[data-sf-user-panel]')?.classList.remove('show');
    });

    // User dropdown
    const userBtn = document.querySelector('[data-sf-user-toggle]');
    const userPanel = document.querySelector('[data-sf-user-panel]');
    userBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      userPanel?.classList.toggle('show');
      notifPanel?.classList.remove('show');
    });

    document.addEventListener('click', () => {
      notifPanel?.classList.remove('show');
      userPanel?.classList.remove('show');
    });

    document.querySelector('[data-sf-mark-all-read]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      Notifications.markAllRead();
      renderNotifications();
      updateNotifBadge();
    });

    // Logout
    document.querySelectorAll('[data-sf-logout]').forEach(btn => {
      btn.addEventListener('click', () => { window.location.href = 'login.html'; });
    });

    // Search
    const searchInput = document.querySelector('[data-sf-search-input]');
    const searchResults = document.querySelector('[data-sf-search-results]');
    if (searchInput && searchResults) {
      searchInput.addEventListener('input', () => runSearch(searchInput.value, searchResults));
      searchInput.addEventListener('focus', () => { if (searchInput.value) searchResults.classList.add('show'); });
      document.addEventListener('click', (e) => { if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) searchResults.classList.remove('show'); });
    }

    // Populate user chip / avatar initials
    const user = User.get();
    document.querySelectorAll('[data-sf-user-name]').forEach(el => el.textContent = user.name);
    document.querySelectorAll('[data-sf-user-email]').forEach(el => el.textContent = user.email);
    document.querySelectorAll('[data-sf-user-initials]').forEach(el => el.textContent = initials(user.name));

    updateNotifBadge();
    highlightActiveNav();
  }

  function initials(name) {
    if (!name) return 'S';
    return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('');
  }

  function highlightActiveNav() {
    const page = document.body.getAttribute('data-page');
    if (!page) return;
    document.querySelectorAll('.sf-nav-link').forEach(l => {
      if (l.getAttribute('data-page') === page) l.classList.add('active');
      else l.classList.remove('active');
    });
  }

  function updateNotifBadge() {
    const count = Notifications.unreadCount();
    document.querySelectorAll('[data-sf-notif-badge]').forEach(el => {
      el.style.display = count > 0 ? 'block' : 'none';
    });
  }

  function renderNotifications() {
    const panel = document.querySelector('[data-sf-notif-list]');
    if (!panel) return;
    const items = Notifications.all();
    if (!items.length) {
      panel.innerHTML = `<div class="sf-empty py-4"><i class="bi bi-bell-slash"></i>No notifications yet</div>`;
      return;
    }
    panel.innerHTML = items.map(n => `
      <div class="sf-notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
        <div class="sf-notif-icon"><i class="bi ${n.icon || 'bi-bell'}"></i></div>
        <div class="flex-grow-1">
          <div class="sf-notif-text">${escapeHtml(n.text)}</div>
          <div class="sf-notif-time">${n.time}</div>
        </div>
      </div>
    `).join('');
    panel.querySelectorAll('.sf-notif-item').forEach(el => {
      el.addEventListener('click', () => {
        Notifications.markRead(el.getAttribute('data-id'));
        renderNotifications();
        updateNotifBadge();
      });
    });
  }

  function runSearch(query, container) {
    query = (query || '').trim().toLowerCase();
    if (!query) { container.classList.remove('show'); container.innerHTML = ''; return; }
    const results = [];
    Tasks.all().forEach(t => {
      if (t.name.toLowerCase().includes(query) || t.subject.toLowerCase().includes(query)) {
        results.push({ label: t.name, meta: `Task · ${t.subject}`, href: 'tasks.html' });
      }
    });
    Events.all().forEach(e => {
      if (e.name.toLowerCase().includes(query)) {
        results.push({ label: e.name, meta: `Event · ${fmtDate(e.date)}`, href: 'calendar.html' });
      }
    });
    Goals.all().forEach(g => {
      if (g.name.toLowerCase().includes(query)) {
        results.push({ label: g.name, meta: 'Goal', href: 'dashboard.html#goals' });
      }
    });
    [...new Set(Tasks.all().map(t => t.subject))].forEach(s => {
      if (s.toLowerCase().includes(query)) results.push({ label: s, meta: 'Subject', href: 'analytics.html' });
    });

    if (!results.length) {
      container.innerHTML = `<div class="sf-search-item text-muted-sf">No results for "${escapeHtml(query)}"</div>`;
    } else {
      container.innerHTML = results.slice(0, 8).map(r => `
        <a href="${r.href}" class="sf-search-item d-block text-body text-decoration-none">
          <div>${escapeHtml(r.label)}</div><small>${escapeHtml(r.meta)}</small>
        </a>`).join('');
    }
    container.classList.add('show');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    seed();
    initTheme();
    document.addEventListener('DOMContentLoaded', initChrome);
  }

  return {
    KEYS, get, set, uid, todayISO, addDays, fmtDate, escapeHtml,
    Tasks, Goals, Events, Sessions, Notifications, Settings, User,
    studyStreak, weekDatesMonToSun, applyTheme, initTheme, toggleQuickTheme,
    toast, initials, updateNotifBadge, renderNotifications, boot
  };
})();

SF.boot();
