/*global moment, bootstrap*/

// 3D Interaction Variables
let isIn3DMode = false;
let longPressTimer = null;
const LONG_PRESS_DURATION = 400; // 400ms
const MAX_TILT_ANGLE = 25; // 25 degrees
let calendarCenterX = 0;
let calendarCenterY = 0;
let currentRotateX = 0;
let currentRotateY = 0;

// Calculate calendar center
function calculateCalendarCenter() {
  const calendar = document.getElementById('one-page-calendar');
  const rect = calendar.getBoundingClientRect();
  calendarCenterX = rect.left + rect.width / 2;
  calendarCenterY = rect.top + rect.height / 2;
}

// Enter 3D Mode
function enter3DMode() {
  if (isIn3DMode) return;
  isIn3DMode = true;
  const calendar = document.getElementById('one-page-calendar');
  calendar.classList.add('in-3d-mode');
  calendar.classList.remove('smooth-transition');
  calculateCalendarCenter();
  currentRotateX = 0;
  currentRotateY = 0;
  document.body.style.cursor = 'grabbing';
}

// Exit 3D Mode with bounce back animation
function exit3DMode() {
  if (!isIn3DMode) return;
  isIn3DMode = false;
  const calendar = document.getElementById('one-page-calendar');
  calendar.classList.remove('in-3d-mode');
  
  // Save current transform for animation
  calendar.style.setProperty('--current-transform', `rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg)`);
  
  // Add smooth transition class
  calendar.classList.add('smooth-transition');
  
  // Reset rotation with elastic animation
  calendar.style.transform = 'rotateX(0deg) rotateY(0deg)';
  
  // Reset shadow
  updateCalendarShadow(0, 0);
  
  document.body.style.cursor = 'default';
  
  // Clean up after animation
  setTimeout(() => {
    calendar.classList.remove('smooth-transition');
    calendar.style.removeProperty('--current-transform');
  }, 600);
  
  currentRotateX = 0;
  currentRotateY = 0;
}

// Update calendar rotation based on mouse position
function updateCalendarRotation(mouseX, mouseY) {
  if (!isIn3DMode) return;
  
  const deltaX = mouseX - calendarCenterX;
  const deltaY = mouseY - calendarCenterY;
  
  const calendar = document.getElementById('one-page-calendar');
  const rect = calendar.getBoundingClientRect();
  
  // Calculate rotation angles proportional to mouse offset
  const rotateY = (deltaX / (rect.width / 2)) * MAX_TILT_ANGLE;
  const rotateX = -(deltaY / (rect.height / 2)) * MAX_TILT_ANGLE;
  
  // Clamp angles to max tilt
  currentRotateX = Math.max(-MAX_TILT_ANGLE, Math.min(MAX_TILT_ANGLE, rotateX));
  currentRotateY = Math.max(-MAX_TILT_ANGLE, Math.min(MAX_TILT_ANGLE, rotateY));
  
  // Apply transform
  calendar.style.transform = `rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg)`;
  
  // Update shadow based on rotation
  updateCalendarShadow(currentRotateX, currentRotateY);
}

// Update calendar shadow based on rotation
function updateCalendarShadow(rotateX, rotateY) {
  const calendar = document.getElementById('one-page-calendar');
  
  // Calculate shadow offset based on rotation
  // When rotateY is positive (right side closer), shadow should be on the left
  // When rotateX is positive (bottom closer), shadow should be on top
  const shadowOffsetX = -rotateY * 1.5;
  const shadowOffsetY = -rotateX * 1.5 + 10;
  const shadowBlur = 30 + Math.abs(rotateX) + Math.abs(rotateY);
  
  calendar.style.boxShadow = `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px rgba(0, 0, 0, ${0.3 + Math.abs(rotateX) / 100 + Math.abs(rotateY) / 100})`;
}

// Extract pure text content (excluding badge for month cells)
function extractCellText(cell) {
  let text = '';
  const clone = cell.cloneNode(true);
  
  // Remove badge elements if any
  const badges = clone.querySelectorAll('.badge');
  badges.forEach(badge => badge.remove());
  
  text = clone.textContent.trim();
  return text || cell.textContent.trim();
}

