/* Car Spa LK admin behaviors */
(function () {
  'use strict';

  /* Saved toast fades out on its own */
  var toast = document.getElementById('adm-toast');
  if (toast) {
    setTimeout(function () { toast.classList.add('hide'); }, 1800);
    setTimeout(function () { toast.remove(); }, 2400);
  }

  /* Top bar profile dropdown */
  var profileToggle = document.getElementById('adm-profile-toggle');
  var profileMenu = document.getElementById('adm-profile-menu');
  if (profileToggle && profileMenu) {
    var closeMenu = function () {
      profileMenu.classList.remove('open');
      profileToggle.setAttribute('aria-expanded', 'false');
    };
    profileToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = profileMenu.classList.toggle('open');
      profileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!profileMenu.contains(e.target) && e.target !== profileToggle) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* Any form or button with data-confirm asks first */
  document.querySelectorAll('form[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.confirm(form.getAttribute('data-confirm'))) e.preventDefault();
    });
  });

  /* Rich editor: contenteditable area synced to a hidden textarea, with
     Visual / HTML tabs. Markup contract:
     .adm-editor > .adm-editor-tabs (buttons with data-editor-tab="visual|html")
                 > .adm-editor-bar (buttons with data-cmd, shown in Visual only)
                 > .adm-editor-area[contenteditable]
                 > textarea.adm-editor-src
     The textarea carries the form field name and the initial value.
     (A legacy [data-src-toggle] button still works if a view has one.) */
  document.querySelectorAll('.adm-editor').forEach(function (editor) {
    var area = editor.querySelector('.adm-editor-area');
    var src = editor.querySelector('.adm-editor-src');
    if (!area || !src) return;

    area.innerHTML = src.value;

    function syncFromArea() { src.value = area.innerHTML; }
    function syncFromSrc() { area.innerHTML = src.value; }

    area.addEventListener('input', syncFromArea);

    editor.querySelectorAll('[data-cmd]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var cmd = btn.getAttribute('data-cmd');
        var val = btn.getAttribute('data-value') || null;
        if (cmd === 'createLink') {
          val = window.prompt('Link URL:', 'https://');
          if (!val) return;
        }
        area.focus();
        document.execCommand(cmd, false, val);
        syncFromArea();
      });
    });

    function setMode(html) {
      if (html) {
        syncFromArea();
        editor.classList.add('src-mode');
      } else {
        syncFromSrc();
        editor.classList.remove('src-mode');
      }
      editor.querySelectorAll('[data-editor-tab]').forEach(function (tab) {
        tab.classList.toggle('active', (tab.getAttribute('data-editor-tab') === 'html') === html);
      });
    }

    editor.querySelectorAll('[data-editor-tab]').forEach(function (tab) {
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        setMode(tab.getAttribute('data-editor-tab') === 'html');
      });
    });

    var toggle = editor.querySelector('[data-src-toggle]');
    if (toggle) {
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        setMode(!editor.classList.contains('src-mode'));
      });
    }

    var form = editor.closest('form');
    if (form) {
      form.addEventListener('submit', function () {
        if (!editor.classList.contains('src-mode')) syncFromArea();
      });
    }
  });
})();
