/* =========================================================
   StudyFlow — Calendar page logic
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {

  const todayISO = SF.todayISO();
  const todayDate = new Date(todayISO + 'T00:00:00');
  let viewYear = todayDate.getFullYear();
  let viewMonth = todayDate.getMonth(); // 0-indexed
  let selectedDate = todayISO;

  const monthLabel = document.getElementById('calMonthLabel');
  const grid = document.getElementById('calGrid');

  function isoOf(y, m, d) {
    const dt = new Date(y, m, d);
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }

  function renderCalendar() {
    monthLabel.textContent = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    // Monday-first index: 0=Mon..6=Sun
    let startOffset = firstOfMonth.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) {
      const d = daysInPrevMonth - startOffset + i + 1;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({ day: d, iso: isoOf(y, m, d), muted: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, iso: isoOf(viewYear, viewMonth, d), muted: false });
    }
    const remainder = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remainder; i++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({ day: i, iso: isoOf(y, m, i), muted: true });
    }

    grid.innerHTML = cells.map(c => {
      const events = SF.Events.onDate(c.iso);
      const isToday = c.iso === todayISO;
      const isSelected = c.iso === selectedDate;
      const eventsHtml = events.slice(0, 2).map(e => `<div class="sf-cal-event ${e.type.toLowerCase()}">${SF.escapeHtml(e.name)}</div>`).join('');
      const moreHtml = events.length > 2 ? `<div class="sf-cal-more">+${events.length - 2} more</div>` : '';
      return `<div class="sf-cal-cell ${c.muted ? 'muted' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-iso="${c.iso}">
        <div class="sf-cal-date-num">${c.day}</div>
        ${eventsHtml}${moreHtml}
      </div>`;
    }).join('');

    grid.querySelectorAll('.sf-cal-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        selectedDate = cell.getAttribute('data-iso');
        renderCalendar();
        renderSelectedDay();
      });
    });
  }

  function typeColor(type) {
    return {
      Homework: 'var(--sf-primary)', Exam: 'var(--sf-danger)', Study: 'var(--sf-success)',
      Assignment: 'var(--sf-warning)', Other: 'var(--sf-info)'
    }[type] || 'var(--sf-primary)';
  }

  function renderSelectedDay() {
    const label = document.getElementById('selectedDayLabel');
    const wrap = document.getElementById('selectedDayEvents');
    const d = new Date(selectedDate + 'T00:00:00');
    label.textContent = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const events = SF.Events.onDate(selectedDate);
    if (!events.length) {
      wrap.innerHTML = `<div class="sf-empty"><i class="bi bi-calendar-x"></i>No events on this day.</div>`;
      return;
    }
    wrap.innerHTML = events.map(e => `
      <div class="sf-card mb-2" style="box-shadow:none;">
        <div class="sf-card-body py-2 px-3">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="fw-semibold" style="font-size:.9rem">${SF.escapeHtml(e.name)}</div>
              <div class="text-muted-sf small">${e.time ? e.time + ' · ' : ''}${SF.escapeHtml(e.description || '')}</div>
            </div>
            <button class="sf-icon-btn-sm danger" data-del="${e.id}" aria-label="Delete"><i class="bi bi-trash"></i></button>
          </div>
          <span class="sf-status-pill mt-2 d-inline-block" style="background:${typeColor(e.type)}22;color:${typeColor(e.type)}">${e.type}</span>
        </div>
      </div>
    `).join('');

    wrap.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => {
      SF.Events.remove(btn.getAttribute('data-del'));
      renderCalendar(); renderSelectedDay();
      SF.toast('Event removed', 'bi-trash');
    }));
  }

  document.getElementById('prevMonthBtn').addEventListener('click', () => {
    viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });
  document.getElementById('nextMonthBtn').addEventListener('click', () => {
    viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });
  document.getElementById('todayBtn').addEventListener('click', () => {
    viewYear = todayDate.getFullYear(); viewMonth = todayDate.getMonth(); selectedDate = todayISO;
    renderCalendar(); renderSelectedDay();
  });

  document.getElementById('eventDate').value = todayISO;
  document.getElementById('addEventForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('eventName').value.trim();
    const date = document.getElementById('eventDate').value;
    if (!name || !date) return;
    SF.Events.add({
      id: SF.uid(), name, date,
      time: document.getElementById('eventTime').value,
      type: document.getElementById('eventType').value,
      description: document.getElementById('eventDescription').value.trim()
    });
    this.reset();
    document.getElementById('eventDate').value = todayISO;
    bootstrap.Modal.getInstance(document.getElementById('addEventModal'))?.hide();
    selectedDate = date;
    if (date.startsWith(viewYear + '-' + String(viewMonth + 1).padStart(2, '0'))) renderCalendar();
    renderSelectedDay();
    SF.toast('Event added to calendar', 'bi-calendar-check');
  });

  renderCalendar();
  renderSelectedDay();
});
