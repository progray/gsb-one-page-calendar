/*global moment, bootstrap*/

const SeasonTheme = {
  SPRING: 'spring',
  SUMMER: 'summer',
  AUTUMN: 'autumn',
  WINTER: 'winter'
};

function getSeasonByMonth(month) {
  if (month >= 2 && month <= 4) return SeasonTheme.SPRING;
  if (month >= 5 && month <= 7) return SeasonTheme.SUMMER;
  if (month >= 8 && month <= 10) return SeasonTheme.AUTUMN;
  return SeasonTheme.WINTER;
}

let currentTheme = null;
let smokeAnimation = null;
let smokeParticles = [];

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  currentTheme = theme;
  localStorage.setItem('current-theme', theme);
  
  if (smokeAnimation) {
    updateSmokeColors();
  }
}

function createRipple(event, element) {
  const ripple = document.createElement('div');
  ripple.classList.add('ripple');
  
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  const rippleColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-ripple').trim();
  
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.backgroundColor = rippleColor;
  
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  
  element.appendChild(ripple);
  
  ripple.addEventListener('animationend', () => {
    ripple.remove();
  });
  
  const nearbyCells = getNearbyCells(element, 2);
  nearbyCells.forEach(cell => {
    if (cell !== element) {
      createSubRipple(cell, rippleColor);
    }
  });
}

function createSubRipple(element, color) {
  setTimeout(() => {
    const ripple = document.createElement('div');
    ripple.classList.add('ripple');
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.transform = 'translate(-50%, -50%) scale(0)';
    ripple.style.backgroundColor = color;
    ripple.style.animationDuration = '0.6s';
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    
    element.appendChild(ripple);
    
    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }, 50);
}

function getNearbyCells(element, range) {
  const allCells = Array.from(document.querySelectorAll('#one-page-calendar td'));
  const cellIndex = allCells.indexOf(element);
  
  if (cellIndex === -1) return [element];
  
  const row = Math.floor(cellIndex / 12);
  const col = cellIndex % 12;
  
  const nearbyCells = [element];
  
  allCells.forEach((cell, index) => {
    const cellRow = Math.floor(index / 12);
    const cellCol = index % 12;
    
    const rowDiff = Math.abs(cellRow - row);
    const colDiff = Math.abs(cellCol - col);
    
    if (rowDiff <= range && colDiff <= range && (rowDiff > 0 || colDiff > 0)) {
      nearbyCells.push(cell);
    }
  });
  
  return nearbyCells;
}

function initSmokeCanvas() {
  const canvas = document.getElementById('smoke-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const container = document.getElementById('one-page-calendar-container');
  
  function resizeCanvas() {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    initSmokeParticles();
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateAndDrawSmoke(ctx, canvas.width, canvas.height);
    smokeAnimation = requestAnimationFrame(animate);
  }
  
  animate();
}

function initSmokeParticles() {
  const canvas = document.getElementById('smoke-canvas');
  if (!canvas) return;
  
  smokeParticles = [];
  const particleCount = 8;
  
  for (let i = 0; i < particleCount; i++) {
    smokeParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 150 + 100,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      colorIndex: i % 3,
      opacity: Math.random() * 0.3 + 0.1,
      phase: Math.random() * Math.PI * 2
    });
  }
}

function getSmokeColors() {
  const style = getComputedStyle(document.documentElement);
  return [
    style.getPropertyValue('--theme-smoke-1').trim(),
    style.getPropertyValue('--theme-smoke-2').trim(),
    style.getPropertyValue('--theme-smoke-3').trim()
  ];
}

function updateSmokeColors() {
  const colors = getSmokeColors();
  smokeParticles.forEach((particle, index) => {
    particle.colorIndex = index % 3;
  });
}

function updateAndDrawSmoke(ctx, width, height) {
  const colors = getSmokeColors();
  const time = Date.now() * 0.001;
  
  smokeParticles.forEach(particle => {
    particle.x += particle.speedX;
    particle.y += particle.speedY;
    
    const waveOffset = Math.sin(time + particle.phase) * 0.5;
    particle.x += waveOffset * 0.1;
    particle.y += Math.cos(time + particle.phase) * 0.05;
    
    if (particle.x - particle.radius > width) particle.x = -particle.radius;
    if (particle.x + particle.radius < 0) particle.x = width + particle.radius;
    if (particle.y - particle.radius > height) particle.y = -particle.radius;
    if (particle.y + particle.radius < 0) particle.y = height + particle.radius;
    
    const gradient = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, particle.radius
    );
    
    const color = colors[particle.colorIndex];
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, color.replace(/[\d\.]+\)$/, (match) => {
      const opacity = parseFloat(match) * 0.6;
      return opacity + ')';
    }));
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  });
}

function handleDayClick(event) {
  const dayElement = event.currentTarget;
  const months = dayElement.dataset.months;
  
  if (months) {
    const monthsArray = JSON.parse(months);
    const firstMonth = monthsArray[0];
    const season = getSeasonByMonth(firstMonth);
    applyTheme(season);
  }
  
  createRipple(event, dayElement);
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
  
  // Initialize theme based on current date or saved preference
  const savedTheme = localStorage.getItem('current-theme');
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    const currentMonth = moment().month();
    const currentSeason = getSeasonByMonth(currentMonth);
    applyTheme(currentSeason);
  }
  
  // Add click event listeners to day cells
  function attachDayClickListeners() {
    document.querySelectorAll('.day').forEach(dayElement => {
      dayElement.addEventListener('click', handleDayClick);
    });
  }
  
  attachDayClickListeners();
  
  const originalPopulateCalendar = populateCalendar;
  populateCalendar = function() {
    originalPopulateCalendar();
    attachDayClickListeners();
  };
  
  // Initialize smoke canvas
  setTimeout(() => {
    initSmokeCanvas();
  }, 100);
});
