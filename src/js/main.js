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



let currentExpandedMonth = null;
let currentExpandedRow = null;
let floatingCardElement = null;
let floatingOverlay = null;

function initAccordionCalendar() {
  const now = moment();
  const currentMonth = now.toObject().months;
  const currentDate = now.toObject().date;
  
  initMonthColumns(currentMonth);
  initDateRows(currentDate);
  initMonthClickEvents();
  initDateCellEvents();
  initGravityEffect();
}

function initMonthColumns(currentMonth) {
  const allMonthCells = document.querySelectorAll('.month');
  
  allMonthCells.forEach(cell => {
    cell.classList.add('month-col');
    
    const cellMonth = parseInt(cell.dataset.month);
    
    if (cellMonth === currentMonth) {
      cell.classList.add('expanded');
      cell.classList.remove('collapsed');
      currentExpandedMonth = cellMonth;
    } else {
      cell.classList.add('collapsed');
      cell.classList.remove('expanded');
    }
  });
}

function initDateRows(currentDate) {
  const dateRows = document.querySelectorAll('.date-row');
  const rowDateMap = {
    1: [1, 8, 15, 22, 29],
    2: [2, 9, 16, 23, 30],
    3: [3, 10, 17, 24, 31],
    4: [4, 11, 18, 25],
    5: [5, 12, 19, 26],
    6: [6, 13, 20, 27],
    7: [7, 14, 21, 28]
  };
  
  dateRows.forEach(row => {
    const rowDate = parseInt(row.dataset.rowDate);
    const datesInRow = rowDateMap[rowDate] || [];
    const isCurrentRow = datesInRow.includes(currentDate);
    
    if (isCurrentRow) {
      row.classList.add('expanded');
      row.classList.remove('collapsed');
      currentExpandedRow = row;
    } else {
      row.classList.add('collapsed');
      row.classList.remove('expanded');
    }
  });
}

function expandMonth(targetMonth) {
  if (targetMonth === currentExpandedMonth) return;
  
  const allMonthCells = document.querySelectorAll('.month');
  
  allMonthCells.forEach(cell => {
    const cellMonth = parseInt(cell.dataset.month);
    
    if (cellMonth === targetMonth) {
      cell.classList.remove('collapsed');
      cell.classList.add('expanded', 'expanding');
      
      setTimeout(() => {
        cell.classList.remove('expanding');
      }, 500);
    } else if (cellMonth === currentExpandedMonth) {
      cell.classList.remove('expanded');
      cell.classList.add('collapsed', 'collapsing');
      
      setTimeout(() => {
        cell.classList.remove('collapsing');
      }, 400);
    }
  });
  
  currentExpandedMonth = targetMonth;
}

function initMonthClickEvents() {
  const allMonthCells = document.querySelectorAll('.month');
  
  allMonthCells.forEach(cell => {
    cell.style.cursor = 'pointer';
    
    cell.addEventListener('click', function(e) {
      e.stopPropagation();
      const targetMonth = parseInt(this.dataset.month);
      if (!isNaN(targetMonth)) {
        expandMonth(targetMonth);
      }
    });
  });
}

function initDateCellEvents() {
  const dateCells = document.querySelectorAll('.date-cell, .weekday-cell');
  
  dateCells.forEach(cell => {
    cell.addEventListener('click', function(e) {
      e.stopPropagation();
      
      if (this.classList.contains('floating-card')) return;
      
      const row = this.closest('.date-row');
      if (row) {
        expandRow(row);
      }
      
      if (this.classList.contains('date-cell') && this.textContent.trim()) {
        showFloatingCard(this);
      }
    });
  });
}

function expandRow(targetRow) {
  if (targetRow === currentExpandedRow) return;
  
  const dateRows = document.querySelectorAll('.date-row');
  
  dateRows.forEach(row => {
    if (row === targetRow) {
      row.classList.remove('collapsed');
      row.classList.add('expanded');
    } else if (row === currentExpandedRow) {
      row.classList.remove('expanded');
      row.classList.add('collapsed');
    }
  });
  
  currentExpandedRow = targetRow;
}

