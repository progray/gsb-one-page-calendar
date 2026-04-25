/*global moment, bootstrap*/

let currentYear = getYearFromUrl() || moment().year();

function getYearFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const yearParam = urlParams.get('year');
  if (yearParam) {
    const year = parseInt(yearParam, 10);
    if (!isNaN(year) && year > 0 && year < 10000) {
      return year;
    }
  }
  return null;
}

function updateUrlWithYear(year, addToHistory = true) {
  const url = new URL(window.location.href);
  if (year === moment().year()) {
    url.searchParams.delete('year');
  } else {
    url.searchParams.set('year', year);
  }
  const state = { year: year };
  if (addToHistory) {
    window.history.pushState(state, '', url.toString());
  } else {
    window.history.replaceState(state, '', url.toString());
  }
}

function handlePopState(event) {
  let newYear;
  if (event.state && event.state.year !== undefined) {
    const yearFromState = parseInt(event.state.year, 10);
    if (!isNaN(yearFromState) && yearFromState > 0 && yearFromState < 10000) {
      newYear = yearFromState;
    }
  }
  
  if (newYear === undefined) {
    newYear = getYearFromUrl() || moment().year();
  }
  
  if (newYear !== currentYear) {
    currentYear = newYear;
    populateCalendar();
  }
}

function changeYear(year) {
  currentYear = year;
  updateUrlWithYear(year);
  populateCalendar();
}

function incrementYear() {
  changeYear(currentYear + 1);
}

function decrementYear() {
  changeYear(currentYear - 1);
}

function setupYearControls() {
  const prevBtn = document.getElementById('year-prev');
  const nextBtn = document.getElementById('year-next');
  const yearDisplay = document.getElementById('year-display');
  const yearInput = document.getElementById('year-input');

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      decrementYear();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      incrementYear();
    });
  }

  if (yearDisplay && yearInput) {
    yearDisplay.addEventListener('click', () => {
      yearDisplay.classList.add('d-none');
      yearInput.classList.remove('d-none');
      yearInput.value = currentYear;
      yearInput.focus();
      yearInput.select();
    });

    const isValidYearInput = (value) => {
      const year = parseInt(value, 10);
      return !isNaN(year) && year >= 1 && year <= 9999;
    };

    const confirmYearInput = () => {
      const newYear = parseInt(yearInput.value, 10);
      if (isValidYearInput(yearInput.value)) {
        changeYear(newYear);
      }
      yearDisplay.classList.remove('d-none');
      yearInput.classList.add('d-none');
    };

    yearInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmYearInput();
      } else if (e.key === 'Escape') {
        yearDisplay.classList.remove('d-none');
        yearInput.classList.add('d-none');
      } else if (e.key === 'Backspace' || e.key === 'Delete' || 
                 e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
                 e.key === 'Tab' || e.key === 'Home' || e.key === 'End') {
        return;
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x') {
          return;
        }
      } else if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      } else if (yearInput.value.length >= 4 && !yearInput.selectionStart) {
        e.preventDefault();
      }
    });

    yearInput.addEventListener('input', () => {
      let value = yearInput.value.replace(/[^0-9]/g, '');
      if (value.length > 4) {
        value = value.slice(0, 4);
      }
      yearInput.value = value;
    });

    yearInput.addEventListener('blur', confirmYearInput);
  }
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

function clearCalendarData() {
  document.querySelectorAll('.months>.month').forEach(element => {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    delete element.dataset.month;
    element.classList.remove('table-active');
  });

  document.querySelectorAll('.day').forEach(element => {
    delete element.dataset.months;
    element.classList.remove('table-active', 'table-danger');
  });

  document.querySelectorAll('.date').forEach(element => {
    element.classList.remove('table-active');
  });
}

// Populates the calendar with the proper days/months order
function populateCalendar() {
  clearCalendarData();

  const now = moment();
  const year = currentYear;
  const isCurrentYear = (year === now.year());
  const tempMoment = moment();
  let count = 0;

  const weekDaysNames = sortWeekDays(moment.weekdaysShort(true), moment.localeData().firstDayOfWeek());
  const monthsNames = moment.monthsShort();

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

  for (let i = 0; i < 12; i++) {
    tempMoment.set({
      'year': year,
      'date': 1,
      'month': i
    });

    const month = document.querySelector('.months > .month:nth-child(' +
      (tempMoment.isoWeekday() + 1) + '):empty');
    month.dataset.month = i;
    month.textContent = monthsNames[i];
    const monthContent = document.createElement('span');
    monthContent.classList.add('badge', 'bg-secondary', 'position-absolute');
    monthContent.appendChild(document.createTextNode(tempMoment.daysInMonth()));
    month.appendChild(monthContent);

    document.querySelectorAll('.days > .day:nth-child(' + (tempMoment.isoWeekday() + 5) + ')').forEach(element => {
      const dayData = element.dataset;
      if (dayData.months === undefined) {
        dayData.months = JSON.stringify([i]);
      } else {
        dayData.months = JSON.stringify(JSON.parse(dayData.months).concat([i]));
      }
    });
  }

  const dateElement = document.getElementById('date');
  if (dateElement) {
    if (isCurrentYear) {
      dateElement.textContent = now.format('LL');
      dateElement.classList.remove('d-none');
    } else {
      dateElement.classList.add('d-none');
    }
  }
  
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = year;
  }
  
  const yearDisplayElement = document.getElementById('year-display');
  if (yearDisplayElement) {
    yearDisplayElement.textContent = year;
  }
  
  document.getElementById('copyleft-year').textContent = year;

  document.querySelectorAll('.day').forEach(element => {
    element.textContent = weekDaysNames[element.dataset.day];
    element.classList.toggle('table-danger', element.dataset.day == 6);
  });

  if (isCurrentYear) {
    const currentMonth = now.toObject().months;
    document.querySelectorAll('.month').forEach(element => {
      if (parseInt(element.dataset.month, 10) === currentMonth) {
        element.classList.add('table-active');
      }
    });

    const dateCell = document.evaluate("//td[text()='" + now.toObject().date + "']",
      document, null, XPathResult.ANY_TYPE, null).iterateNext();
    if (dateCell) {
      dateCell.classList.add('table-active');
      dateCell.parentNode.querySelectorAll('.day').forEach(element => {
        if (element.dataset.months !== undefined && JSON.parse(element.dataset.months).includes(currentMonth)) {
          element.classList.add('table-active');
        }
      });
    }
  }

  if (isCurrentYear) {
    const eod = moment().endOf('day');
    clearTimeout(window.midnightTimeout);
    window.midnightTimeout = setTimeout(populateCalendar, eod.diff(now) + 100);
  }
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
  window.addEventListener('popstate', handlePopState);
  window.history.replaceState({ year: currentYear }, '', window.location.href);
  setupYearControls();
  populateCalendar();
  // Tooltips
  [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(element => {
    new bootstrap.Tooltip(element, {
      customClass: 'd-print-none',
      trigger: 'hover'
    });
  });
});
