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
  let result;
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

  // Initialize polarization effect
  initPolarizationEffect();
});

function initPolarizationEffect() {
  const calendarContainer = document.getElementById('one-page-calendar-container');
  const calendar = document.getElementById('one-page-calendar');
  const lightSource = calendarContainer.querySelector('.light-source');
  
  if (!calendarContainer || !calendar || !lightSource) return;

  let isPolarized = false;
  let animationFrameId = null;
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;
  
  // Wrap text content for 3D effect
  wrapTextElements();

  function wrapTextElements() {
    const allCells = calendar.querySelectorAll('td');
    allCells.forEach(cell => {
      const isMonth = cell.classList.contains('month');
      const isDay = cell.classList.contains('day');
      const isDate = cell.classList.contains('date');
      
      if (!isMonth && !isDay && !isDate) return;
      
      const childNodes = Array.from(cell.childNodes);
      const textNodes = childNodes.filter(node => 
        node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''
      );
      
      const className = isMonth ? 'month-text' : (isDay ? 'day-text' : 'date-text');
      
      textNodes.forEach(textNode => {
        const span = document.createElement('span');
        span.className = className;
        span.textContent = textNode.textContent;
        cell.replaceChild(span, textNode);
      });
    });
  }

  function normalizeMousePosition(containerRect, clientX, clientY) {
    return {
      x: (clientX - containerRect.left) / containerRect.width,
      y: (clientY - containerRect.top) / containerRect.height,
      px: clientX - containerRect.left,
      py: clientY - containerRect.top
    };
  }

  function calculateParallaxOffset(normX, normY, intensity = 1) {
    const offsetX = (normX - 0.5) * 20 * intensity;
    const offsetY = (normY - 0.5) * 20 * intensity;
    
    const rotateX = (normY - 0.5) * -8 * intensity;
    const rotateY = (normX - 0.5) * 8 * intensity;
    
    return { offsetX, offsetY, rotateX, rotateY };
  }

  function calculateCellShadow(cellRect, lightPos, containerRect, theme) {
    const cellCenterX = cellRect.left + cellRect.width / 2;
    const cellCenterY = cellRect.top + cellRect.height / 2;
    
    const cellCenterXRel = cellCenterX - containerRect.left;
    const cellCenterYRel = cellCenterY - containerRect.top;
    
    const dx = cellCenterXRel - lightPos.px;
    const dy = cellCenterYRel - lightPos.py;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = Math.sqrt(containerRect.width * containerRect.width + containerRect.height * containerRect.height) / 2;
    
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    
    const nonLinearDistance = Math.pow(normalizedDistance, 0.7);
    
    const minLength = 1;
    const maxLength = 15;
    const shadowLength = minLength + nonLinearDistance * (maxLength - minLength);
    
    const minBlur = 1;
    const maxBlur = 6;
    const blurRadius = minBlur + nonLinearDistance * (maxBlur - minBlur);
    
    const minOpacity = 0.9;
    const maxOpacity = 0.2;
    const opacity = minOpacity - nonLinearDistance * (minOpacity - maxOpacity);
    
    const angle = Math.atan2(dy, dx);
    const shadowOffsetX = Math.cos(angle) * shadowLength;
    const shadowOffsetY = Math.sin(angle) * shadowLength;
    
    let shadowColor;
    if (theme === 'dark') {
      const alpha = Math.floor(opacity * 255).toString(16).padStart(2, '0');
      shadowColor = `#000000${alpha}`;
    } else {
      const grayVal = Math.floor(100 + nonLinearDistance * 100);
      const alpha = Math.floor(opacity * 200).toString(16).padStart(2, '0');
      shadowColor = `#${grayVal.toString(16).padStart(2, '0')}${grayVal.toString(16).padStart(2, '0')}${grayVal.toString(16).padStart(2, '0')}${alpha}`;
    }
    
    let highlightColor;
    if (theme === 'dark') {
      const highlightOpacity = Math.max(0, (1 - nonLinearDistance) * 0.4);
      const alpha = Math.floor(highlightOpacity * 255).toString(16).padStart(2, '0');
      highlightColor = `#ffffff${alpha}`;
    } else {
      const highlightOpacity = Math.max(0, (1 - nonLinearDistance) * 0.25);
      const alpha = Math.floor(highlightOpacity * 255).toString(16).padStart(2, '0');
      highlightColor = `#ffffff${alpha}`;
    }
    
    return {
      shadowOffsetX,
      shadowOffsetY,
      blurRadius,
      opacity,
      shadowColor,
      highlightColor,
      distance: normalizedDistance,
      nonLinearDistance
    };
  }

  function updateLighting() {
    if (!isPolarized) return;
    
    mouseX += (targetMouseX - mouseX) * 0.15;
    mouseY += (targetMouseY - mouseY) * 0.15;
    
    const containerRect = calendarContainer.getBoundingClientRect();
    const lightPos = {
      px: mouseX - containerRect.left,
      py: mouseY - containerRect.top
    };
    const normPos = normalizeMousePosition(containerRect, mouseX, mouseY);
    
    const theme = document.documentElement.getAttribute('data-bs-theme') || 'dark';
    
    const parallax = calculateParallaxOffset(normPos.x, normPos.y, 1);
    calendar.style.transform = `
      rotateX(${parallax.rotateX}deg) 
      rotateY(${parallax.rotateY}deg) 
      translateZ(0px)
    `;
    
    const lightSize = 250 + normPos.x * 100;
    calendar.style.setProperty('--light-size', `${lightSize}px`);
    calendar.style.setProperty('--light-x', `${normPos.x * 100}%`);
    calendar.style.setProperty('--light-y', `${normPos.y * 100}%`);
    
    lightSource.style.left = `${lightPos.px}px`;
    lightSource.style.top = `${lightPos.py}px`;
    
    const allCells = calendar.querySelectorAll('td.month, td.day, td.date');
    
    allCells.forEach(cell => {
      const textSpan = cell.querySelector('.month-text, .day-text, .date-text');
      const badge = cell.querySelector('.badge');
      
      if (!textSpan && !badge) return;
      
      const cellRect = cell.getBoundingClientRect();
      const shadowData = calculateCellShadow(cellRect, { px: lightPos.px, py: lightPos.py }, containerRect, theme);
      
      if (textSpan) {
        const mainTextShadow = `${shadowData.shadowOffsetX}px ${shadowData.shadowOffsetY}px ${shadowData.blurRadius}px ${shadowData.shadowColor}`;
        textSpan.style.textShadow = mainTextShadow;
        
        if (shadowData.highlightColor) {
          const highlightOffsetX = -shadowData.shadowOffsetX * 0.3;
          const highlightOffsetY = -shadowData.shadowOffsetY * 0.3;
          textSpan.style.textShadow += `, ${highlightOffsetX}px ${highlightOffsetY}px 2px ${shadowData.highlightColor}`;
        }
        
        const cellParallax = calculateParallaxOffset(normPos.x, normPos.y, 0.3 + shadowData.nonLinearDistance * 0.4);
        textSpan.style.transform = `
          translateZ(12px)
          translateX(${cellParallax.offsetX * 0.5}px) 
          translateY(${cellParallax.offsetY * 0.5}px)
        `;
      }
      
      if (badge) {
        const badgeShadow = `${shadowData.shadowOffsetX * 0.6}px ${shadowData.shadowOffsetY * 0.6}px ${shadowData.blurRadius * 0.5}px ${shadowData.shadowColor}`;
        badge.style.textShadow = badgeShadow;
        badge.style.boxShadow = `${shadowData.shadowOffsetX * 0.4}px ${shadowData.shadowOffsetY * 0.4}px ${shadowData.blurRadius * 0.3}px ${shadowData.shadowColor}`;
      }
    });
    
    animationFrameId = requestAnimationFrame(updateLighting);
  }

  function enablePolarization() {
    if (isPolarized) return;
    isPolarized = true;
    
    calendarContainer.classList.add('polarized');
    calendar.classList.add('polarized');
    
    animationFrameId = requestAnimationFrame(updateLighting);
  }

  function disablePolarization() {
    isPolarized = false;
    
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    
    calendarContainer.classList.remove('polarized');
    calendar.classList.remove('polarized');
    
    calendar.style.transform = '';
    calendar.style.removeProperty('--light-size');
    calendar.style.removeProperty('--light-x');
    calendar.style.removeProperty('--light-y');
    
    const allCells = calendar.querySelectorAll('td.month, td.day, td.date');
    allCells.forEach(cell => {
      const textSpan = cell.querySelector('.month-text, .day-text, .date-text');
      const badge = cell.querySelector('.badge');
      
      if (textSpan) {
        textSpan.style.textShadow = '';
        textSpan.style.transform = '';
      }
      if (badge) {
        badge.style.textShadow = '';
        badge.style.boxShadow = '';
      }
    });
  }

  calendarContainer.addEventListener('mouseenter', (e) => {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
    mouseX = e.clientX;
    mouseY = e.clientY;
    enablePolarization();
  });

  calendarContainer.addEventListener('mousemove', (e) => {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
  });

  calendarContainer.addEventListener('mouseleave', () => {
    disablePolarization();
  });
}
