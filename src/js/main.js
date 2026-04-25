/*global moment, bootstrap*/

// ==================== 农历转换模块 ====================

const Lunar = {
  lunarInfo: [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0
  ],
  
  lunarMonthNames: ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'],
  lunarDayNames: ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'],
  
  tianGan: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
  diZhi: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'],
  shengXiao: ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'],
  
  jieQiNames: ['小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
    '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑',
    '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'],
  
  jieQiData: {
    0: [6, 20], 1: [4, 19], 2: [5, 20], 3: [5, 20],
    4: [5, 21], 5: [5, 21], 6: [5, 21], 7: [7, 23],
    8: [7, 22], 9: [7, 22], 10: [7, 22], 11: [7, 22],
    12: [8, 23], 13: [8, 23], 14: [8, 23], 15: [8, 23],
    16: [8, 23], 17: [8, 23], 18: [8, 24], 19: [8, 24],
    20: [8, 24], 21: [8, 24], 22: [8, 24], 23: [8, 24]
  },
  
  getLeapMonth: function(year) {
    return this.lunarInfo[year - 1900] & 0xf;
  },
  
  getLeapMonthDays: function(year) {
    if (this.getLeapMonth(year)) {
      return (this.lunarInfo[year - 1900] & 0x10000) ? 30 : 29;
    }
    return 0;
  },
  
  getLunarMonthDays: function(year, month) {
    return (this.lunarInfo[year - 1900] & (0x10000 >> month)) ? 30 : 29;
  },
  
  getLunarYearDays: function(year) {
    let sum = 348;
    for (let i = 0x8000; i > 0x8; i >>= 1) {
      sum += (this.lunarInfo[year - 1900] & i) ? 1 : 0;
    }
    return sum + this.getLeapMonthDays(year);
  },
  
  solarToLunar: function(year, month, day) {
    const baseDate = new Date(1900, 0, 31);
    const currentDate = new Date(year, month - 1, day);
    let offset = Math.floor((currentDate - baseDate) / 86400000);
    
    let lunarYear = 1900;
    let lunarMonth = 1;
    let lunarDay = 1;
    let isLeap = false;
    
    while (lunarYear < 2101 && offset > 0) {
      const daysOfYear = this.getLunarYearDays(lunarYear);
      if (offset < daysOfYear) break;
      offset -= daysOfYear;
      lunarYear++;
    }
    
    const leapMonth = this.getLeapMonth(lunarYear);
    let isLeapMonth = false;
    
    while (lunarMonth < 13 && offset > 0) {
      let days;
      if (leapMonth > 0 && lunarMonth === leapMonth + 1 && !isLeapMonth) {
        lunarMonth--;
        isLeapMonth = true;
        days = this.getLeapMonthDays(lunarYear);
      } else {
        days = this.getLunarMonthDays(lunarYear, lunarMonth);
      }
      
      if (isLeapMonth && lunarMonth === leapMonth + 1) {
        isLeapMonth = false;
      }
      
      if (offset < days) break;
      offset -= days;
      lunarMonth++;
    }
    
    lunarDay = offset + 1;
    isLeap = isLeapMonth;
    
    return {
      year: lunarYear,
      month: lunarMonth,
      day: lunarDay,
      isLeap: isLeap,
      yearStr: this.getYearGanZhi(lunarYear),
      shengXiao: this.getShengXiao(lunarYear),
      monthStr: (isLeap ? '闰' : '') + this.lunarMonthNames[lunarMonth - 1] + '月',
      dayStr: this.lunarDayNames[lunarDay - 1]
    };
  },
  
  getYearGanZhi: function(year) {
    return this.tianGan[(year - 4) % 10] + this.diZhi[(year - 4) % 12];
  },
  
  getShengXiao: function(year) {
    return this.shengXiao[(year - 4) % 12];
  },
  
  getDayGanZhi: function(year, month, day) {
    const baseDate = new Date(1900, 0, 1);
    const currentDate = new Date(year, month - 1, day);
    const offset = Math.floor((currentDate - baseDate) / 86400000);
    return this.tianGan[(offset + 9) % 10] + this.diZhi[(offset + 1) % 12];
  },
  
  getJieQi: function(year, month, day) {
    const monthIndex = month - 1;
    const jieQiMonth = monthIndex * 2;
    
    const jieQi1Day = this.jieQiData[jieQiMonth][year % 4 === 0 ? 1 : 0];
    if (day === jieQi1Day) {
      return this.jieQiNames[jieQiMonth];
    }
    
    const jieQi2Day = this.jieQiData[jieQiMonth + 1][year % 4 === 0 ? 1 : 0];
    if (day === jieQi2Day) {
      return this.jieQiNames[jieQiMonth + 1];
    }
    
    return null;
  },
  
  getMonthJieQiList: function(year, month) {
    const monthIndex = month - 1;
    const jieQiMonth = monthIndex * 2;
    const isLeap = year % 4 === 0;
    
    return [
      { name: this.jieQiNames[jieQiMonth], day: this.jieQiData[jieQiMonth][isLeap ? 1 : 0], type: '节气' },
      { name: this.jieQiNames[jieQiMonth + 1], day: this.jieQiData[jieQiMonth + 1][isLeap ? 1 : 0], type: '节气' }
    ];
  },
  
  festivals: {
    '1-1': { name: '春节', lunar: true },
    '1-15': { name: '元宵', lunar: true },
    '5-5': { name: '端午', lunar: true },
    '7-7': { name: '七夕', lunar: true },
    '8-15': { name: '中秋', lunar: true },
    '9-9': { name: '重阳', lunar: true },
    '12-30': { name: '除夕', lunar: true }
  },
  
  getFestival: function(lunarMonth, lunarDay) {
    const key = lunarMonth + '-' + lunarDay;
    if (this.festivals[key]) {
      return this.festivals[key].name;
    }
    return null;
  },
  
  getDateInfo: function(year, month, day) {
    const lunar = this.solarToLunar(year, month, day);
    const jieQi = this.getJieQi(year, month, day);
    const festival = this.getFestival(lunar.month, lunar.day);
    const dayGanZhi = this.getDayGanZhi(year, month, day);
    
    return {
      solar: { year, month, day },
      lunar: lunar,
      jieQi: jieQi,
      festival: festival,
      dayGanZhi: dayGanZhi,
      yearGanZhi: lunar.yearStr,
      shengXiao: lunar.shengXiao
    };
  }
};

