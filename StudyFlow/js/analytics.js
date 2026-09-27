/* =========================================================
   StudyFlow — Analytics page logic
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {

  const today = SF.todayISO();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(36,31,61,0.06)';
  const textColor = isDark ? '#C9C4E0' : '#77728F';
  Chart.defaults.font.family = "'Inter', sans-serif";

  const sessions = SF.Sessions.all();
  const tasks = SF.Tasks.all();

  /* ---------- Summary numbers ---------- */
  function monthPrefix(iso) { return iso.slice(0, 7); }
  const thisMonth = monthPrefix(today);
  const monthlyMinutes = sessions.filter(s => monthPrefix(s.date) === thisMonth).reduce((a, s) => a + s.minutes, 0);
  document.getElementById('ana-studyTime').textContent = (monthlyMinutes / 60).toFixed(1) + 'h';

  const completedCount = tasks.filter(t => t.completed).length;
  const completionRate = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  document.getElementById('ana-completion').textContent = completionRate + '%';

  const activeDays = new Set(sessions.map(s => s.date)).size || 1;
  const avgProductivity = Math.min(100, Math.round((monthlyMinutes / activeDays) / 90 * 100));
  document.getElementById('ana-productivity').textContent = avgProductivity + '%';

  document.getElementById('ana-streak').textContent = SF.studyStreak() + ' days';

  /* ---------- Weekly study hours ---------- */
  const weekDates = SF.weekDatesMonToSun();
  new Chart(document.getElementById('chartWeekly'), {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: weekDates.map(d => +(SF.Sessions.totalMinutesOn(d) / 60).toFixed(1)),
        backgroundColor: '#8B7CF6', borderRadius: 8, maxBarThickness: 30
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } }, x: { grid: { display: false }, ticks: { color: textColor } } }
    }
  });

  /* ---------- Monthly task completion (last 4 weeks) ---------- */
  const weekBuckets = [];
  for (let i = 3; i >= 0; i--) {
    const start = SF.addDays(today, -7 * i - 6);
    const end = SF.addDays(today, -7 * i);
    const inRange = tasks.filter(t => t.dueDate >= start && t.dueDate <= end);
    const done = inRange.filter(t => t.completed).length;
    weekBuckets.push({ label: `Wk ${4 - i}`, pct: inRange.length ? Math.round((done / inRange.length) * 100) : 0 });
  }
  new Chart(document.getElementById('chartCompletion'), {
    type: 'line',
    data: {
      labels: weekBuckets.map(w => w.label),
      datasets: [{
        data: weekBuckets.map(w => w.pct),
        borderColor: '#6C5CE7', backgroundColor: 'rgba(108,92,231,0.15)',
        fill: true, tension: 0.4, pointBackgroundColor: '#6C5CE7', pointRadius: 4
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100, grid: { color: gridColor }, ticks: { color: textColor, callback: v => v + '%' } }, x: { grid: { display: false }, ticks: { color: textColor } } }
    }
  });

  /* ---------- Subject-wise study time (doughnut) ---------- */
  const subjectMinutes = {};
  sessions.forEach(s => { subjectMinutes[s.subject] = (subjectMinutes[s.subject] || 0) + s.minutes; });
  const subjectLabels = Object.keys(subjectMinutes);
  const palette = ['#6C5CE7', '#8B7CF6', '#A695F5', '#C4B8FA', '#3B82F6', '#22C55E', '#F59E0B'];
  new Chart(document.getElementById('chartSubjects'), {
    type: 'doughnut',
    data: {
      labels: subjectLabels,
      datasets: [{ data: subjectLabels.map(s => +(subjectMinutes[s] / 60).toFixed(1)), backgroundColor: palette, borderWidth: 0 }]
    },
    options: {
      plugins: { legend: { position: 'bottom', labels: { color: textColor, boxWidth: 10, padding: 12 } } },
      cutout: '65%'
    }
  });

  /* ---------- Productivity trend (last 7 sessions) ---------- */
  const trendSessions = sessions.slice().reverse().slice(-7);
  new Chart(document.getElementById('chartTrend'), {
    type: 'line',
    data: {
      labels: trendSessions.map(s => SF.fmtDate(s.date)),
      datasets: [{
        data: trendSessions.map(s => Math.min(100, Math.round(s.minutes / 90 * 100))),
        borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.12)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#22C55E'
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100, grid: { color: gridColor }, ticks: { color: textColor, callback: v => v + '%' } }, x: { grid: { display: false }, ticks: { color: textColor } } }
    }
  });

  /* ---------- Strongest / weakest subjects ---------- */
  const subjectStats = subjectLabels.map(name => {
    const subjTasks = tasks.filter(t => t.subject === name);
    const done = subjTasks.filter(t => t.completed).length;
    const pct = subjTasks.length ? Math.round((done / subjTasks.length) * 100) : Math.round(Math.random() * 40 + 40);
    return { name, pct };
  });
  // Ensure at least a few subjects even if no sessions logged for them yet
  [...new Set(tasks.map(t => t.subject))].forEach(name => {
    if (!subjectStats.find(s => s.name === name)) {
      const subjTasks = tasks.filter(t => t.subject === name);
      const done = subjTasks.filter(t => t.completed).length;
      subjectStats.push({ name, pct: subjTasks.length ? Math.round((done / subjTasks.length) * 100) : 0 });
    }
  });
  subjectStats.sort((a, b) => b.pct - a.pct);

  function renderSubjectList(el, list, colorVar) {
    el.innerHTML = list.map(s => `
      <div class="sf-subject-row">
        <div class="name">${SF.escapeHtml(s.name)}</div>
        <div class="sf-subject-track"><div class="sf-subject-fill" style="width:${s.pct}%;background:${colorVar}"></div></div>
        <div class="pct">${s.pct}%</div>
      </div>
    `).join('') || `<div class="sf-empty py-3"><i class="bi bi-bar-chart"></i>Not enough data yet.</div>`;
  }

  renderSubjectList(document.getElementById('strongSubjects'), subjectStats.slice(0, 3), 'var(--sf-success)');
  renderSubjectList(document.getElementById('weakSubjects'), subjectStats.slice(-3).reverse(), 'var(--sf-warning)');
});
