/*global moment, bootstrap*/

// Particle System Implementation
const ParticleSystem = {
  canvas: null,
  ctx: null,
  particles: [],
  hoverParticles: [],
  currentHoverCell: null,
  hoverParticleTimer: null,
  isRunning: false,
  animationId: null,
  
  // Particle colors by cell type
  colors: {
    month: { r: 255, g: 0, b: 255 },    // Magenta
    date: { r: 0, g: 255, b: 255 },       // Cyan
    day: { r: 255, g: 191, b: 0 }         // Amber
  },
  
  // Initialize the particle system
  init: function() {
    this.canvas = document.getElementById('particle-canvas');
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    this.setupEventListeners();
    this.isRunning = true;
    this.animate();
  },
  
  // Resize canvas to match calendar container
  resizeCanvas: function() {
    const container = document.getElementById('one-page-calendar-container');
    if (!container || !this.canvas) return;
    
    const rect = container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  },
  
  // Check if dark mode is enabled
  isDarkMode: function() {
    return document.documentElement.getAttribute('data-bs-theme') === 'dark';
  },
  
  // Get color with brightness adjustment for dark mode
  getColor: function(type, alpha = 1) {
    const color = this.colors[type];
    let r = color.r;
    let g = color.g;
    let b = color.b;
    
    // Increase brightness in dark mode by 20%
    if (this.isDarkMode()) {
      r = Math.min(255, r + 51);
      g = Math.min(255, g + 51);
      b = Math.min(255, b + 51);
    }
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },
  
  // Get cell type from element
  getCellType: function(element) {
    if (element.classList.contains('month')) return 'month';
    if (element.classList.contains('date')) return 'date';
    if (element.classList.contains('day')) return 'day';
    return null;
  },
  
  // Get cell center coordinates relative to canvas
  getCellCenter: function(element) {
    const rect = element.getBoundingClientRect();
    const canvasRect = this.canvas.getBoundingClientRect();
    
    return {
      x: rect.left + rect.width / 2 - canvasRect.left,
      y: rect.top + rect.height / 2 - canvasRect.top
    };
  },
  
  // Create a burst of particles from cell center
  createBurst: function(element) {
    const cellType = this.getCellType(element);
    if (!cellType) return;
    
    const center = this.getCellCenter(element);
    const particleCount = Math.floor(Math.random() * 21) + 20; // 20-40 particles
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2; // 2-6 px per frame
      
      this.particles.push({
        x: center.x,
        y: center.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2, // 2-5px
        type: cellType,
        life: 2, // 2 seconds
        maxLife: 2,
        gravity: 0.15
      });
    }
  },
  
  // Create hover particles from cell edge
  createHoverParticles: function(element) {
    const cellType = this.getCellType(element);
    if (!cellType) return;
    
    const rect = element.getBoundingClientRect();
    const canvasRect = this.canvas.getBoundingClientRect();
    
    const particleCount = Math.floor(Math.random() * 3) + 3; // 3-5 particles
    
    for (let i = 0; i < particleCount; i++) {
      // Random position along cell edge
      const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      let x, y;
      
      switch (edge) {
        case 0: // top
          x = rect.left + Math.random() * rect.width - canvasRect.left;
          y = rect.top - canvasRect.top;
          break;
        case 1: // right
          x = rect.right - canvasRect.left;
          y = rect.top + Math.random() * rect.height - canvasRect.top;
          break;
        case 2: // bottom
          x = rect.left + Math.random() * rect.width - canvasRect.left;
          y = rect.bottom - canvasRect.top;
          break;
        case 3: // left
          x = rect.left - canvasRect.left;
          y = rect.top + Math.random() * rect.height - canvasRect.top;
          break;
      }
      
      // Slow random direction
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.5 + 0.2; // 0.2-0.7 px per frame
      
      this.hoverParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 1, // 1-3px
        type: cellType,
        life: 1, // 1 second
        maxLife: 1,
        gravity: 0
      });
    }
  },
  
  // Update all particles
  update: function(deltaTime) {
    // Update burst particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Apply gravity
      p.vy += p.gravity;
      
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      
      // Update life
      p.life -= deltaTime;
      
      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    // Update hover particles
    for (let i = this.hoverParticles.length - 1; i >= 0; i--) {
      const p = this.hoverParticles[i];
      
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      
      // Update life
      p.life -= deltaTime;
      
      // Remove dead particles
      if (p.life <= 0) {
        this.hoverParticles.splice(i, 1);
      }
    }
  },
  
  // Render all particles
  render: function() {
    if (!this.ctx) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render burst particles
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = this.getColor(p.type, alpha);
      this.ctx.fill();
    }
    
    // Render hover particles
    for (const p of this.hoverParticles) {
      const alpha = p.life / p.maxLife;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = this.getColor(p.type, alpha);
      this.ctx.fill();
    }
  },
  
  // Animation loop using requestAnimationFrame
  lastTime: 0,
  animate: function(currentTime = 0) {
    if (!this.isRunning) return;
    
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    // Generate hover particles at intervals if hovering over a cell
    if (this.currentHoverCell && currentTime - this.lastHoverParticleTime >= this.hoverParticleInterval) {
      this.createHoverParticles(this.currentHoverCell);
      this.lastHoverParticleTime = currentTime;
    }
    
    this.update(deltaTime);
    this.render();
    
    this.animationId = requestAnimationFrame((time) => this.animate(time));
  },
  
  // Stop animation
  stop: function() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  },
  
  // Hover particle generation timing
  lastHoverParticleTime: 0,
  hoverParticleInterval: 300, // 300ms between hover particle generations
  
  // Find the closest cell element from event target
  findCellElement: function(element) {
    while (element && element !== document) {
      if (this.getCellType(element)) {
        return element;
      }
      element = element.parentNode;
    }
    return null;
  },
  
  // Setup event listeners
  setupEventListeners: function() {
    // Click events on calendar cells
    const calendar = document.getElementById('one-page-calendar');
    if (calendar) {
      // Use event delegation for click
      calendar.addEventListener('click', (e) => {
        const cell = this.findCellElement(e.target);
        if (cell) {
          this.createBurst(cell);
        }
      });
      
      // Use mouseover and mouseout instead of mouseenter/mouseleave for event delegation
      calendar.addEventListener('mouseover', (e) => {
        const cell = this.findCellElement(e.target);
        if (cell && cell !== this.currentHoverCell) {
          this.currentHoverCell = cell;
          // Start generating hover particles immediately
          this.createHoverParticles(cell);
          this.lastHoverParticleTime = performance.now();
        }
      });
      
      calendar.addEventListener('mouseout', (e) => {
        const cell = this.findCellElement(e.target);
        if (cell) {
          // Check if the mouse is actually leaving the calendar or just moving to another cell
          const relatedTarget = e.relatedTarget;
          const relatedCell = relatedTarget ? this.findCellElement(relatedTarget) : null;
          
          if (!relatedCell || relatedCell !== cell) {
            // Only clear if moving to a different cell or outside
            if (this.currentHoverCell === cell) {
              this.currentHoverCell = null;
            }
          }
        }
      });
      
      // Also listen for mouseleave on the entire calendar to clear hover
      calendar.addEventListener('mouseleave', () => {
        this.currentHoverCell = null;
      });
    }
    
    // Resize event
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
    
    // Theme change event
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'data-bs-theme') {
          // Theme changed, colors will be adjusted automatically in getColor
        }
      }
    });
    
    observer.observe(document.documentElement, { attributes: true });
  },
  
  // Take screenshot of calendar with particles
  takeScreenshot: function() {
    const container = document.getElementById('one-page-calendar-container');
    const table = document.getElementById('one-page-calendar');
    const rect = container.getBoundingClientRect();
    
    // Create a temporary canvas to combine both
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Set temp canvas size with higher resolution for better quality
    const scale = 2;
    tempCanvas.width = rect.width * scale;
    tempCanvas.height = rect.height * scale;
    tempCtx.scale(scale, scale);
    
    // Fill with background color based on theme
    tempCtx.fillStyle = this.isDarkMode() ? '#212529' : '#ffffff';
    tempCtx.fillRect(0, 0, rect.width, rect.height);
    
    // First, try to render the calendar table using SVG foreignObject
    try {
      // Clone the table to avoid modifying the original
      const tableClone = table.cloneNode(true);
      
      // Apply inline styles to ensure proper rendering
      const style = document.createElement('style');
      style.textContent = `
        * { box-sizing: border-box; }
        table { border-collapse: collapse; width: 100%; }
        td { border: 1px solid; padding: 0.5rem; text-align: center; }
        .table-active { background-color: rgba(0, 0, 0, 0.075); }
        .table-danger { background-color: #f8d7da; }
        .border-light { border-color: #f8f9fa !important; }
        .border-dark { border-color: #212529 !important; }
        .position-relative { position: relative; }
        .badge { 
          position: absolute; 
          top: 0; 
          right: 0; 
          font-size: 0.65em; 
          padding: 0.25em 0.5em; 
          border-radius: 0 0 0 0.5em; 
        }
        .bg-secondary { background-color: #6c757d; color: white; }
      `;
      
      // Create a wrapper div for the table
      const wrapper = document.createElement('div');
      wrapper.style.width = rect.width + 'px';
      wrapper.style.height = rect.height + 'px';
      wrapper.style.backgroundColor = this.isDarkMode() ? '#212529' : '#ffffff';
      wrapper.style.color = this.isDarkMode() ? '#f8f9fa' : '#212529';
      wrapper.appendChild(style);
      wrapper.appendChild(tableClone);
      
      // Serialize the HTML
      const html = wrapper.outerHTML;
      
      // Create SVG with foreignObject
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="margin:0;padding:0;">
              ${html.replace(/"/g, '&quot;').replace(/#/g, '%23').replace(/\n/g, '')}
            </div>
          </foreignObject>
        </svg>
      `;
      
      // Create an image from the SVG
      const img = new Image();
      img.onload = () => {
        // Draw the table image
        tempCtx.drawImage(img, 0, 0);
        
        // Draw the particle canvas on top
        tempCtx.drawImage(this.canvas, 0, 0);
        
        // Convert to PNG and download
        const dataURL = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `calendar-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataURL;
        link.click();
      };
      
      img.onerror = () => {
        // Fallback: just draw particles on background
        tempCtx.drawImage(this.canvas, 0, 0);
        const dataURL = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `calendar-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataURL;
        link.click();
      };
      
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      
    } catch (error) {
      console.error('Screenshot error:', error);
      // Fallback: just draw particles on background
      tempCtx.drawImage(this.canvas, 0, 0);
      const dataURL = tempCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `calendar-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataURL;
      link.click();
    }
  }
};

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
  
  // Screenshot functionality
  document.getElementById('launch-screenshot-button').addEventListener('click', () => {
    ParticleSystem.takeScreenshot();
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
  
  // Initialize Particle System
  ParticleSystem.init();
});