let selectedMonth = null;

// ==================== 农历功能辅助函数 ====================

function getMonthDays(year, month) {
  const date = moment({ year, month, date: 1 });
  const daysInMonth = date.daysInMonth();
  const startWeekday = date.isoWeekday();
  const days = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const weekday = (startWeekday + day - 2) % 7;
    days.push({
      day: day,
      weekday: weekday,
      dateInfo: Lunar.getDateInfo(year, month + 1, day)
    });
  }
  return days;
}

function getMonthFestivals(year, month) {
  const festivals = [];
  const daysInMonth = moment({ year, month }).daysInMonth();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateInfo = Lunar.getDateInfo(year, month + 1, day);
    if (dateInfo.festival) {
      festivals.push({
        name: dateInfo.festival,
        day: day,
        type: '节日'
      });
    }
  }
  return festivals;
}

function updateLunarDateDisplay(year, month) {
  const lunarDateEl = document.getElementById('lunar-date');
  
  if (selectedMonth !== null) {
    const firstDayInfo = Lunar.getDateInfo(year, month + 1, 1);
    lunarDateEl.textContent = firstDayInfo.yearGanZhi + '年 ' + firstDayInfo.lunar.monthStr;
    lunarDateEl.style.display = 'block';
  } else {
    lunarDateEl.style.display = 'none';
  }
}

function findDateCell(day) {
  const dateCells = document.querySelectorAll('.date');
  for (let cell of dateCells) {
    if (parseInt(cell.textContent) === day) {
      return cell;
    }
  }
  return null;
}

function findDayCellInRow(row, weekday, months) {
  const dayCells = row.querySelectorAll('.day');
  for (let cell of dayCells) {
    const cellMonths = cell.dataset.months ? JSON.parse(cell.dataset.months) : [];
    const cellWeekday = parseInt(cell.dataset.day);
    
    if (cellWeekday === weekday && months.some(m => cellMonths.includes(m))) {
      return cell;
    }
  }
  return null;
}

