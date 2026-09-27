/* =========================================================
   StudyFlow — Dashboard page logic
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {

  const today = SF.todayISO();

  /* ---------- Greeting & date ---------- */
  function renderGreeting() {
    const user = SF.User.get();
    const hour = new Date().getHours();
    const part = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const firstName = (user.name || 'Student').split(' ')[0];
    document.getElementById('greetingText').textContent = `Good ${part}, ${firstName} 👋`;
    document.getElementById('todayDateLabel').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  /* ---------- Stats ---------- */
  function renderStats() {
    const tasks = SF.Tasks.all().filter(t => t.dueDate === today);
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const streak = SF.studyStreak();
    const weekDates = SF.weekDatesMonToSun();
    const weeklyTasks = SF.Tasks.all().filter(t => weekDates.includes(t.dueDate));
    const weeklyCompleted = weeklyTasks.filter(t => t.completed).length;
    const weeklyPct = weeklyTasks.length ? Math.round((weeklyCompleted / weeklyTasks.length) * 100) : 0;

    document.getElementById('statTotalToday').textContent = total;
    document.getElementById('statTotalBar').style.width = (total ? 100 : 0) + '%';

    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statCompletedBar').style.width = (total ? (completed / total) * 100 : 0) + '%';

    document.getElementById('statStreak').textContent = streak + (streak === 1 ? ' day' : ' days');
    document.getElementById('statStreakBar').style.width = Math.min(streak * 10, 100) + '%';

    document.getElementById('statWeekly').textContent = weeklyPct + '%';
    document.getElementById('statWeeklyBar').style.width = weeklyPct + '%';

    document.getElementById('streakBig').textContent = streak + (streak === 1 ? ' Day Streak' : ' Day Streak');
  }

  /* ---------- Today's task list ---------- */
  function priorityClass(p) { return { High: 'sf-priority-high', Medium: 'sf-priority-medium', Low: 'sf-priority-low' }[p] || 'sf-priority-low'; }

  function renderTodayTasks() {
    const list = document.getElementById('todayTaskList');
    const tasks = SF.Tasks.all().filter(t => t.dueDate === today);
    if (!tasks.length) {
      list.innerHTML = `<div class="sf-empty"><i class="bi bi-emoji-smile"></i>No tasks due today — enjoy the calm!</div>`;
      return;
    }
    list.innerHTML = tasks.map(t => `
      <div class="sf-task-row ${t.completed ? 'completed' : ''}" data-id="${t.id}">
        <div class="sf-task-check ${t.completed ? 'checked' : ''}" data-toggle-id="${t.id}">
          ${t.completed ? '<i class="bi bi-check-lg"></i>' : ''}
        </div>
        <div class="flex-grow-1">
          <div class="sf-task-name">${SF.escapeHtml(t.name)}</div>
          <div class="sf-task-meta">
            <span class="sf-subject-pill">${SF.escapeHtml(t.subject)}</span>
            <span class="sf-priority ${priorityClass(t.priority)}">${t.priority}</span>
            ${t.dueTime ? `<span><i class="bi bi-clock"></i> ${t.dueTime}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-toggle-id]').forEach(el => {
      el.addEventListener('click', () => {
        SF.Tasks.toggle(el.getAttribute('data-toggle-id'));
        renderTodayTasks();
        renderStats();
      });
    });
  }

  /* ---------- Streak week row ---------- */
  function renderStreakWeek() {
    const wrap = document.getElementById('streakWeekRow');
    const weekDates = SF.weekDatesMonToSun();
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const sessionDays = new Set(SF.Sessions.all().map(s => s.date));
    wrap.innerHTML = weekDates.map((d, i) => {
      const done = sessionDays.has(d);
      const isToday = d === today;
      return `<div class="sf-week-day">
        <div class="label">${labels[i]}</div>
        <div class="sf-week-dot ${done ? 'done' : ''} ${isToday ? 'today' : ''}">${done ? '<i class="bi bi-check-lg"></i>' : ''}</div>
      </div>`;
    }).join('');
  }

  /* ---------- Weekly chart ---------- */
  function renderWeeklyChart() {
    const ctx = document.getElementById('weeklyChart');
    const weekDates = SF.weekDatesMonToSun();
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = weekDates.map(d => +(SF.Sessions.totalMinutesOn(d) / 60).toFixed(1));
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(36,31,61,0.06)';
    const textColor = isDark ? '#C9C4E0' : '#77728F';

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Study hours',
          data: hours,
          backgroundColor: '#8B7CF6',
          hoverBackgroundColor: '#6C5CE7',
          borderRadius: 8,
          maxBarThickness: 34
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.parsed.y + ' hrs' } } },
        scales: {
          y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
          x: { grid: { display: false }, ticks: { color: textColor } }
        }
      }
    });
  }

  /* ---------- Pomodoro timer ---------- */
  const RING_CIRCUMFERENCE = 2 * Math.PI * 110;
  let timerDuration = 25 * 60;
  let timerRemaining = timerDuration;
  let timerInterval = null;
  let timerRunning = false;

  const timerRing = document.getElementById('timerRing');
  const timerTimeEl = document.getElementById('timerTime');
  const timerStateEl = document.getElementById('timerState');
  const startBtn = document.getElementById('timerStartBtn');
  const pauseBtn = document.getElementById('timerPauseBtn');
  const resetBtn = document.getElementById('timerResetBtn');

  timerRing.style.strokeDasharray = RING_CIRCUMFERENCE;

  function paintTimer() {
    const m = Math.floor(timerRemaining / 60).toString().padStart(2, '0');
    const s = Math.floor(timerRemaining % 60).toString().padStart(2, '0');
    timerTimeEl.textContent = `${m}:${s}`;
    const progress = 1 - timerRemaining / timerDuration;
    timerRing.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
  }

  function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    timerStateEl.textContent = 'Focusing…';
    startBtn.disabled = true; pauseBtn.disabled = false;
    timerInterval = setInterval(() => {
      timerRemaining--;
      paintTimer();
      if (timerRemaining <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        onSessionComplete();
      }
    }, 1000);
  }
  function pauseTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerStateEl.textContent = 'Paused';
    startBtn.disabled = false; pauseBtn.disabled = true;
  }
  function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerRemaining = timerDuration;
    timerStateEl.textContent = 'Focus';
    startBtn.disabled = false; pauseBtn.disabled = true;
    paintTimer();
  }
  function onSessionComplete() {
    timerStateEl.textContent = 'Session complete! 🎉';
    startBtn.disabled = false; pauseBtn.disabled = true;
    SF.Sessions.add({ id: SF.uid(), date: today, minutes: Math.round(timerDuration / 60), subject: 'Focus Session' });
    SF.toast('Study session recorded — nice work!', 'bi-stopwatch');
    renderStats(); renderStreakWeek();
    if (Notification && Notification.permission === 'granted') {
      new Notification('StudyFlow', { body: 'Your study session is complete!' });
    }
  }

  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);

  document.querySelectorAll('.sf-filter-tab[data-duration]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sf-filter-tab[data-duration]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.getAttribute('data-duration');
      const customWrap = document.getElementById('customDurationWrap');
      if (val === 'custom') {
        customWrap.classList.remove('d-none');
      } else {
        customWrap.classList.add('d-none');
        timerDuration = parseInt(val, 10) * 60;
        timerRemaining = timerDuration;
        resetTimer();
      }
    });
  });
  document.getElementById('applyCustomBtn').addEventListener('click', () => {
    const mins = parseInt(document.getElementById('customDuration').value, 10);
    if (mins > 0) { timerDuration = mins * 60; timerRemaining = timerDuration; resetTimer(); }
  });

  if (window.Notification && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }

  /* ---------- Goals ---------- */
  function renderGoals() {
    const wrap = document.getElementById('goalsList');
    const goals = SF.Goals.all();
    if (!goals.length) {
      wrap.innerHTML = `<div class="sf-empty"><i class="bi bi-flag"></i>No goals yet — set one to stay focused.</div>`;
      return;
    }
    wrap.innerHTML = goals.map(g => `
      <div class="col-md-6 col-xl-4">
        <div class="sf-card sf-goal-card h-100">
          <div class="d-flex justify-content-between align-items-start">
            <div class="fw-semibold" style="font-size:.92rem">${SF.escapeHtml(g.name)}</div>
            <div class="d-flex gap-1">
              <button class="sf-icon-btn-sm" data-goal-edit="${g.id}"><i class="bi bi-pencil"></i></button>
              <button class="sf-icon-btn-sm danger" data-goal-delete="${g.id}"><i class="bi bi-trash"></i></button>
            </div>
          </div>
          <div class="sf-goal-progress-track"><div class="sf-goal-progress-fill" style="width:${g.progress}%"></div></div>
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted-sf"><i class="bi bi-calendar-event me-1"></i>${SF.fmtDate(g.deadline)}</small>
            <span class="sf-status-pill ${g.status === 'Completed' ? 'sf-status-completed' : 'sf-status-upcoming'}">${g.status}</span>
          </div>
        </div>
      </div>
    `).join('');

    wrap.querySelectorAll('[data-goal-delete]').forEach(btn => btn.addEventListener('click', () => {
      SF.Goals.remove(btn.getAttribute('data-goal-delete'));
      renderGoals();
      SF.toast('Goal deleted', 'bi-trash');
    }));
    wrap.querySelectorAll('[data-goal-edit]').forEach(btn => btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-goal-edit');
      const g = SF.Goals.all().find(x => x.id === id);
      const newProgress = prompt('Update progress (0-100):', g.progress);
      if (newProgress === null) return;
      const p = Math.max(0, Math.min(100, parseInt(newProgress, 10) || 0));
      SF.Goals.update(id, { progress: p, status: p >= 100 ? 'Completed' : 'In Progress' });
      renderGoals();
    }));
  }

  document.getElementById('addGoalForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('goalName').value.trim();
    const deadline = document.getElementById('goalDeadline').value;
    const progress = Math.max(0, Math.min(100, parseInt(document.getElementById('goalProgress').value, 10) || 0));
    if (!name || !deadline) return;
    SF.Goals.add({ id: SF.uid(), name, deadline, progress, status: progress >= 100 ? 'Completed' : 'In Progress' });
    this.reset();
    bootstrap.Modal.getInstance(document.getElementById('addGoalModal'))?.hide();
    renderGoals();
    SF.toast('Goal created', 'bi-flag');
  });

  /* ---------- Add task modal ---------- */
  document.getElementById('taskDueDate').value = today;
  document.getElementById('addTaskForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('taskName').value.trim();
    if (!name) return;
    SF.Tasks.add({
      id: SF.uid(),
      name,
      subject: document.getElementById('taskSubject').value.trim() || 'General',
      description: document.getElementById('taskDescription').value.trim(),
      dueDate: document.getElementById('taskDueDate').value || today,
      dueTime: document.getElementById('taskDueTime').value,
      priority: document.getElementById('taskPriority').value,
      completed: false
    });
    this.reset();
    document.getElementById('taskDueDate').value = today;
    bootstrap.Modal.getInstance(document.getElementById('addTaskModal'))?.hide();
    renderTodayTasks(); renderStats();
    SF.toast('Task added successfully', 'bi-plus-circle');
  });

  /* ---------- Init ---------- */
  renderGreeting();
  renderStats();
  renderTodayTasks();
  renderStreakWeek();
  renderWeeklyChart();
  renderGoals();
  paintTimer();
});
