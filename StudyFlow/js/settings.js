/* =========================================================
   StudyFlow — Settings page logic
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Panel switching ---------- */
  document.querySelectorAll('#settingsNav [data-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#settingsNav [data-target]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.settings-panel').forEach(p => p.classList.add('d-none'));
      document.getElementById(btn.getAttribute('data-target')).classList.remove('d-none');
    });
  });

  /* ---------- Profile ---------- */
  const user = SF.User.get();
  document.getElementById('profileName').value = user.name || '';
  document.getElementById('profileEmail').value = user.email || '';
  document.getElementById('profileGrade').value = user.grade || 'Grade 11';
  document.getElementById('profileAvatar').textContent = SF.initials(user.name);
  document.getElementById('profileNamePreview').textContent = user.name || 'Student';

  document.getElementById('profileForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const updated = {
      name: document.getElementById('profileName').value.trim() || 'Student',
      email: document.getElementById('profileEmail').value.trim(),
      grade: document.getElementById('profileGrade').value,
      avatar: ''
    };
    SF.User.save(updated);
    document.getElementById('profileAvatar').textContent = SF.initials(updated.name);
    document.getElementById('profileNamePreview').textContent = updated.name;
    document.querySelectorAll('[data-sf-user-name]').forEach(el => el.textContent = updated.name);
    document.querySelectorAll('[data-sf-user-email]').forEach(el => el.textContent = updated.email);
    document.querySelectorAll('[data-sf-user-initials]').forEach(el => el.textContent = SF.initials(updated.name));
    SF.toast('Profile saved', 'bi-person-check');
  });

  /* ---------- Appearance ---------- */
  const settings = SF.Settings.get();
  function refreshThemeUI() {
    document.querySelectorAll('.sf-theme-option').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-theme-choice') === settings.appearance);
    });
  }
  refreshThemeUI();
  document.querySelectorAll('.sf-theme-option').forEach(el => {
    el.addEventListener('click', () => {
      settings.appearance = el.getAttribute('data-theme-choice');
      SF.Settings.save(settings);
      SF.applyTheme(settings.appearance);
      refreshThemeUI();
      SF.toast('Appearance updated', 'bi-palette');
    });
  });

  /* ---------- Language (50+ languages) ---------- */
  const LANGUAGES = [
    'English', 'Hindi', 'Tamil', 'Malayalam', 'Telugu', 'Kannada', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi',
    'Urdu', 'Odia', 'Assamese', 'Sanskrit', 'Konkani', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech', 'Slovak', 'Hungarian', 'Romanian',
    'Greek', 'Turkish', 'Russian', 'Ukrainian', 'Japanese', 'Korean', 'Chinese (Simplified)', 'Chinese (Traditional)',
    'Arabic', 'Hebrew', 'Persian', 'Thai', 'Vietnamese', 'Indonesian', 'Malay', 'Filipino', 'Swahili', 'Amharic',
    'Zulu', 'Afrikaans', 'Nepali', 'Sinhala', 'Burmese', 'Khmer'
  ];
  const langSelect = document.getElementById('languageSelect');
  langSelect.innerHTML = LANGUAGES.map(l => `<option ${l === settings.language ? 'selected' : ''}>${l}</option>`).join('');
  langSelect.addEventListener('change', () => {
    settings.language = langSelect.value;
    SF.Settings.save(settings);
    SF.toast(`Language set to ${langSelect.value}`, 'bi-translate');
  });

  /* ---------- Notifications ---------- */
  const notif = settings.notifications || {};
  document.getElementById('notifTask').checked = !!notif.taskReminders;
  document.getElementById('notifExam').checked = !!notif.examReminders;
  document.getElementById('notifStudy').checked = !!notif.studyReminders;
  document.getElementById('notifMotivation').checked = !!notif.dailyMotivation;

  function bindToggle(id, key) {
    document.getElementById(id).addEventListener('change', function () {
      const s = SF.Settings.get();
      s.notifications = s.notifications || {};
      s.notifications[key] = this.checked;
      SF.Settings.save(s);
      SF.toast('Notification preferences saved', 'bi-bell');
    });
  }
  bindToggle('notifTask', 'taskReminders');
  bindToggle('notifExam', 'examReminders');
  bindToggle('notifStudy', 'studyReminders');
  bindToggle('notifMotivation', 'dailyMotivation');
});