function clearLunarDisplay() {
  document.querySelectorAll('.lunar-info, .jieqi-text, .festival-badge').forEach(el => {
    el.classList.add('lunar-fade-out');
    setTimeout(() => el.remove(), 300);
  });
  
  document.querySelectorAll('.month-selected').forEach(el => {
    el.classList.remove('month-selected');
  });
  
  document.querySelectorAll('.lunar-fade-in').forEach(el => {
    el.classList.remove('lunar-fade-in');
  });
  
  document.querySelectorAll('.lunar-cell').forEach(el => {
    el.classList.remove('lunar-cell');
    el.style.cursor = '';
    el.style.position = '';
    el.removeAttribute('data-solar-year');
    el.removeAttribute('data-solar-month');
    el.removeAttribute('data-solar-day');
    el.removeAttribute('data-lunar-year');
    el.removeAttribute('data-lunar-month');
    el.removeAttribute('data-lunar-day');
    el.removeAttribute('data-gan-zhi');
    el.removeAttribute('data-sheng-xiao');
    el.removeAttribute('data-jie-qi');
    el.removeAttribute('data-festival');
  });
}

function showLunarInfoForMonth(year, month) {
  clearLunarDisplay();
  
  const monthDays = getMonthDays(year, month);
  
  setTimeout(() => {
    monthDays.forEach(({ day, weekday, dateInfo }) => {
      const dateCell = findDateCell(day);
      if (!dateCell) return;
      
      const row = dateCell.parentNode;
      const dayCell = findDayCellInRow(row, weekday, [month]);
      if (!dayCell) return;
      
      const cellMonths = dayCell.dataset.months ? JSON.parse(dayCell.dataset.months) : [];
      if (!cellMonths.includes(month)) return;
      
      let infoHtml = '';
      
      if (dateInfo.jieQi) {
        infoHtml = `<span class="jieqi-text text-danger fw-bold">${dateInfo.jieQi}</span>`;
      } else if (dateInfo.lunar.day === 1) {
        const leapClass = dateInfo.lunar.isLeap ? 'lunar-leap' : '';
        infoHtml = `<span class="lunar-info ${leapClass}">${dateInfo.lunar.monthStr}</span>`;
      } else {
        const leapClass = dateInfo.lunar.isLeap ? 'lunar-leap' : '';
        infoHtml = `<span class="lunar-info ${leapClass}">${dateInfo.lunar.dayStr}</span>`;
      }
      
      const infoWrapper = document.createElement('span');
      infoWrapper.className = 'lunar-info-wrapper lunar-fade-in';
      infoWrapper.innerHTML = infoHtml;
      
      const existingWrapper = dayCell.querySelector('.lunar-info-wrapper');
      if (existingWrapper) {
        existingWrapper.remove();
      }
      
      dayCell.appendChild(infoWrapper);
      
      if (dateInfo.festival) {
        const badge = document.createElement('span');
        badge.className = 'festival-badge lunar-fade-in';
        badge.title = dateInfo.festival;
        badge.textContent = '节';
        dayCell.appendChild(badge);
      }
      
      dayCell.dataset.solarYear = year;
      dayCell.dataset.solarMonth = month + 1;
      dayCell.dataset.solarDay = day;
      dayCell.dataset.lunarYear = dateInfo.lunar.year;
      dayCell.dataset.lunarMonth = dateInfo.lunar.month;
      dayCell.dataset.lunarDay = dateInfo.lunar.day;
      dayCell.dataset.ganZhi = dateInfo.dayGanZhi;
      dayCell.dataset.shengXiao = dateInfo.shengXiao;
      dayCell.dataset.jieQi = dateInfo.jieQi || '';
      dayCell.dataset.festival = dateInfo.festival || '';
      
      if (!dayCell.classList.contains('lunar-cell')) {
        dayCell.classList.add('lunar-cell');
        dayCell.style.cursor = 'pointer';
      }
    });
  }, 350);
  
  updateSummaryBar(year, month);
}

function updateSummaryBar(year, month) {
  const summaryBar = document.getElementById('lunar-summary-bar');
  const summaryItems = document.getElementById('summary-items');
  
  if (selectedMonth === null) {
    summaryBar.style.display = 'none';
    return;
  }
  
  summaryBar.style.display = 'block';
  summaryItems.innerHTML = '';
  
  const jieQiList = Lunar.getMonthJieQiList(year, month + 1);
  const festivalList = getMonthFestivals(year, month);
  
  const allItems = [...jieQiList, ...festivalList].sort((a, b) => a.day - b.day);
  
  allItems.forEach(item => {
    const badge = document.createElement('span');
    badge.className = `badge rounded-pill ${item.type === '节气' ? 'bg-warning text-dark' : 'bg-danger'} px-3 py-2 summary-item`;
    badge.style.cursor = 'pointer';
    badge.style.transition = 'transform 0.2s';
    badge.innerHTML = `${item.name} <span class="text-muted small">(${item.day}日)</span>`;
    badge.dataset.day = item.day;
    badge.dataset.type = item.type;
    badge.dataset.name = item.name;
    
    badge.addEventListener('mouseenter', () => {
      badge.style.transform = 'scale(1.1)';
    });
    badge.addEventListener('mouseleave', () => {
      badge.style.transform = 'scale(1)';
    });
    
    badge.addEventListener('click', () => {
      highlightDateCell(item.day, item.name);
    });
    
    summaryItems.appendChild(badge);
  });
}

