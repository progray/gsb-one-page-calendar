/*global moment, bootstrap*/

// Custom $(document).ready() function
function ready(fn) {
  if (document.readyState != 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

// Takes the list of days and reoders it depending of the locale's first day
function sortWeekDays(arr, firstDay) {
  let result = {};
  if (firstDay === 0) {
    result = arr.splice(1);
    return result.concat(arr);
  } else if (firstDay === 6) {
    result = arr.splice(2);
    return result.concat(arr);
  } else {
    return arr;
  }
}

// Populates the calendar with the proper days/months order
function populateCalendar() {
  let weekDaysNames = sortWeekDays(moment.weekdaysShort(true), moment.localeData().firstDayOfWeek()),
    monthsNames = moment.monthsShort(),
    now = moment(),
    eod = moment().endOf('day'),
    year = now.year(),
    tempMoment = moment(now),
    count = 0;
  document.querySelectorAll('.days').forEach(element => {
    element.querySelectorAll('.day').forEach(dayElement => {
      dayElement.dataset.day = count;
      count++;
      if (count > 6) {
        count = 0;
      }
    });
    count++;
  });
  let monthsElements = document.querySelectorAll('.months>.month');
  monthsElements.forEach(element => {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  });
  for (var i = 0; i < 12; i++) {
    tempMoment.set({
      'year': year,
      'date': 1,
      'month': i
    });
    let month = document.querySelector('.months > .month:nth-child(' +
      (tempMoment.isoWeekday() + 1) + '):empty');
    month.dataset.month = i;
    month.textContent = monthsNames[i];
    let monthContent = document.createElement('span');
    monthContent.classList.add('badge', 'bg-secondary', 'position-absolute');
    monthContent.appendChild(document.createTextNode(tempMoment.daysInMonth()));
    month.appendChild(monthContent);
    document.querySelectorAll('.days > .day:nth-child(' + (tempMoment.isoWeekday() + 5) + ')').forEach(element => {
      let dayData = element.dataset;
      if (dayData.months === undefined) {
        dayData.months = JSON.stringify([i]);
      } else {
        dayData.months = JSON.stringify(JSON.parse(dayData.months).concat([i]));
      }
    });
  }
  document.getElementById('date').textContent = now.format('LL');
  document.getElementById('year').textContent = year;
  document.getElementById('copyleft-year').textContent = year;
  document.querySelectorAll('.day').forEach(element => {
    element.textContent = weekDaysNames[element.dataset.day];
    element.classList.toggle('table-danger', element.dataset.day == 6);
  });
  document.querySelectorAll('.month').forEach(element => {
    if (element.dataset.month == now.toObject().months)
      element.classList.add('table-active');
  });
  let dateCell = document.evaluate("//td[text()='" + now.toObject().date + "']",
    document, null, XPathResult.ANY_TYPE, null).iterateNext();
  dateCell.classList.add('table-active');
  dateCell.parentNode.querySelectorAll('.day').forEach(element => {
    if (element.dataset.months !== undefined && JSON.parse(element.dataset.months).includes(now.toObject().months))
      element.classList.add('table-active');
  });
  // Setting a timeout to autoupdate calendar 100ms past midnight
  setTimeout(populateCalendar, eod.diff(now) + 100);
}

let verticalPhoneModal;

// Displays a modal suggesting the use of vertical mode on mobile devices
function checkTightSpot() {
  if (window.innerWidth < 468) {
    if (localStorage.getItem('dont-bother-vertical') == null || localStorage.getItem('dont-bother-vertical') == 'false') {
      verticalPhoneModal.show();
    }
  } else if (window.innerWidth < 564) {
    document.getElementById('one-page-calendar').classList.add('table-sm');
  } else {
    let hideModalHandler = () => {
      verticalPhoneModal.hide();
    };
    document.getElementById('vertical-mobile-modal').addEventListener('hidden.bs.modal', hideModalHandler, {
      once: true
    });
    document.getElementById('one-page-calendar').classList.remove('table-sm');
    hideModalHandler();
    document.getElementById('vertical-mobile-modal').removeEventListener('hidden.bs.modal', hideModalHandler);
  }
}

// Find all elements that have any class ending in "-light" or "-dark"
function toggleLightDarkClasses() {
  document.body.querySelectorAll('[class*="-light"], [class*="-dark"]').forEach(el => {
    // get the full className string
    let cls = el.className;
    // regex to replace all "-light" suffixes with "-dark", and "-dark" with "-light"
    cls = cls.replace(/\b([^\s]+?)-(light|dark)\b/g, (match, base, suffix) => {
      return base + (suffix === 'light' ? '-dark' : '-light');
    });
    el.className = cls;
  });
}

// ==================== Note Taking System ====================

const NOTE_STORAGE_KEY = 'one-page-calendar-notes';
const VALID_TAGS = ['red', 'blue', 'green', 'yellow'];

let notesData = {};
let currentEditorCell = null;
let currentEditorTag = 'red';
let currentFilterTag = 'all';
let currentSearchQuery = '';
let highlightedDayElement = null;

function loadNotes() {
  try {
    const stored = localStorage.getItem(NOTE_STORAGE_KEY);
    if (stored) {
      notesData = JSON.parse(stored);
    } else {
      notesData = {};
    }
  } catch (e) {
    notesData = {};
  }
}

function saveNotes() {
  try {
    localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(notesData));
  } catch (e) {
    console.error('Failed to save notes:', e);
  }
}

function getNoteKey(date, dayOfWeek) {
  return `${date.format('YYYY-MM-DD')}-${dayOfWeek}`;
}

function getDateFromCell(dayElement) {
  const row = dayElement.closest('.days');
  const rowIndex = Array.from(document.querySelectorAll('.days')).indexOf(row);
  const baseDate = [1, 2, 3, 4, 5, 6, 7][rowIndex];
  const dayOfWeek = parseInt(dayElement.dataset.day);
  const months = dayElement.dataset.months ? JSON.parse(dayElement.dataset.months) : [];
  
  return {
    baseDate,
    dayOfWeek,
    months,
    rowIndex
  };
}

function getNotesForCell(dayElement) {
  const cellInfo = getDateFromCell(dayElement);
  const cellNotes = [];
  
  for (const key in notesData) {
    const note = notesData[key];
    if (note.cellRowIndex === cellInfo.rowIndex && 
        note.dayOfWeek === cellInfo.dayOfWeek) {
      cellNotes.push({ key, ...note });
    }
  }
  
  return cellNotes.sort((a, b) => b.createdAt - a.createdAt);
}

function updateNoteIndicators() {
  document.querySelectorAll('.day').forEach(dayElement => {
    const existingIndicator = dayElement.querySelector('.note-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    const cellNotes = getNotesForCell(dayElement);
    if (cellNotes.length > 0) {
      const latestNote = cellNotes[0];
      const indicator = document.createElement('span');
      indicator.className = `note-indicator note-indicator-${latestNote.tag}`;
      indicator.title = `有 ${cellNotes.length} 条笔记`;
      dayElement.appendChild(indicator);
    }
  });
}

function renderSidebar() {
  const notesList = document.getElementById('notes-list');
  if (!notesList) return;
  
  let filteredNotes = Object.entries(notesData).map(([key, note]) => ({
    key,
    ...note
  }));
  
  if (currentFilterTag !== 'all') {
    filteredNotes = filteredNotes.filter(note => note.tag === currentFilterTag);
  }
  
  if (currentSearchQuery.trim()) {
    const query = currentSearchQuery.toLowerCase().trim();
    filteredNotes = filteredNotes.filter(note => 
      note.content.toLowerCase().includes(query) ||
      note.dateStr.toLowerCase().includes(query)
    );
  }
  
  filteredNotes.sort((a, b) => b.createdAt - a.createdAt);
  
  if (filteredNotes.length === 0) {
    notesList.innerHTML = `
      <div class="notes-empty">
        <i class="bi bi-journal-x mb-2" style="font-size: 2rem;"></i>
        <p>暂无笔记</p>
      </div>
    `;
    return;
  }
  
  notesList.innerHTML = filteredNotes.map(note => {
    const preview = note.content.length > 50 
      ? note.content.substring(0, 50) + '...' 
      : note.content;
    
    return `
      <div class="note-item" data-note-key="${note.key}" data-cell-row="${note.cellRowIndex}" data-day-of-week="${note.dayOfWeek}">
        <div class="note-date">
          <span class="note-item-tag note-tag-${note.tag}"></span>
          ${note.dateStr}
        </div>
        <div class="note-preview">${escapeHtml(preview)}</div>
      </div>
    `;
  }).join('');
  
  notesList.querySelectorAll('.note-item').forEach(item => {
    item.addEventListener('click', () => {
      const noteKey = item.dataset.noteKey;
      const cellRowIndex = parseInt(item.dataset.cellRow);
      const dayOfWeek = parseInt(item.dataset.dayOfWeek);
      highlightDayCell(cellRowIndex, dayOfWeek, noteKey);
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightDayCell(cellRowIndex, dayOfWeek, noteKey) {
  const rows = document.querySelectorAll('.days');
  const targetRow = rows[cellRowIndex];
  if (!targetRow) return;
  
  const dayCells = targetRow.querySelectorAll('.day');
  let targetCell = null;
  
  for (const cell of dayCells) {
    if (parseInt(cell.dataset.day) === dayOfWeek) {
      targetCell = cell;
      break;
    }
  }
  
  if (!targetCell) return;
  
  if (highlightedDayElement) {
    highlightedDayElement.classList.remove('highlight-active', 'highlight-pulse');
  }
  
  targetCell.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  
  targetCell.classList.add('highlight-active', 'highlight-pulse');
  highlightedDayElement = targetCell;
  
  setTimeout(() => {
    if (highlightedDayElement === targetCell) {
      targetCell.classList.remove('highlight-pulse');
    }
  }, 1000);
  
  document.querySelectorAll('.note-item').forEach(item => {
    item.classList.toggle('highlighted', item.dataset.noteKey === noteKey);
  });
  
  if (notesData[noteKey]) {
    openNoteEditor(targetCell, noteKey);
  }
}

function openNoteEditor(dayElement, existingNoteKey = null) {
  const editor = document.getElementById('note-editor');
  const textarea = document.getElementById('note-editor-textarea');
  
  if (!editor || !textarea) return;
  
  currentEditorCell = dayElement;
  
  const rect = dayElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let editorLeft = rect.right + 10;
  let editorTop = rect.top;
  
  if (editorLeft + 320 > viewportWidth) {
    editorLeft = rect.left - 330;
    if (editorLeft < 10) {
      editorLeft = 10;
    }
  }
  
  if (editorTop + 250 > viewportHeight) {
    editorTop = viewportHeight - 260;
    if (editorTop < 10) {
      editorTop = 10;
    }
  }
  
  editor.style.left = editorLeft + 'px';
  editor.style.top = editorTop + 'px';
  editor.style.width = '300px';
  editor.style.height = '200px';
  
  if (existingNoteKey && notesData[existingNoteKey]) {
    const note = notesData[existingNoteKey];
    textarea.value = note.content;
    currentEditorTag = note.tag;
    editor.dataset.noteKey = existingNoteKey;
  } else {
    textarea.value = '';
    currentEditorTag = 'red';
    delete editor.dataset.noteKey;
  }
  
  updateTagButtons();
  
  editor.classList.remove('hidden');
  textarea.focus();
  
  updateNoteIndicators();
  renderSidebar();
}

function closeNoteEditor(save = true) {
  const editor = document.getElementById('note-editor');
  const textarea = document.getElementById('note-editor-textarea');
  
  if (!editor || !textarea) return;
  
  if (save && currentEditorCell) {
    const content = textarea.value.trim();
    const existingNoteKey = editor.dataset.noteKey;
    
    if (content || existingNoteKey) {
      const cellInfo = getDateFromCell(currentEditorCell);
      const now = moment();
      
      let dateStr = '';
      let formattedDate = '';
      
      if (cellInfo.months.length > 0) {
        const month = cellInfo.months[0];
        const tempMoment = moment().set({
          year: now.year(),
          month: month,
          date: cellInfo.baseDate
        });
        dateStr = tempMoment.format('YYYY-MM-DD');
        formattedDate = tempMoment.format('LL');
      } else {
        dateStr = now.format('YYYY-MM-DD');
        formattedDate = now.format('LL');
      }
      
      let noteKey;
      if (existingNoteKey) {
        noteKey = existingNoteKey;
      } else {
        noteKey = getNoteKey(now, cellInfo.dayOfWeek) + '-' + Date.now();
      }
      
      if (content) {
        notesData[noteKey] = {
          content: content,
          tag: currentEditorTag,
          createdAt: Date.now(),
          dateStr: formattedDate,
          cellRowIndex: cellInfo.rowIndex,
          dayOfWeek: cellInfo.dayOfWeek
        };
      } else if (existingNoteKey) {
        delete notesData[noteKey];
      }
      
      saveNotes();
    }
  }
  
  editor.classList.add('hidden');
  currentEditorCell = null;
  updateNoteIndicators();
  renderSidebar();
}

function updateTagButtons() {
  document.querySelectorAll('.tag-select-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tag === currentEditorTag);
  });
}

function applyFormat(action) {
  const textarea = document.getElementById('note-editor-textarea');
  if (!textarea) return;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const beforeText = textarea.value.substring(0, start);
  const afterText = textarea.value.substring(end);
  
  let newText = '';
  let newCursorPos = start;
  
  switch (action) {
    case 'bold':
      if (selectedText) {
        newText = beforeText + '**' + selectedText + '**' + afterText;
        newCursorPos = end + 4;
      } else {
        newText = beforeText + '**粗体**' + afterText;
        newCursorPos = start + 2;
      }
      break;
    case 'italic':
      if (selectedText) {
        newText = beforeText + '*' + selectedText + '*' + afterText;
        newCursorPos = end + 2;
      } else {
        newText = beforeText + '*斜体*' + afterText;
        newCursorPos = start + 1;
      }
      break;
    case 'list':
      if (selectedText) {
        const lines = selectedText.split('\n');
        const listLines = lines.map(line => '- ' + line).join('\n');
        newText = beforeText + listLines + afterText;
        newCursorPos = start + listLines.length;
      } else {
        newText = beforeText + '- 列表项' + afterText;
        newCursorPos = start + 2;
      }
      break;
  }
  
  if (newText) {
    textarea.value = newText;
    textarea.focus();
    textarea.setSelectionRange(newCursorPos, newCursorPos);
  }
}

function setupResizableEditor() {
  const editor = document.getElementById('note-editor');
  const resizeHandle = document.getElementById('editor-resize-handle');
  
  if (!editor || !resizeHandle) return;
  
  let isResizing = false;
  let startX, startY, startWidth, startHeight;
  
  resizeHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = editor.offsetWidth;
    startHeight = editor.offsetHeight;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const newWidth = Math.max(280, startWidth + (e.clientX - startX));
    const newHeight = Math.max(180, startHeight + (e.clientY - startY));
    
    editor.style.width = newWidth + 'px';
    editor.style.height = newHeight + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    isResizing = false;
  });
}

function setupSidebarToggle() {
  const sidebarContainer = document.getElementById('sidebar-container');
  const toggleBtn = document.getElementById('sidebar-toggle');
  
  if (!sidebarContainer || !toggleBtn) return;
  
  toggleBtn.addEventListener('click', () => {
    const isOpen = sidebarContainer.classList.contains('sidebar-open');
    sidebarContainer.classList.toggle('sidebar-open', !isOpen);
    sidebarContainer.classList.toggle('sidebar-closed', isOpen);
  });
}

function setupFilterButtons() {
  document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      if (tag === currentFilterTag) return;
      
      document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilterTag = tag;
      renderSidebar();
    });
  });
}