function showFloatingCard(cell) {
  if (floatingCardElement) {
    hideFloatingCard();
  }
  
  const rect = cell.getBoundingClientRect();
  const date = cell.dataset.date || cell.textContent.trim();
  
  if (!date) return;
  
  floatingOverlay = document.createElement('div');
  floatingOverlay.className = 'floating-overlay';
  document.body.appendChild(floatingOverlay);
  
  floatingCardElement = document.createElement('div');
  floatingCardElement.className = 'floating-card';
  floatingCardElement.innerHTML = `
    <button class="close-btn" onclick="hideFloatingCard()">×</button>
    <div class="card-date">${date}</div>
    <div class="card-info">
      ${moment().date(parseInt(date)).format('dddd, MMMM D, YYYY')}<br>
      <small>点击关闭按钮或旁边区域恢复</small>
    </div>
  `;
  
  const cardWidth = 200;
  const cardHeight = 150;
  const left = Math.max(10, Math.min(window.innerWidth - cardWidth - 20, rect.left - cardWidth / 2 + rect.width / 2));
  const top = Math.max(10, Math.min(window.innerHeight - cardHeight - 20, rect.top - cardHeight / 2));
  
  floatingCardElement.style.left = `${left}px`;
  floatingCardElement.style.top = `${top}px`;
  floatingCardElement.style.width = `${cardWidth}px`;
  floatingCardElement.style.height = `${cardHeight}px`;
  
  document.body.appendChild(floatingCardElement);
  
  floatingOverlay.addEventListener('click', hideFloatingCard);
}

function hideFloatingCard() {
  if (floatingCardElement) {
    floatingCardElement.style.transform = 'scale(0.8)';
    floatingCardElement.style.opacity = '0';
    
    setTimeout(() => {
      if (floatingCardElement && floatingCardElement.parentNode) {
        floatingCardElement.parentNode.removeChild(floatingCardElement);
      }
      floatingCardElement = null;
    }, 300);
  }
  
  if (floatingOverlay) {
    floatingOverlay.style.opacity = '0';
    
    setTimeout(() => {
      if (floatingOverlay && floatingOverlay.parentNode) {
        floatingOverlay.parentNode.removeChild(floatingOverlay);
      }
      floatingOverlay = null;
    }, 300);
  }
}

function initGravityEffect() {
  const table = document.querySelector('.accordion-calendar');
  const allCells = document.querySelectorAll('.date-cell, .weekday-cell, .month');
  
  if (!table) return;
  
  table.addEventListener('mousemove', function(e) {
    const tableRect = this.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    allCells.forEach(cell => {
      const cellRect = cell.getBoundingClientRect();
      const cellCenterX = cellRect.left + cellRect.width / 2;
      const cellCenterY = cellRect.top + cellRect.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(mouseX - cellCenterX, 2) + 
        Math.pow(mouseY - cellCenterY, 2)
      );
      
      cell.classList.remove('gravity-center', 'gravity-near', 'gravity-far', 'gravity-hover');
      
      if (distance < 50) {
        cell.classList.add('gravity-center', 'gravity-hover');
      } else if (distance < 120) {
        cell.classList.add('gravity-near', 'gravity-hover');
      } else if (distance < 200) {
        cell.classList.add('gravity-far', 'gravity-hover');
      }
    });
  });
  
  table.addEventListener('mouseleave', function() {
    allCells.forEach(cell => {
      cell.classList.remove('gravity-center', 'gravity-near', 'gravity-far', 'gravity-hover');
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
  
  setTimeout(() => {
    initAccordionCalendar();
  }, 100);
  
  // Tooltips
  [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(element => {
    new bootstrap.Tooltip(element, {
      customClass: 'd-print-none',
      trigger: 'hover'
    });
  });
});
