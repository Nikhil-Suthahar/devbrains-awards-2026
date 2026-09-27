/* =========================================================
   StudyFlow — Tasks page logic
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {

  const today = SF.todayISO();
  let currentFilter = 'all';

  function priorityClass(p) { return { High: 'sf-priority-high', Medium: 'sf-priority-medium', Low: 'sf-priority-low' }[p] || 'sf-priority-low'; }

  function taskStatus(t) {
    if (t.completed) return { label: 'Completed', cls: 'sf-status-completed' };
    if (t.dueDate < today) return { label: 'Overdue', cls: 'sf-status-overdue' };
    if (t.dueDate === today) return { label: 'Due Today', cls: 'sf-status-upcoming' };
    return { label: 'Upcoming', cls: 'sf-status-upcoming' };
  }

  function filteredTasks() {
    const all = SF.Tasks.all().slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    switch (currentFilter) {
      case 'today': return all.filter(t => t.dueDate === today && !t.completed);
      case 'upcoming': return all.filter(t => t.dueDate > today && !t.completed);
      case 'completed': return all.filter(t => t.completed);
      case 'overdue': return all.filter(t => t.dueDate < today && !t.completed);
      default: return all;
    }
  }

  function render() {
    const wrap = document.getElementById('taskListWrap');
    const tasks = filteredTasks();
    if (!tasks.length) {
      wrap.innerHTML = `<div class="sf-empty"><i class="bi bi-inbox"></i>No tasks here. Add one to get started!</div>`;
      return;
    }
    wrap.innerHTML = tasks.map(t => {
      const status = taskStatus(t);
      return `
      <div class="sf-task-row ${t.completed ? 'completed' : ''}" data-id="${t.id}">
        <div class="sf-task-check ${t.completed ? 'checked' : ''}" data-toggle-id="${t.id}">
          ${t.completed ? '<i class="bi bi-check-lg"></i>' : ''}
        </div>
        <div class="flex-grow-1">
          <div class="sf-task-name">${SF.escapeHtml(t.name)}</div>
          <div class="sf-task-meta">
            <span class="sf-subject-pill">${SF.escapeHtml(t.subject)}</span>
            <span class="sf-priority ${priorityClass(t.priority)}">${t.priority}</span>
            <span class="sf-status-pill ${status.cls}">${status.label}</span>
            <span><i class="bi bi-calendar-event"></i> ${SF.fmtDate(t.dueDate)}${t.dueTime ? ' · ' + t.dueTime : ''}</span>
          </div>
        </div>
        <div class="sf-task-actions">
          <button class="sf-icon-btn-sm" data-edit-id="${t.id}" aria-label="Edit"><i class="bi bi-pencil"></i></button>
          <button class="sf-icon-btn-sm danger" data-delete-id="${t.id}" aria-label="Delete"><i class="bi bi-trash"></i></button>
        </div>
      </div>`;
    }).join('');

    wrap.querySelectorAll('[data-toggle-id]').forEach(el => el.addEventListener('click', () => {
      SF.Tasks.toggle(el.getAttribute('data-toggle-id'));
      render();
    }));
    wrap.querySelectorAll('[data-delete-id]').forEach(el => el.addEventListener('click', () => {
      if (confirm('Delete this task?')) { SF.Tasks.remove(el.getAttribute('data-delete-id')); render(); SF.toast('Task deleted', 'bi-trash'); }
    }));
    wrap.querySelectorAll('[data-edit-id]').forEach(el => el.addEventListener('click', () => openEdit(el.getAttribute('data-edit-id'))));
  }

  document.querySelectorAll('#taskFilters .sf-filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#taskFilters .sf-filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      render();
    });
  });

  function openEdit(id) {
    const t = SF.Tasks.all().find(x => x.id === id);
    if (!t) return;
    document.getElementById('taskModalTitle').textContent = 'Edit Task';
    document.getElementById('taskSubmitBtn').textContent = 'Save Changes';
    document.getElementById('taskEditId').value = t.id;
    document.getElementById('taskName').value = t.name;
    document.getElementById('taskSubject').value = t.subject;
    document.getElementById('taskPriority').value = t.priority;
    document.getElementById('taskDescription').value = t.description || '';
    document.getElementById('taskDueDate').value = t.dueDate;
    document.getElementById('taskDueTime').value = t.dueTime || '';
    new bootstrap.Modal(document.getElementById('addTaskModal')).show();
  }

  document.getElementById('addTaskModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('addTaskForm').reset();
    document.getElementById('taskEditId').value = '';
    document.getElementById('taskModalTitle').textContent = 'Add New Task';
    document.getElementById('taskSubmitBtn').textContent = 'Add Task';
    document.getElementById('taskDueDate').value = today;
  });

  document.getElementById('taskDueDate').value = today;

  document.getElementById('addTaskForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('taskName').value.trim();
    if (!name) return;
    const editId = document.getElementById('taskEditId').value;
    const payload = {
      name,
      subject: document.getElementById('taskSubject').value.trim() || 'General',
      description: document.getElementById('taskDescription').value.trim(),
      dueDate: document.getElementById('taskDueDate').value || today,
      dueTime: document.getElementById('taskDueTime').value,
      priority: document.getElementById('taskPriority').value
    };
    if (editId) {
      SF.Tasks.update(editId, payload);
      SF.toast('Task updated', 'bi-pencil');
    } else {
      SF.Tasks.add({ id: SF.uid(), completed: false, ...payload });
      SF.toast('Task added successfully', 'bi-plus-circle');
    }
    bootstrap.Modal.getInstance(document.getElementById('addTaskModal'))?.hide();
    render();
  });

  render();
});