function setupSearchInput() {
  const searchInput = document.getElementById('search-notes');
  if (!searchInput) return;
  
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentSearchQuery = searchInput.value;
      renderSidebar();
    }, 200);
  });
}

function setupEditorEvents() {
  document.querySelectorAll('.editor-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const action = btn.dataset.action;
      applyFormat(action);
    });
  });
  
  document.querySelectorAll('.tag-select-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentEditorTag = btn.dataset.tag;
      updateTagButtons();
    });
  });
  
  document.addEventListener('click', (e) => {
    const editor = document.getElementById('note-editor');
    if (!editor || editor.classList.contains('hidden')) return;
    
    const clickedInsideEditor = editor.contains(e.target);
    const clickedOnDayCell = e.target.closest('.day');
    const clickedOnNoteItem = e.target.closest('.note-item');
    
    if (!clickedInsideEditor && !clickedOnDayCell && !clickedOnNoteItem) {
      closeNoteEditor(true);
    }
  });
}

function setupDayCellClick() {
  document.addEventListener('click', (e) => {
    const dayCell = e.target.closest('.day');
    if (!dayCell) return;
    
    const editor = document.getElementById('note-editor');
    if (editor && !editor.classList.contains('hidden')) {
      const clickedInsideEditor = editor.contains(e.target);
      if (!clickedInsideEditor && dayCell !== currentEditorCell) {
        closeNoteEditor(true);
      }
    }
    
    openNoteEditor(dayCell);
  });
}

