/*global moment, bootstrap*/

const SKINS = ['classic', 'terminal', 'blueprint', 'handwritten', 'dense'];

function getCurrentSkin() {
  return localStorage.getItem('calendar-skin') || 'classic';
}

function setCurrentSkin(skinName) {
  if (!SKINS.includes(skinName)) return;
  localStorage.setItem('calendar-skin', skinName);
  applySkin(skinName);
  updateSkinPreviewActive(skinName);
}

function applySkin(skinName) {
  const html = document.documentElement;
  
  SKINS.forEach(skin => {
    html.classList.remove(`skin-${skin}`);
  });
  
  if (skinName === 'classic') {
    html.removeAttribute('data-skin');
  } else {
    html.setAttribute('data-skin', skinName);
  }
  
  if (skinName === 'handwritten') {
    applyHandwrittenRotations();
  }
}

function applyHandwrittenRotations() {
  const cells = document.querySelectorAll('#one-page-calendar td');
  cells.forEach(cell => {
    const randomRotation = (Math.random() - 0.5) * 4;
    cell.style.setProperty('--rotation', `${randomRotation}deg`);
  });
}

function updateSkinPreviewActive(skinName) {
  document.querySelectorAll('.skin-preview').forEach(preview => {
    const previewSkin = preview.dataset.skin;
    preview.classList.toggle('active', previewSkin === skinName);
  });
}

function toggleSkinPanel() {
  const panel = document.getElementById('skin-panel');
  const computedStyle = window.getComputedStyle(panel);
  const isVisible = computedStyle.display !== 'none';
  panel.style.display = isVisible ? 'none' : 'block';
}

function closeSkinPanelIfOpen(event) {
  const panel = document.getElementById('skin-panel');
  const skinButton = document.getElementById('skin-button');
  
  if (panel.style.display !== 'none' && 
      !panel.contains(event.target) && 
      !skinButton.contains(event.target)) {
    panel.style.display = 'none';
  }
}

function ready(fn) {
  if (document.readyState != 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

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
  
  if (getCurrentSkin() === 'handwritten') {
    applyHandwrittenRotations();
  }
  
  setTimeout(populateCalendar, eod.diff(now) + 100);
}

let verticalPhoneModal;

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

function toggleLightDarkClasses() {
  document.body.querySelectorAll('[class*="-light"], [class*="-dark"]').forEach(el => {
    let cls = el.className;
    cls = cls.replace(/\b([^\s]+?)-(light|dark)\b/g, (match, base, suffix) => {
      return base + (suffix === 'light' ? '-dark' : '-light');
    });
    el.className = cls;
  });
}

ready(() => {
  const currentSkin = getCurrentSkin();
  applySkin(currentSkin);
  updateSkinPreviewActive(currentSkin);
  
  const skinButton = document.getElementById('skin-button');
  if (skinButton) {
    skinButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSkinPanel();
    });
  }
  
  document.querySelectorAll('.skin-preview').forEach(preview => {
    preview.addEventListener('click', () => {
      const skinName = preview.dataset.skin;
      setCurrentSkin(skinName);
    });
  });
  
  document.addEventListener('click', closeSkinPanelIfOpen);
  
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
  document.getElementById('dont-bother-checkbox').checked = false;
  verticalPhoneModal = new bootstrap.Modal(document.getElementById('vertical-mobile-modal'));
  checkTightSpot();
  window.addEventListener('resize', checkTightSpot);
  document.getElementById('dont-bother-checkbox').addEventListener('change', (event) => {
    localStorage.setItem('dont-bother-vertical', event.target.checked);
  });
  moment.locale(window.navigator.language);
  populateCalendar();
  [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(element => {
    new bootstrap.Tooltip(element, {
      customClass: 'd-print-none',
      trigger: 'hover'
    });
  });
});