function highlightDateCell(day) {
  const dateCell = findDateCell(day);
  if (!dateCell) return;
  
  const row = dateCell.parentNode;
  const dayCells = row.querySelectorAll('.day');
  
  dayCells.forEach(cell => {
    cell.classList.remove('pulse-highlight');
  });
  
  if (selectedMonth !== null) {
    dayCells.forEach(cell => {
      const cellMonths = cell.dataset.months ? JSON.parse(cell.dataset.months) : [];
      if (cellMonths.includes(selectedMonth)) {
        cell.classList.add('pulse-highlight');
        setTimeout(() => {
          cell.classList.remove('pulse-highlight');
        }, 2000);
      }
    });
  }
}

function showTooltip(cell) {
  const tooltip = document.getElementById('lunar-tooltip');
  if (!tooltip) return;
  
  const ganZhi = cell.dataset.ganZhi;
  const shengXiao = cell.dataset.shengXiao;
  const jieQi = cell.dataset.jieQi;
  const festival = cell.dataset.festival;
  
  if (!ganZhi) return;
  
  let content = `<div class="fw-bold mb-1">${ganZhi}日</div>`;
  content += `<div class="text-muted">生肖：${shengXiao}年</div>`;
  if (jieQi) {
    content += `<div class="text-warning">节气：${jieQi}</div>`;
  }
  if (festival) {
    content += `<div class="text-danger">节日：${festival}</div>`;
  }
  
  tooltip.innerHTML = content;
  tooltip.classList.remove('d-none');
  
  const rect = cell.getBoundingClientRect();
  tooltip.style.left = rect.left + 'px';
  tooltip.style.top = (rect.bottom + 5) + 'px';
  
  tooltip.classList.add('tooltip-fade-in');
}

function hideTooltip() {
  const tooltip = document.getElementById('lunar-tooltip');
  if (tooltip) {
    tooltip.classList.add('d-none');
    tooltip.classList.remove('tooltip-fade-in');
  }
}

function selectMonth(monthElement) {
  const month = parseInt(monthElement.dataset.month);
  const now = moment();
  const year = now.year();
  
  if (selectedMonth === month) {
    selectedMonth = null;
    monthElement.classList.remove('month-selected');
    clearLunarDisplay();
    updateLunarDateDisplay(year, month);
    document.getElementById('lunar-summary-bar').style.display = 'none';
  } else {
    if (selectedMonth !== null) {
      document.querySelectorAll('.month-selected').forEach(el => {
        el.classList.remove('month-selected');
      });
    }
    
    selectedMonth = month;
    monthElement.classList.add('month-selected');
    
    showLunarInfoForMonth(year, month);
    updateLunarDateDisplay(year, month);
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
  
  // Lunar functionality event listeners
  document.addEventListener('click', (e) => {
    const monthEl = e.target.closest('.month');
    if (monthEl && monthEl.dataset.month !== undefined) {
      selectMonth(monthEl);
    }
  });
  
  document.addEventListener('mouseenter', (e) => {
    const cell = e.target.closest('.lunar-cell');
    if (cell) {
      showTooltip(cell, e);
    }
  }, true);
  
  document.addEventListener('mouseleave', (e) => {
    const cell = e.target.closest('.lunar-cell');
    if (cell) {
      hideTooltip();
    }
  }, true);
  
  document.addEventListener('mousemove', (e) => {
    const tooltip = document.getElementById('lunar-tooltip');
    if (tooltip && !tooltip.classList.contains('d-none')) {
      const cell = document.elementFromPoint(e.clientX, e.clientY);
      if (!cell || !cell.closest('.lunar-cell')) {
        hideTooltip();
      }
    }
  });
});
