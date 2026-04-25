/*global moment, bootstrap*/

// Custom $(document).ready() function
function ready(fn) {
  if (document.readyState != 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

// Calendar interaction state
let calendarState = {
  selectedType: null, // 'day', 'month', 'date', or null
  selectedElement: null,
  weekInfoModal: null,
  modalOverlay: null
};

// Initialize calendar interaction
function initCalendarInteraction() {
  calendarState.weekInfoModal = document.getElementById('week-info-modal');
  calendarState.modalOverlay = document.getElementById('modal-overlay');
  
  // Bind week cell hover events
  document.querySelectorAll('.day').forEach(dayCell => {
    dayCell.addEventListener('mouseenter', handleDayHover);
    dayCell.addEventListener('mouseleave', handleDayHoverLeave);
    dayCell.addEventListener('click', handleDayClick);
  });

  // Bind month cell events
  document.querySelectorAll('.month').forEach(monthCell => {
    monthCell.addEventListener('click', handleMonthClick);
  });

  // Bind date cell events
  document.querySelectorAll('.date').forEach(dateCell => {
    dateCell.addEventListener('click', handleDateClick);
  });

  // Bind close modal events
  document.getElementById('week-info-close').addEventListener('click', hideWeekInfoModal);
  calendarState.modalOverlay.addEventListener('click', hideWeekInfoModal);
}

// Find month cells by month indices
function findMonthCellsByMonthIndices(monthIndices) {
  const monthCells = [];
  document.querySelectorAll('.month').forEach(monthCell => {
    const cellMonthIndex = parseInt(monthCell.dataset.month);
    if (monthIndices.includes(cellMonthIndex)) {
      monthCells.push(monthCell);
    }
  });
  return monthCells;
}

// Handle week cell hover - cross highlighting
function handleDayHover(event) {
  const dayCell = event.target;
  const dayRow = dayCell.parentNode;
  
  // Highlight the hovered week cell
  dayCell.classList.add('hover-highlight');
  
  // Highlight related month cells (using data-months attribute)
  if (dayCell.dataset.months) {
    const monthIndices = JSON.parse(dayCell.dataset.months);
    const relatedMonthCells = findMonthCellsByMonthIndices(monthIndices);
    relatedMonthCells.forEach(monthCell => {
      monthCell.classList.add('hover-highlight');
    });
  }
  
  // Highlight related date cells (same row)
  const dateCells = dayRow.querySelectorAll('.date');
  dateCells.forEach(dateCell => {
    dateCell.classList.add('hover-highlight');
  });
}

// Handle week cell hover leave - remove cross highlighting
function handleDayHoverLeave(event) {
  const dayCell = event.target;
  const dayRow = dayCell.parentNode;
  
  // Remove highlight from week cell
  dayCell.classList.remove('hover-highlight');
  
  // Remove highlight from related month cells
  if (dayCell.dataset.months) {
    const monthIndices = JSON.parse(dayCell.dataset.months);
    const relatedMonthCells = findMonthCellsByMonthIndices(monthIndices);
    relatedMonthCells.forEach(monthCell => {
      monthCell.classList.remove('hover-highlight');
    });
  }
  
  // Remove highlight from date cells
  const dateCells = dayRow.querySelectorAll('.date');
  dateCells.forEach(dateCell => {
    dateCell.classList.remove('hover-highlight');
  });
}

// Handle week cell click - show info modal
function handleDayClick(event) {
  event.stopPropagation();
  const dayCell = event.target;
  
  // Clear previous selection
  clearAllSelections();
  
  // Set new selection
  calendarState.selectedType = 'day';
  calendarState.selectedElement = dayCell;
  dayCell.classList.add('selected');
  
  // Show week info modal
  showWeekInfoModal(dayCell);
}

// Handle month cell click - select month and pulse related week cells
function handleMonthClick(event) {
  event.stopPropagation();
  const monthCell = event.target;
  
  // Clear previous selection
  clearAllSelections();
  
  // Set new selection
  calendarState.selectedType = 'month';
  calendarState.selectedElement = monthCell;
  monthCell.classList.add('selected');
  
  // Find and highlight related week cells
  const monthIndex = parseInt(monthCell.dataset.month);
  const relatedWeekCells = findWeekCellsByMonth(monthIndex);
  
  // Add selected class to related week cells
  relatedWeekCells.forEach(weekCell => {
    weekCell.classList.add('selected');
  });
  
  // Pulse animation
  pulseWeekCells(relatedWeekCells);
}

// Handle date cell click - select date and pulse related week cell
function handleDateClick(event) {
  event.stopPropagation();
  const dateCell = event.target;
  
  // Clear previous selection
  clearAllSelections();
  
  // Set new selection
  calendarState.selectedType = 'date';
  calendarState.selectedElement = dateCell;
  dateCell.classList.add('selected');
  
  // Find and pulse related week cell
  const dayRow = dateCell.parentNode;
  const relatedWeekCell = findWeekCellByDateRow(dayRow);
  
  if (relatedWeekCell) {
    pulseWeekCells([relatedWeekCell]);
  }
}

// Find week cells that correspond to a given month
function findWeekCellsByMonth(monthIndex) {
  const weekCells = [];
  document.querySelectorAll('.day').forEach(dayCell => {
    if (dayCell.dataset.months) {
      const months = JSON.parse(dayCell.dataset.months);
      if (months.includes(monthIndex)) {
        weekCells.push(dayCell);
      }
    }
  });
  return weekCells;
}

// Find week cell in the same row as a date cell
function findWeekCellByDateRow(dateRow) {
  const dayCells = dateRow.querySelectorAll('.day');
  return dayCells.length > 0 ? dayCells[0] : null;
}

// Pulse week cells with animation
function pulseWeekCells(weekCells) {
  weekCells.forEach(cell => {
    cell.classList.add('pulse-animation');
    setTimeout(() => {
      cell.classList.remove('pulse-animation');
    }, 500);
  });
}

// Clear all selections
function clearAllSelections() {
  // Clear week selections
  document.querySelectorAll('.day.selected').forEach(el => {
    el.classList.remove('selected');
  });
  
  // Clear month selections
  document.querySelectorAll('.month.selected').forEach(el => {
    el.classList.remove('selected');
  });
  
  // Clear date selections
  document.querySelectorAll('.date.selected').forEach(el => {
    el.classList.remove('selected');
  });
  
  // Hide week info modal
  hideWeekInfoModal();
  
  // Reset state
  calendarState.selectedType = null;
  calendarState.selectedElement = null;
}

// Show week info modal
function showWeekInfoModal(dayCell) {
  const dayRow = dayCell.parentNode;
  const dayName = dayCell.textContent;
  const months = dayCell.dataset.months ? JSON.parse(dayCell.dataset.months) : [];
  const datesInRow = Array.from(dayRow.querySelectorAll('.date')).map(d => parseInt(d.textContent));
  
  // Generate all month-date combinations
  const dateCombinations = [];
  const monthsNames = moment.months();
  
  months.forEach(monthIndex => {
    const monthName = monthsNames[monthIndex];
    datesInRow.forEach(date => {
      // Check if date is valid for this month
      const tempMoment = moment();
      tempMoment.set({
        'month': monthIndex,
        'date': 1
      });
      const daysInMonth = tempMoment.daysInMonth();
      
      if (date <= daysInMonth) {
        dateCombinations.push({
          month: monthIndex,
          monthName: monthName,
          date: date
        });
      }
    });
  });
  
  // Sort by month, then date
  dateCombinations.sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month;
    return a.date - b.date;
  });
  
  // Update modal content
  document.getElementById('week-info-title').textContent = dayName + ' - ' + document.getElementById('year').textContent;
  
  const datesList = document.getElementById('week-info-dates');
  datesList.innerHTML = '';
  
  if (dateCombinations.length === 0) {
    const li = document.createElement('li');
    li.textContent = '无相关日期';
    datesList.appendChild(li);
  } else {
    dateCombinations.forEach(combo => {
      const li = document.createElement('li');
      li.textContent = (combo.month + 1) + '月' + combo.date + '日';
      datesList.appendChild(li);
    });
  }
  
  // Position modal in center of screen
  const modal = calendarState.weekInfoModal;
  
  // Get modal dimensions (temporarily show to calculate)
  modal.style.display = 'block';
  modal.style.visibility = 'hidden';
  
  const modalWidth = modal.offsetWidth || 400;
  const modalHeight = modal.offsetHeight || 350;
  
  // Calculate center position
  const left = (window.innerWidth - modalWidth) / 2;
  const top = (window.innerHeight - modalHeight) / 2;
  
  // Reset temporary styles
  modal.style.display = '';
  modal.style.visibility = '';
  
  // Set position
  modal.style.left = left + 'px';
  modal.style.top = top + 'px';
  
  // Show modal with animation
  calendarState.modalOverlay.classList.add('show');
  modal.classList.add('show');
}

// Hide week info modal
function hideWeekInfoModal() {
  if (calendarState.weekInfoModal) {
    calendarState.weekInfoModal.classList.remove('show');
  }
  if (calendarState.modalOverlay) {
    calendarState.modalOverlay.classList.remove('show');
  }
}

// Click outside to clear selection
document.addEventListener('click', (event) => {
  // Check if click is outside calendar elements
  const isCalendarElement = event.target.closest('.month') ||
                           event.target.closest('.day') ||
                           event.target.closest('.date') ||
                           event.target.closest('#week-info-modal');
  
  if (!isCalendarElement && calendarState.selectedType) {
    clearAllSelections();
  }
});

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
  // Calendar interaction
  initCalendarInteraction();
});