// ==================== End Note Taking System ====================



ready(() => {
  try {
    // Dark Mode
    if (localStorage.getItem('dark-mode') === null)
      localStorage.setItem('dark-mode', 'dark');
    else if (localStorage.getItem('dark-mode') === 'light') {
      document.querySelectorAll('[data-bs-theme-value]').forEach(el => el.classList.toggle('d-none'));
      document.documentElement.setAttribute('data-bs-theme', 'light');
      toggleLightDarkClasses();
    }
    document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
      element.addEventListener('click', () => {
        document.documentElement.setAttribute('data-bs-theme', element.getAttribute('data-bs-theme-value'));
        localStorage.setItem('dark-mode', element.getAttribute('data-bs-theme-value'));
        document.querySelectorAll('[data-bs-theme-value]').forEach(el => el.classList.toggle('d-none'));
        toggleLightDarkClasses();
      });
    });
    // Print functionality
    let printModal = new bootstrap.Modal(document.getElementById('print-modal'));
    document.getElementById('launch-print-modal-button').addEventListener('click', () => {
      printModal.show();
    });
    document.getElementById('print-calendar-button').addEventListener('click', () => {
      document.getElementById('print-modal').addEventListener('hidden.bs.modal', () => {
        window.print();
      }, {
        once: true
      });
    });
    // Vertical phone mode warning
    document.getElementById('dont-bother-checkbox').checked = false;
    verticalPhoneModal = new bootstrap.Modal(document.getElementById('vertical-mobile-modal'));
    checkTightSpot();
    window.addEventListener('resize', checkTightSpot);
    document.getElementById('dont-bother-checkbox').addEventListener('change', (event) => {
      localStorage.setItem('dont-bother-vertical', event.target.checked);
    });
    // Main functionality
    moment.locale(window.navigator.language);
    populateCalendar();
    // Tooltips
    try {
      [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(element => {
        new bootstrap.Tooltip(element, {
          customClass: 'd-print-none',
          trigger: 'hover'
        });
      });
    } catch (tooltipError) {
      console.log('Tooltip initialization skipped:', tooltipError);
    }
  } catch (e) {
    console.log('Error during main initialization:', e);
  }
  
  // Note Taking System Initialization
  try {
    loadNotes();
    updateNoteIndicators();
    renderSidebar();
    setupResizableEditor();
    setupSidebarToggle();
    setupFilterButtons();
    setupSearchInput();
    setupEditorEvents();
    setupDayCellClick();
  } catch (e) {
    console.error('Note Taking System initialization error:', e);
  }
});
