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

let selectedMonthElement = null;
let selectedDateElement = null;

function getMonthColumnIndex(monthElement) {
  let parent = monthElement.parentElement;
  let siblings = Array.from(parent.children);
  let index = siblings.indexOf(monthElement) + 1;
  return index;
}

function getDateRowIndex(dateElement) {
  let row = dateElement.parentElement;
  let allRows = Array.from(document.querySelectorAll('.days'));
  return allRows.indexOf(row);
}

function highlightMonthColumn(monthElement, isHover) {
  if (!monthElement || !monthElement.dataset.month) return;
  
  let monthIndex = monthElement.dataset.month;
  let dayElements = document.querySelectorAll('.day');
  
  dayElements.forEach(day => {
    if (day.dataset.months) {
      let months = JSON.parse(day.dataset.months);
      if (months.includes(parseInt(monthIndex))) {
        if (isHover) {
          day.classList.add('hover-month');
        } else {
          day.classList.add('selected-month');
        }
      }
    }
  });
}

function highlightDateRow(dateElement, isHover) {
  if (!dateElement) return;
  
  let row = dateElement.parentElement;
  let dayElements = row.querySelectorAll('.day');
  
  dayElements.forEach(day => {
    if (isHover) {
      day.classList.add('hover-date');
    } else {
      day.classList.add('selected-date');
    }
  });
}

function clearMonthHighlight(isHover) {
  let dayElements = document.querySelectorAll('.day');
  dayElements.forEach(day => {
    if (isHover) {
      day.classList.remove('hover-month');
    } else {
      day.classList.remove('selected-month');
    }
  });
}

function clearDateHighlight(isHover) {
  let dayElements = document.querySelectorAll('.day');
  dayElements.forEach(day => {
    if (isHover) {
      day.classList.remove('hover-date');
    } else {
      day.classList.remove('selected-date');
    }
  });
}

function clearIntersectionHighlight() {
  let dayElements = document.querySelectorAll('.day');
  dayElements.forEach(day => {
    day.classList.remove('selected-intersection');
  });
}

function updateHighlights() {
  clearMonthHighlight(false);
  clearDateHighlight(false);
  clearIntersectionHighlight();
  
  if (selectedMonthElement && selectedDateElement) {
    highlightIntersection(selectedMonthElement, selectedDateElement);
  } else {
    if (selectedMonthElement) {
      highlightMonthColumn(selectedMonthElement, false);
    }
    if (selectedDateElement) {
      highlightDateRow(selectedDateElement, false);
    }
  }
}

function highlightIntersection(monthElement, dateElement) {
  if (!monthElement || !dateElement || !monthElement.dataset.month) return;
  
  let monthIndex = monthElement.dataset.month;
  let row = dateElement.parentElement;
  let dayElements = row.querySelectorAll('.day');
  
  dayElements.forEach(day => {
    if (day.dataset.months) {
      let months = JSON.parse(day.dataset.months);
      if (months.includes(parseInt(monthIndex))) {
        day.classList.add('selected-intersection');
      }
    }
  });
}

function getDateElementByDayNumber(dayNumber) {
  let dateCells = document.querySelectorAll('.date');
  for (let cell of dateCells) {
    if (cell.textContent.trim() === String(dayNumber)) {
      return cell;
    }
  }
  return null;
}

function validateDateForMonth(monthIndex, dayNumber) {
  let year = moment().year();
  let testDate = moment({ year: year, month: monthIndex, date: dayNumber });
  let daysInMonth = moment({ year: year, month: monthIndex }).daysInMonth();
  
  if (dayNumber > daysInMonth) {
    return { valid: false, lastDay: daysInMonth };
  }
  return { valid: true, lastDay: daysInMonth };
}

function setupCalendarInteraction() {
  document.querySelectorAll('.month').forEach(month => {
    month.addEventListener('mouseenter', () => {
      if (month.dataset.month !== undefined) {
        highlightMonthColumn(month, true);
      }
    });
    
    month.addEventListener('mouseleave', () => {
      clearMonthHighlight(true);
    });
    
    month.addEventListener('click', (e) => {
      e.preventDefault();
      if (month.dataset.month === undefined) return;
      
      let isNewSelection = selectedMonthElement !== month;
      
      if (selectedMonthElement === month) {
        selectedMonthElement = null;
        month.classList.remove('selected');
      } else {
        if (selectedMonthElement) {
          selectedMonthElement.classList.remove('selected');
        }
        selectedMonthElement = month;
        month.classList.add('selected');
      }
      
      if (isNewSelection && selectedDateElement) {
        let monthIndex = parseInt(month.dataset.month);
        let selectedDay = parseInt(selectedDateElement.textContent.trim());
        let validation = validateDateForMonth(monthIndex, selectedDay);
        
        if (!validation.valid) {
          selectedDateElement.classList.remove('selected');
          let newDateElement = getDateElementByDayNumber(validation.lastDay);
          if (newDateElement) {
            selectedDateElement = newDateElement;
            selectedDateElement.classList.add('selected');
          } else {
            selectedDateElement = null;
          }
        }
      }
      
      updateHighlights();
    });
  });
  
  document.querySelectorAll('.date').forEach(date => {
    date.addEventListener('mouseenter', () => {
      highlightDateRow(date, true);
    });
    
    date.addEventListener('mouseleave', () => {
      clearDateHighlight(true);
    });
    
    date.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (selectedDateElement === date) {
        selectedDateElement = null;
        date.classList.remove('selected');
      } else {
        if (selectedDateElement) {
          selectedDateElement.classList.remove('selected');
        }
        selectedDateElement = date;
        date.classList.add('selected');
      }
      
      updateHighlights();
    });
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
  // Setup calendar interaction
  setupCalendarInteraction();
  // Tooltips
  [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(element => {
    new bootstrap.Tooltip(element, {
      customClass: 'd-print-none',
      trigger: 'hover'
    });
  });
});