// Setup cell for flip animation
function setupCellForFlip(cell) {
  // Check if already set up
  if (cell.querySelector('.flipper')) return;
  
  const originalContent = cell.innerHTML;
  const pureText = extractCellText(cell);
  
  // Clear cell and create flipper structure
  cell.innerHTML = '';
  cell.style.perspective = '1000px';
  cell.style.position = 'relative';
  cell.style.overflow = 'visible';
  cell.style.minHeight = cell.offsetHeight + 'px';
  
  const flipper = document.createElement('div');
  flipper.className = 'flipper';
  flipper.style.width = '100%';
  flipper.style.height = '100%';
  flipper.style.position = 'relative';
  flipper.style.transformStyle = 'preserve-3d';
  
  const front = document.createElement('div');
  front.className = 'front';
  front.innerHTML = originalContent;
  front.style.backfaceVisibility = 'hidden';
  front.style.WebkitBackfaceVisibility = 'hidden';
  
  const back = document.createElement('div');
  back.className = 'back';
  back.textContent = pureText;
  back.style.backfaceVisibility = 'hidden';
  back.style.WebkitBackfaceVisibility = 'hidden';
  
  flipper.appendChild(front);
  flipper.appendChild(back);
  cell.appendChild(flipper);
  
  // Store reference
  cell.dataset.flipperSetUp = 'true';
}

// Toggle cell flip
function toggleCellFlip(cell) {
  setupCellForFlip(cell);
  
  const flipper = cell.querySelector('.flipper');
  
  if (flipper.classList.contains('flipped')) {
    // Flip back to front
    flipper.classList.remove('flipped');
    cell.classList.remove('glowing');
  } else {
    // Flip to back - add glow effect and flip
    cell.classList.add('glowing');
    
    // Flip immediately (glow effect starts immediately)
    flipper.classList.add('flipped');
  }
}

// Long press handlers
function startLongPressTimer(e) {
  if (longPressTimer) clearTimeout(longPressTimer);
  
  longPressTimer = setTimeout(() => {
    enter3DMode();
  }, LONG_PRESS_DURATION);
}

function cancelLongPressTimer() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

// Mouse move handler for 3D rotation
function handleMouseMove(e) {
  if (isIn3DMode) {
    updateCalendarRotation(e.clientX, e.clientY);
  }
}

// Mouse up handler
function handleMouseUp(e) {
  if (longPressTimer) {
    cancelLongPressTimer();
    // If it was a short press (click), check if clicked on a cell
    const cell = e.target.closest('.month, .day, .date');
    if (cell && !isIn3DMode) {
      toggleCellFlip(cell);
    }
  }
  
  if (isIn3DMode) {
    exit3DMode();
  }
}

// Touch handlers for mobile
function handleTouchStart(e) {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    startLongPressTimer({ clientX: touch.clientX, clientY: touch.clientY });
  }
}

function handleTouchMove(e) {
  if (isIn3DMode && e.touches.length === 1) {
    const touch = e.touches[0];
    updateCalendarRotation(touch.clientX, touch.clientY);
  } else if (!isIn3DMode) {
    // Cancel long press if touch moves
    cancelLongPressTimer();
  }
}

function handleTouchEnd(e) {
  handleMouseUp({});
}

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



ready(() => {
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
  [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(element => {
    new bootstrap.Tooltip(element, {
      customClass: 'd-print-none',
      trigger: 'hover'
    });
  });
  
  // 3D Interaction Event Listeners
  const calendarContainer = document.getElementById('one-page-calendar-container');
  const calendar = document.getElementById('one-page-calendar');
  
  // Mouse events for 3D mode
  calendarContainer.addEventListener('mousedown', (e) => {
    // Only trigger 3D mode if clicking on calendar area, not on buttons
    if (e.target.closest('#one-page-calendar')) {
      startLongPressTimer(e);
    }
  });
  
  document.addEventListener('mousemove', (e) => {
    handleMouseMove(e);
    
    // Cancel long press if mouse moves too much before 400ms
    if (!isIn3DMode && longPressTimer) {
      cancelLongPressTimer();
    }
  });
  
  document.addEventListener('mouseup', handleMouseUp);
  
  // Prevent context menu on long press
  calendarContainer.addEventListener('contextmenu', (e) => {
    if (isIn3DMode || longPressTimer) {
      e.preventDefault();
    }
  });
  
  // Touch events for mobile
  calendarContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: true });
  document.addEventListener('touchend', handleTouchEnd);
  
  // Recalculate center on resize
  window.addEventListener('resize', () => {
    if (isIn3DMode) {
      calculateCalendarCenter();
    }
  });
});
