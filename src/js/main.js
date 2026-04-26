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
    let cls = el.className;
    cls = cls.replace(/\b([^\s]+?)-(light|dark)\b/g, (match, base, suffix) => {
      return base + (suffix === 'light' ? '-dark' : '-light');
    });
    el.className = cls;
  });
}

const MOOD_COLORS = ['', 'gray', 'green', 'orange', 'red'];
const STORAGE_KEY_PREFIX = 'opc_mood_';

function getDateStorageKey(dateNum, year) {
  return STORAGE_KEY_PREFIX + year + '_' + dateNum;
}

function getMoodData(dateNum, year) {
  const key = getDateStorageKey(dateNum, year);
  const stored = localStorage.getItem(key);
  if (stored) {
    return JSON.parse(stored);
  }
  return { moodIndex: 0, isMilestone: false };
}

function saveMoodData(dateNum, year, moodData) {
  const key = getDateStorageKey(dateNum, year);
  localStorage.setItem(key, JSON.stringify(moodData));
}

function clearMoodData(dateNum, year) {
  const key = getDateStorageKey(dateNum, year);
  localStorage.removeItem(key);
}

function applyMoodToElement(element, moodData) {
  element.classList.remove('mood-gray', 'mood-green', 'mood-orange', 'mood-red', 'mood-colored', 'milestone');

  if (moodData.moodIndex > 0 && moodData.moodIndex < MOOD_COLORS.length) {
    const colorClass = 'mood-' + MOOD_COLORS[moodData.moodIndex];
    element.classList.add(colorClass, 'mood-colored');
  }

  if (moodData.isMilestone) {
    element.classList.add('milestone');
  }
}

function triggerFlipAnimation(element) {
  element.classList.remove('flip-animation');
  void element.offsetWidth;
  element.classList.add('flip-animation');

  setTimeout(() => {
    element.classList.remove('flip-animation');
  }, 600);
}

function handleDateCellClick(element, year) {
  const dateNum = parseInt(element.textContent.trim(), 10);
  if (isNaN(dateNum) || dateNum < 1 || dateNum > 31) return;

  let moodData = getMoodData(dateNum, year);

  if (moodData.isMilestone) {
    moodData.isMilestone = false;
    if (moodData.moodIndex === 0) {
      clearMoodData(dateNum, year);
    } else {
      saveMoodData(dateNum, year, moodData);
    }
  } else {
    moodData.moodIndex = (moodData.moodIndex + 1) % MOOD_COLORS.length;
    if (moodData.moodIndex === 0) {
      clearMoodData(dateNum, year);
    } else {
      saveMoodData(dateNum, year, moodData);
    }
  }

  triggerFlipAnimation(element);
  applyMoodToElement(element, getMoodData(dateNum, year));
}

function handleDateCellDoubleClick(element, year) {
  const dateNum = parseInt(element.textContent.trim(), 10);
  if (isNaN(dateNum) || dateNum < 1 || dateNum > 31) return;

  let moodData = getMoodData(dateNum, year);
  moodData.isMilestone = !moodData.isMilestone;

  if (moodData.moodIndex === 0 && !moodData.isMilestone) {
    clearMoodData(dateNum, year);
  } else {
    saveMoodData(dateNum, year, moodData);
  }

  triggerFlipAnimation(element);
  applyMoodToElement(element, moodData);
}

function initMoodCalendar() {
  const year = moment().year();
  const clickDelay = 300;

  document.querySelectorAll('.date').forEach(element => {
    if (element.textContent.trim() === '') return;

    const dateNum = parseInt(element.textContent.trim(), 10);
    if (!isNaN(dateNum) && dateNum >= 1 && dateNum <= 31) {
      const moodData = getMoodData(dateNum, year);
      applyMoodToElement(element, moodData);
    }

    let clickTimer = null;
    element.addEventListener('click', (e) => {
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
        handleDateCellDoubleClick(element, year);
      } else {
        clickTimer = setTimeout(() => {
          clickTimer = null;
          handleDateCellClick(element, year);
        }, clickDelay);
      }
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
  // Mood Calendar
  initMoodCalendar();
  // Tooltips
  [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(element => {
    new bootstrap.Tooltip(element, {
      customClass: 'd-print-none',
      trigger: 'hover'
    });
  });
});
