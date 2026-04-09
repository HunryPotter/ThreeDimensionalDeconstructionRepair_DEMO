export class SpatialView {
  constructor(container) {
    this.container = container;
    this.isDrawingMode = false;
    this.newMarker = null;
    this.isMeasuringMode = false;
    this.measurePoints = [];
    this.markers = []; // Store dynamically rendered markers
    this.currentTab = 'SR'; // Track active tab for visibility logic
    this.defaultDateRange = { start: '2026-01-01', end: '2026-04-01' }; // Store for reset
    this.dateRange = { ...this.defaultDateRange }; // Initialize default date range
    this.addStyles(); // Inject styles once
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div id="canvas-container">
        <!-- Global Breadcrumbs -->
        <div id="global-breadcrumbs" class="breadcrumb-nav">
          <span class="crumb">全部架次</span>
        </div>

        <!-- 3D Scene Marker -->
        <div class="scene-placeholder">
            <div id="spatial-scene-container" class="scene-container">
                <img src="/prototype/background.png" class="background-aircraft" alt="Aircraft Background">
                
                <!-- SVG Overlay for Leader Lines & Measurement -->
                <svg id="leader-line-svg" class="leader-line-layer">
                    <path id="leader-line-path" d="" fill="none" stroke="rgba(239, 68, 68, 0.85)" stroke-width="2" stroke-dasharray="6,3" />
                    <line id="measure-line" x1="0" y1="0" x2="0" y2="0" stroke="#a3e635" stroke-width="2" stroke-dasharray="4,2" style="display: none;" />
                </svg>
                
                <div id="measure-label" class="measure-tooltip" style="display: none;">0.0m</div>

                <!-- Dynamic Damage Hotspots Container -->
                <div id="damage-markers-layer" style="position: absolute; inset: 0; pointer-events: none;"></div>
            </div>
        </div>

        <!-- Floating Global Actions (Empty, replaced by timeline header action) -->
        <div class="floating-actions" id="global-actions" style="display: none !important;"></div>

        <!-- Timeline Component -->
        <div id="spatial-timeline" class="spatial-timeline">
          <div class="timeline-header">
            <div class="header-left">
              <div class="calendar-trigger" id="calendar-trigger">
                <span class="icon">📅</span>
                <span id="date-range-label" class="range-label">2026-01-01 - 2026-04-01</span>
              </div>
            </div>
            
            <div class="header-right">
              <button id="btn-initiate-request" class="btn-timeline-action">
                <span class="icon">⚡</span> 发起技术请求
              </button>
            </div>
          </div>
          <div class="timeline-main">
            <div class="timeline-visual-track">
              <div id="timeline-markers-container" class="markers-layer"></div>
              <div class="track-line"></div>
            </div>
            <div class="timeline-axis">
              <span>JAN</span>
              <span>FEB</span>
              <span>MAR</span>
              <span>APR</span>
            </div>
          </div>
        </div>

        <!-- High-tech Calendar Popup -->
        <div id="calendar-popup" class="calendar-popup" style="display: none;">
          <div class="calendar-popup-header">
            <span>数据检索区间</span>
            <button class="btn-close-calendar">×</button>
          </div>
          <div class="calendar-content">
            <div class="date-range-picker">
              <div class="date-input-group">
                <label>开始日期</label>
                <div class="input-with-icon">
                  <span class="input-icon">📅</span>
                  <input type="date" id="start-date-input" value="2026-01-01">
                </div>
              </div>
              <div class="date-range-separator">
                <div class="separator-line"></div>
                <span class="separator-text">至</span>
                <div class="separator-line"></div>
              </div>
              <div class="date-input-group">
                <label>结束日期</label>
                <div class="input-with-icon">
                  <span class="input-icon">📅</span>
                  <input type="date" id="end-date-input" value="2026-04-01">
                </div>
              </div>
            </div>
            <!-- Quick ranges disabled as requested
            <div class="calendar-quick-ranges">
              <div class="range-chip" data-start="2026-01-01" data-end="2026-04-01">Q1 全季度</div>
              <div class="range-chip" data-start="2026-01-01" data-end="2026-01-31">一月</div>
              <div class="range-chip" data-start="2026-02-01" data-end="2026-02-28">二月</div>
            </div>
            -->
          </div>
          <div class="calendar-footer">
            <button class="btn-reset-calendar">重置</button>
            <button class="btn-apply-calendar primary">确认检索</button>
          </div>
        </div>
      </div>

      <!-- Spatial Navigation Tools (Level 2 Only) -->
      <div class="spatial-nav-tools" id="spatial-filters" style="display: none;">
        <div class="spatial-filter-group">
          ${this.renderSpatialDropdown('frame', '框位', ['FR1', 'FR15', 'FR32', 'FR56', 'FR88'])}
          ${this.renderSpatialDropdown('station', '站位', ['STA280', 'STA450', 'STA620', 'STA840'])}
          ${this.renderSpatialDropdown('stringer', '长桁', ['STR1', 'STR12', 'STR24', 'STR38'])}
        </div>
      </div>

      <!-- Toolbar Dock (Vertical & Abstract) -->
      <div class="toolbar-dock">
        <div class="dock-item" title="选择">⬚</div>
        <div class="dock-item" title="平移">⬚</div>
        <div class="dock-item" title="旋转">⬚</div>
        <div class="dock-divider"></div>
        <div class="dock-item" title="辅助线">⬚</div>
        <div class="dock-item" title="设置">⬚</div>
        <div class="dock-divider"></div>
        <div class="dock-item" id="btn-measure" title="测量">📏</div>
        <div class="dock-item" id="btn-struct-toggle" title="点击切换飞机内部框位、站位及长桁结构的显隐状态，辅助精确定位损伤位置。">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
      </div>
      
      <!-- System Announcement Banner -->
      <div id="spatial-banner" class="spatial-banner" style="display: none;">
        <span class="banner-icon">ℹ</span>
        <span class="banner-text">请点击模型进行标记</span>
      </div>

      <!-- Secondary Confirmation Popup -->
      <div id="confirm-popup" class="confirm-dialog" style="display: none;">
        <div class="confirm-header">标记完成是否确认</div>
        <div class="confirm-content">
          <div class="coord-label">标记位坐标:</div>
          <div id="confirm-coords" class="coord-value">( 0.0, 0.0, 0.0 )</div>
        </div>
        <div class="confirm-footer">
          <button id="btn-confirm-no" class="btn-confirm">否</button>
          <button id="btn-confirm-yes" class="btn-confirm primary">是</button>
        </div>
      </div>
    `;

    this.initEvents();
  }

  initEvents() {
    window.addEventListener('date-range-change', (e) => {
      this.dateRange = e.detail;
      // We don't call render() here because RecordSidebar will dispatch 'records-updated' 
      // which triggers renderTimeline with the new data.
    });

    window.addEventListener('filter-change', (e) => {
      this.updateBreadcrumbs(e.detail);
    });

    window.addEventListener('filter-reset', () => {
      this.updateBreadcrumbs({ type: ['全部型别'], airline: ['全部航司'], tail: ['全部架次'] });
    });

    // Handle Dropdown Selection via Change Event (Source of Truth)
    this.container.addEventListener('change', (e) => {
      if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
        const checkbox = e.target;
        const dropdownItem = checkbox.closest('.dropdown-item');
        const container = dropdownItem.closest('.crumb-container');
        const key = container.dataset.key;
        const value = dropdownItem.dataset.value;
        const allLabel = key === 'type' ? '全部型别' : key === 'airline' ? '全部航司' : '全部架次';

        const currentFilters = {};
        this.container.querySelectorAll('.crumb-container').forEach(c => {
          const k = c.dataset.key;
          const kAllLabel = k === 'type' ? '全部型别' : k === 'airline' ? '全部航司' : '全部架次';
          let selected = Array.from(c.querySelectorAll('.dropdown-item'))
            .filter(item => item.querySelector('input').checked)
            .map(item => item.dataset.value);

          if (k === key) {
            if (value === kAllLabel && checkbox.checked) {
              selected = [kAllLabel];
            } else if (value !== kAllLabel && checkbox.checked) {
              selected = selected.filter(v => v !== kAllLabel);
            } else if (selected.length === 0) {
              selected = [kAllLabel];
            }
          }
          currentFilters[k] = selected;
        });

        window.dispatchEvent(new CustomEvent('filter-change', {
          detail: currentFilters
        }));
      }
    });

    // Allow clicking the item to toggle the checkbox
    this.container.addEventListener('click', (e) => {
      const dropdownItem = e.target.closest('.dropdown-item');
      const clearBtn = e.target.closest('.btn-clear');

      if (dropdownItem && e.target.tagName !== 'INPUT') {
        e.stopPropagation();
        const checkbox = dropdownItem.querySelector('input');
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }

      if (clearBtn) {
        e.stopPropagation();
        const key = clearBtn.dataset.key;
        const allLabel = key === 'type' ? '全部型别' : key === 'airline' ? '全部航司' : '全部架次';

        const currentFilters = {};
        this.container.querySelectorAll('.crumb-container').forEach(c => {
          const k = c.dataset.key;
          const kAllLabel = k === 'type' ? '全部型别' : k === 'airline' ? '全部航司' : '全部架次';
          if (k === key) {
            currentFilters[k] = [kAllLabel];
          } else {
            currentFilters[k] = Array.from(c.querySelectorAll('.dropdown-item'))
              .filter(item => item.querySelector('input').checked)
              .map(item => item.dataset.value);
          }
        });

        window.dispatchEvent(new CustomEvent('filter-change', {
          detail: currentFilters
        }));
      }
    });

    // Optimized Hover Interaction (Delay disappearance)
    let hideTimeout = null;
    this.container.addEventListener('mouseenter', (e) => {
      const container = e.target.closest('.crumb-container');
      if (container) {
        clearTimeout(hideTimeout);
        this.container.querySelectorAll('.crumb-container').forEach(c => c.classList.remove('open'));
        container.classList.add('open');
      }
    }, true);

    this.container.addEventListener('mouseleave', (e) => {
      const container = e.target.closest('.crumb-container');
      if (container) {
        hideTimeout = setTimeout(() => {
          container.classList.remove('open');
        }, 600); // Increased to 600ms for even better protection
      }
    }, true);

    // Initial render
    this.updateBreadcrumbs();
    this.initSpatialEvents();
    this.initDrawingEvents();
    this.initMeasurementEvents();

    // Damage Marker Sync
    window.addEventListener('spatial-markers-update', (e) => {
      this.renderMarkers(e.detail);
    });

    // Global Action: Initiate Technical Request
    const techRequestBtn = this.container.querySelector('#btn-initiate-request');
    if (techRequestBtn) {
      techRequestBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('initiate-technical-request'));
      });
    }
  }

  renderMarkers(markers) {
    const layer = this.container.querySelector('#damage-markers-layer');
    if (!layer) return;

    // Fast check: if markers are identical, skip render
    const currentMarkersId = JSON.stringify(markers.map(m => ({ id: m.id, x: m.x, y: m.y, records: m.records.length })));
    if (this._lastMarkersId === currentMarkersId) return;
    this._lastMarkersId = currentMarkersId;

    // Clear existing
    layer.innerHTML = '';
    this.markers = markers;

    markers.forEach(data => {
      // 1. Create a Container for this Site
      const siteContainer = document.createElement('div');
      siteContainer.className = `site-container ${(data.isExisting && data.records.length <= 1) ? 'no-spread' : ''}`;
      siteContainer.style.top = `${data.y}%`;
      siteContainer.style.left = `${data.x}%`;
      siteContainer.style.pointerEvents = 'auto';

      // 2. Render Sub-markers (Individual records)
      if (data.isExisting && data.records && data.records.length > 0) {
        data.records.forEach((rec, index) => {
          const subMarker = document.createElement('div');
          subMarker.className = `hotspot sub-marker marker-existing ${rec.id === window.app?.leftSidebar?.selectedSrId ? 'selected' : ''}`;

          // Calculate individual expansion angle
          const angle = (360 / data.records.length) * index;
          subMarker.style.setProperty('--angle', `${angle}deg`);
          subMarker.style.setProperty('--index', index);

          subMarker.title = `记录: ${rec.id}`;
          subMarker.innerHTML = `
            <div class="glow-ring ring-1"></div>
            <div class="glow-ring ring-2"></div>
            <div class="dot-core">${rec.typeIcon || '⊞'}</div>
          `;

          subMarker.addEventListener('click', (e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('sr-reverse-select', {
              detail: { id: rec.id, allIds: data.records.map(r => r.id) }
            }));
          });
          siteContainer.appendChild(subMarker);
        });
      }

      // 3. Render the Main Site Marker (The "Anchor")
      const mainMarker = document.createElement('div');
      const markerTypeClass = data.isExisting ? 'marker-existing' : 'marker-new';
      mainMarker.className = `hotspot main-marker ${markerTypeClass} ${data.isSelected ? 'selected' : ''}`;

      // Main marker shows the "lead" icon or a count
      const isNumeric = data.isExisting && data.typeIcon && !isNaN(parseInt(data.typeIcon));
      const iconHtml = (data.isExisting && data.typeIcon) ? `<div class="dot-core ${isNumeric ? 'numeric' : ''}">${data.typeIcon}</div>` : `<div class="dot-core"></div>`;
      const countBadge = (data.isExisting && data.records.length > 1) ? `<div class="site-count">${data.records.length}</div>` : '';

      mainMarker.innerHTML = `
        <div class="glow-ring ring-1"></div>
        <div class="glow-ring ring-2"></div>
        ${iconHtml}
        ${countBadge}
      `;
      mainMarker.title = data.isExisting ? `点位: ${data.id} (${data.records.length}条记录)` : '新标记点';

      mainMarker.addEventListener('click', (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('site-click', { detail: data }));
        // Default behavior: select the first record
        window.dispatchEvent(new CustomEvent('sr-reverse-select', {
          detail: {
            id: data.isExisting ? data.records[0].id : data.id,
            allIds: data.isExisting ? data.records.map(r => r.id) : [data.id]
          }
        }));
      });

      siteContainer.appendChild(mainMarker);
      layer.appendChild(siteContainer);
    });
  }

  initMeasurementEvents() {
    const measureBtn = this.container.querySelector('#btn-measure');
    if (measureBtn) {
      measureBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMeasurementMode();
      });
    }
  }

  toggleMeasurementMode() {
    this.isMeasuringMode = !this.isMeasuringMode;
    const btn = this.container.querySelector('#btn-measure');
    const scene = this.container.querySelector('#spatial-scene-container');

    if (this.isMeasuringMode) {
      // Deactivate drawing mode if active
      if (this.isDrawingMode) {
        this.isDrawingMode = false;
        scene.classList.remove('drawing-active');
      }

      btn.classList.add('active');
      scene.classList.add('measuring-active');
      this.resetMeasurement();
      this.showBanner('请选取两点进行测量');
    } else {
      btn.classList.remove('active');
      scene.classList.remove('measuring-active');
      this.resetMeasurement();
      this.hideBanner();
    }
  }

  resetMeasurement() {
    this.measurePoints = [];
    this.container.querySelectorAll('.marker-measure').forEach(m => m.remove());
    const mLine = this.container.querySelector('#measure-line');
    const mLabel = this.container.querySelector('#measure-label');
    if (mLine) mLine.style.display = 'none';
    if (mLabel) mLabel.style.display = 'none';
  }

  handleMeasureClick(e, scene) {
    if (e.target.closest('.confirm-dialog')) return;

    const rect = scene.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (this.measurePoints.length >= 2) {
      this.resetMeasurement();
    }

    const dot = document.createElement('div');
    dot.className = 'hotspot marker-measure';
    dot.style.top = `${y}%`;
    dot.style.left = `${x}%`;
    dot.innerHTML = `<div class="dot-core" style="background: #a3e635; width: 6px; height: 6px;"></div>`;
    scene.appendChild(dot);

    this.measurePoints.push({ x, y });

    if (this.measurePoints.length === 2) {
      this.drawMeasureLine(scene);
    }
  }

  drawMeasureLine(scene) {
    const p1 = this.measurePoints[0];
    const p2 = this.measurePoints[1];
    const line = this.container.querySelector('#measure-line');
    const label = this.container.querySelector('#measure-label');
    const svgLayer = this.container.querySelector('#leader-line-svg');
    const svgRect = svgLayer.getBoundingClientRect();

    const x1 = (p1.x / 100) * svgRect.width;
    const y1 = (p1.y / 100) * svgRect.height;
    const x2 = (p2.x / 100) * svgRect.width;
    const y2 = (p2.y / 100) * svgRect.height;

    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.style.display = 'block';

    // Calculate simulated distance (Euclidean * factor)
    const distPercentage = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const realMeters = (distPercentage * 0.15).toFixed(1);

    label.textContent = `${realMeters}m`;
    label.style.left = `${(p1.x + p2.x) / 2}%`;
    label.style.top = `${(p1.y + p2.y) / 2}%`;
    label.style.display = 'block';
  }

  initDrawingEvents() {
    window.addEventListener('enter-drawing-mode', () => {
      // Deactivate measuring mode if active
      if (this.isMeasuringMode) this.toggleMeasurementMode();

      this.isDrawingMode = true;
      this.showBanner('请点击模型进行标记');
      this.container.querySelector('#spatial-scene-container').classList.add('drawing-active');

      // Hide timeline if it was shown
      this.renderTimeline(this.currentTab || 'SR', []);
    });

    // Global Exit for all interaction modes (Marking, Measuring, etc.)
    window.addEventListener('exit-interaction-modes', () => {
      this.isDrawingMode = false;
      this.isMeasuringMode = false;
      const sceneContainer = this.container.querySelector('#spatial-scene-container');
      if (sceneContainer) {
        sceneContainer.classList.remove('drawing-active');
        sceneContainer.classList.remove('measuring-active');
      }
      this.hideBanner();
      // Re-trigger timeline rendering to restore visibility (USING ACTUAL TAB)
      this.renderTimeline(this.currentTab, []);
    });

    const sceneContainer = this.container.querySelector('#spatial-scene-container');
    sceneContainer.addEventListener('click', (e) => {
      if (this.isMeasuringMode) {
        this.handleMeasureClick(e, sceneContainer);
        return;
      }

      if (!this.isDrawingMode) return;
      if (e.target.closest('.confirm-dialog')) return;

      const rect = sceneContainer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Create new marker
      if (this.newMarker) {
        this.newMarker.remove();
      }

      this.newMarker = document.createElement('div');
      this.newMarker.className = 'hotspot marker-new selected'; // New markers are blue and show ripple
      this.newMarker.style.top = `${y}%`;
      this.newMarker.style.left = `${x}%`;
      this.newMarker.innerHTML = `
        <div class="glow-ring ring-1"></div>
        <div class="glow-ring ring-2"></div>
        <div class="dot-core"></div>
      `;
      sceneContainer.appendChild(this.newMarker);

      // Show confirmation dialog at click position or center
      const confirmPopup = this.container.querySelector('#confirm-popup');
      const coordDisplay = confirmPopup.querySelector('#confirm-coords');
      // Simulated 3D coords based on 2D percentages
      const simX = (x * 5.5).toFixed(1);
      const simY = (y * 2.2).toFixed(1);
      const simZ = (Math.random() * 50).toFixed(1);
      coordDisplay.textContent = `( ${simX}, ${simY}, ${simZ} )`;
      confirmPopup.style.display = 'block';
      this.hideBanner(); // Hide guidance when confirming
    });

    this.container.querySelector('#btn-confirm-no').addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.newMarker) this.newMarker.remove();
      this.newMarker = null;
      this.container.querySelector('#confirm-popup').style.display = 'none';
      // Stay in drawing mode -> Restore banner
      this.showBanner('请点击模型进行标记');
    });

    this.container.querySelector('#btn-confirm-yes').addEventListener('click', (e) => {
      e.stopPropagation();
      this.isDrawingMode = false;
      this.container.querySelector('#spatial-scene-container').classList.remove('drawing-active');
      this.container.querySelector('#confirm-popup').style.display = 'none';
      this.hideBanner();

      // Dispatch event to show popup and jump
      window.dispatchEvent(new CustomEvent('confirm-technical-request'));
    });
  }

  initSpatialEvents() {
    window.addEventListener('enter-drilldown', () => {
      this.hideBanner();
      const canvasContainer = this.container.querySelector('#canvas-container');
      if (canvasContainer) canvasContainer.classList.add('drilldown-active');
      this.resetSpatialFilters();
    });

    const btnRequest = this.container.querySelector('#btn-initiate-request');
    if (btnRequest) {
      btnRequest.addEventListener('click', () => {
        // Switch sidebar to CR tab and update scene
        window.dispatchEvent(new CustomEvent('enter-cr-flow'));
        this.showBanner('正在呼叫技术参数...');
      });
    }

    window.addEventListener('exit-drilldown', () => {
      const canvasContainer = this.container.querySelector('#canvas-container');
      if (canvasContainer) canvasContainer.classList.remove('drilldown-active');

      // Fix: clear 3D damage markers when returning to primary view
      const layer = this.container.querySelector('#damage-markers-layer');
      if (layer) layer.innerHTML = '';
      this._lastMarkersId = null;

      this.resetSpatialFilters();
    });

    window.addEventListener('records-updated', (e) => {
      this.renderTimeline(e.detail.tab, e.detail.records);
    });

    // Bidirectional Selection Sync: Listen for selections from Sidebar or 3D scene
    ['sr-reverse-select', 'sr-select', 'crs-select'].forEach(evtName => {
      window.addEventListener(evtName, (e) => {
        const sidebar = window.app?.leftSidebar;

        // Highlight timeline markers based on ALL active selection IDs (SR and CRS)
        this.container.querySelectorAll('.timeline-record-marker').forEach(m => {
          const id = m.dataset.id;
          const isSelected = (id === sidebar?.selectedSrId) || (id === sidebar?.selectedCrsId);
          m.classList.toggle('selected', isSelected);
        });
      });
    });

    const calTrigger = this.container.querySelector('#calendar-trigger');
    const calPopup = this.container.querySelector('#calendar-popup');
    if (calTrigger && calPopup) {
      calTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = calTrigger.getBoundingClientRect();
        // Position popup above trigger
        calPopup.style.display = calPopup.style.display === 'flex' ? 'none' : 'flex';
      });

      // Close calendar
      calPopup.querySelector('.btn-close-calendar').addEventListener('click', (e) => {
        e.stopPropagation();
        calPopup.style.display = 'none';
      });

      // Range selection
      const chips = calPopup.querySelectorAll('.range-chip');
      chips.forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');

          const startInput = calPopup.querySelector('#start-date-input');
          const endInput = calPopup.querySelector('#end-date-input');
          if (startInput && endInput) {
            startInput.value = chip.dataset.start;
            endInput.value = chip.dataset.end;
          }
        });
      });

      // Apply
      calPopup.querySelector('.btn-apply-calendar').addEventListener('click', (e) => {
        e.stopPropagation();
        const startInput = calPopup.querySelector('#start-date-input');
        const endInput = calPopup.querySelector('#end-date-input');

        if (startInput && endInput) {
          const startDate = startInput.value;
          const endDate = endInput.value;

          if (new Date(startDate) > new Date(endDate)) {
            alert('开始日期不能晚于结束日期');
            return;
          }

          this.container.querySelector('#date-range-label').textContent = `${startDate} - ${endDate}`;

          window.dispatchEvent(new CustomEvent('date-range-change', {
            detail: { start: startDate, end: endDate }
          }));

          calPopup.style.display = 'none';
          this.showBanner(`已筛选区间: ${startDate} 至 ${endDate}`);
        }
      });

      // Reset
      calPopup.querySelector('.btn-reset-calendar').addEventListener('click', (e) => {
        e.stopPropagation();
        const startInput = calPopup.querySelector('#start-date-input');
        const endInput = calPopup.querySelector('#end-date-input');

        // Fix: Remove active class from all chips
        const chips = calPopup.querySelectorAll('.range-chip');
        chips.forEach(c => c.classList.remove('active'));

        if (startInput && endInput) {
          startInput.value = this.defaultDateRange.start;
          endInput.value = this.defaultDateRange.end;

          this.container.querySelector('#date-range-label').textContent =
            `${this.defaultDateRange.start} - ${this.defaultDateRange.end}`;

          window.dispatchEvent(new CustomEvent('date-range-change', {
            detail: { ...this.defaultDateRange }
          }));

          this.showBanner('已重置检索区间为默认值');
        }
      });
    }

    // Global click to close calendar
    document.addEventListener('click', (e) => {
      if (calPopup && calPopup.style.display === 'flex' && !e.target.closest('#calendar-popup')) {
        calPopup.style.display = 'none';
      }
    });

    this.container.addEventListener('click', (e) => {
      const trigger = e.target.closest('.spatial-trigger');
      const option = e.target.closest('.spatial-option');

      if (trigger) {
        e.stopPropagation();
        const dropdown = trigger.closest('.spatial-dropdown');
        const isOpen = dropdown.classList.contains('open');
        this.container.querySelectorAll('.spatial-dropdown').forEach(d => d.classList.remove('open'));
        if (!isOpen) dropdown.classList.add('open');
      }

      if (option) {
        e.stopPropagation();
        const dropdown = option.closest('.spatial-dropdown');
        const label = dropdown.querySelector('.spatial-label');
        const value = option.dataset.value;
        const key = dropdown.dataset.key;

        label.textContent = value;
        dropdown.classList.remove('open');
        dropdown.classList.add('selected');

        window.dispatchEvent(new CustomEvent('spatial-select', {
          detail: { key, value }
        }));
      }
    });

    document.addEventListener('click', () => {
      this.container.querySelectorAll('.spatial-dropdown').forEach(d => d.classList.remove('open'));
    });
  }

  renderTimeline(tab, records) {
    this.currentTab = tab; // Always update state
    const timeline = this.container.querySelector('#spatial-timeline');
    if (!timeline) return;

    // Show timeline only in Level 2 and EXCLUDE CR tab and Marking/Measuring modes
    const canvasContainer = this.container.querySelector('#canvas-container');
    const sceneContainer = this.container.querySelector('#spatial-scene-container');

    const isDrillDown = canvasContainer && canvasContainer.classList.contains('drilldown-active');
    const isMarking = sceneContainer && (sceneContainer.classList.contains('drawing-active') || sceneContainer.classList.contains('measuring-active'));

    if (isDrillDown && tab !== 'CR' && !isMarking) {
      timeline.style.display = 'flex';
    } else {
      timeline.style.display = 'none';
      return;
    }

    const markersContainer = this.container.querySelector('#timeline-markers-container');
    const axisContainer = this.container.querySelector('.timeline-axis');
    if (!markersContainer || !axisContainer) return;

    // 1. Update Scaling Logic based on current dateRange
    markersContainer.innerHTML = '';
    const startTs = new Date(this.dateRange.start).getTime();
    const endTs = new Date(this.dateRange.end).getTime();
    let range = endTs - startTs;
    if (range === 0) range = 86400000; // Add this fix to avoid division by zero (default to 1 day span)

    records.forEach(record => {
      if (!record.date) return;
      const dateTs = new Date(record.date).getTime();

      // Calculate position relative to CURRENT dateRange
      const pos = Math.min(100, Math.max(0, ((dateTs - startTs) / range) * 100));

      const marker = document.createElement('div');
      marker.className = 'timeline-record-marker';
      marker.style.left = `${pos}%`;
      marker.dataset.id = record.id;
      marker.title = `${record.id} (${record.date})`;
      if (record.has3D) marker.classList.add('has-3d');

      // Add marker body (Labels/Bubbles removed as per request)
      marker.innerHTML = `
        <div class="marker-body"></div>
      `;

      // Auto-highlight if already selected
      const sidebar = window.app?.leftSidebar;
      const isSelected = (record.id === sidebar?.selectedSrId) ||
        (record.id === sidebar?.selectedCrsId) ||
        (record.srId && record.srId === sidebar?.selectedSrId);

      if (isSelected) {
        marker.classList.add('selected');
      }

      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('sr-reverse-select', {
          detail: { id: record.id }
        }));
      });

      markersContainer.appendChild(marker);
    });

    // 2. Dynamic Axis Labels
    this.updateTimelineAxis(axisContainer, startTs, endTs);
  }

  updateTimelineAxis(container, startTs, endTs) {
    container.innerHTML = '';
    const diffDays = (endTs - startTs) / (1000 * 60 * 60 * 24);

    // Simple heuristic for axis labels: 
    // - If < 60 days, show weeks or start/mid/end days
    // - If > 60 days, show months
    if (diffDays <= 60) {
      const numSteps = 4;
      for (let i = 0; i <= numSteps; i++) {
        const date = new Date(startTs + (endTs - startTs) * (i / numSteps));
        const span = document.createElement('span');
        span.textContent = `${date.getMonth() + 1}/${date.getDate()}`;
        container.appendChild(span);
      }
    } else {
      // Show months covered
      const startMonth = new Date(startTs).getMonth();
      const endMonth = new Date(endTs).getMonth();
      const startYear = new Date(startTs).getFullYear();
      const endYear = new Date(endTs).getFullYear();

      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

      let currentYear = startYear;
      let currentMonth = startMonth;

      while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        const span = document.createElement('span');
        span.textContent = months[currentMonth];
        container.appendChild(span);

        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }
    }
  }

  resetSpatialFilters() {
    this.container.querySelectorAll('.spatial-dropdown').forEach(d => {
      const key = d.dataset.key;
      const defaultLabel = key === 'frame' ? '框位' : key === 'station' ? '站位' : '长桁';
      d.querySelector('.spatial-label').textContent = defaultLabel;
      d.classList.remove('selected', 'open');
    });
  }

  showBanner(text) {
    const banner = this.container.querySelector('#spatial-banner');
    if (banner) {
      banner.querySelector('.banner-text').textContent = text;
      banner.style.display = 'flex';
    }
  }

  hideBanner() {
    const banner = this.container.querySelector('#spatial-banner');
    if (banner) banner.style.display = 'none';
  }

  renderSpatialDropdown(key, label, options) {
    return `
      <div class="spatial-dropdown" data-key="${key}">
        <div class="spatial-trigger">
          <span class="spatial-label">${label}</span>
          <span class="spatial-arrow">▾</span>
        </div>
        <div class="spatial-options-panel">
          <div class="options-header">选择${label}</div>
          ${options.map(opt => `<div class="spatial-option" data-value="${opt}">${opt}</div>`).join('')}
          <div class="spatial-option-reset" onclick="event.stopPropagation(); this.closest('.spatial-dropdown').querySelector('.spatial-label').textContent='${label}'; this.closest('.spatial-dropdown').classList.remove('selected', 'open');">重置</div>
        </div>
      </div>
    `;
  }

  updateBreadcrumbs(data = {}) {
    const breadcrumbEl = this.container.querySelector('#global-breadcrumbs');
    if (!breadcrumbEl) return;

    // Default filters
    const filters = {
      type: data.type || ['全部型别'],
      airline: data.airline || ['全部航司'],
      tail: data.tail || ['全部架次']
    };

    // Ensure they are arrays
    ['type', 'airline', 'tail'].forEach(key => {
      if (!Array.isArray(filters[key])) filters[key] = [filters[key]];
    });

    const options = {
      type: ['全部型别', '基本型', '高原型'],
      airline: ['全部航司', '中国东航', '中国国航', '南方航空'],
      tail: ['全部架次', 'B919M']
    };

    const formatLabel = (key, selected) => {
      if (selected.length === 1 && (selected[0] === '全部型别' || selected[0] === '全部航司' || selected[0] === '全部架次')) {
        return selected[0];
      }
      if (selected.length === 1) return selected[0];
      return `${selected[0]} 等${selected.length}项`;
    };

    const renderCrumb = (key, selected) => {
      const label = formatLabel(key, selected);
      return `
        <div class="crumb-container" data-key="${key}">
          <span class="crumb">${label}</span>
          <div class="crumb-dropdown">
            <div class="dropdown-header">
              <span>选择${key === 'type' ? '型别' : key === 'airline' ? '航司' : '机号'}</span>
              <button class="btn-clear" data-key="${key}">重置</button>
            </div>
            ${options[key].map(opt => {
        const checked = selected.includes(opt);
        return `
                <div class="dropdown-item ${checked ? 'active' : ''}" data-value="${opt}">
                  <input type="checkbox" ${checked ? 'checked' : ''} onclick="event.stopPropagation()">
                  <span class="item-label">${opt}</span>
                </div>
              `;
      }).join('')}
          </div>
        </div>
      `;
    };

    breadcrumbEl.innerHTML = `
      ${renderCrumb('type', filters.type)}
      <span class="separator">></span>
      ${renderCrumb('airline', filters.airline)}
      <span class="separator">></span>
      ${renderCrumb('tail', filters.tail)}
    `;
  }

  addStyles() {
    const styleId = 'spatial-view-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #canvas-container {
        width: 100%;
        height: 100%;
        background: #f5f5f5; /* Match image background base */
        box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.05); /* Soft depth */
        overflow: hidden;
        position: relative;
      }

      .floating-actions {
        position: absolute;
        bottom: 24px;
        right: 24px;
        z-index: 100;
        display: flex;
        gap: 12px;
      }

      .btn-primary-float {
        background: #475569;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.15);
        transition: all 0.2s;
      }

      .btn-primary-float:hover {
        background: #334155;
        transform: translateY(-2px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.2);
      }

      .btn-primary-float .icon {
        font-size: 14px;
      }

      .breadcrumb-nav {
        position: absolute;
        top: 16px;
        left: 0;
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        padding: 6px 14px;
        border-radius: 0 4px 4px 0;
        box-shadow: 2px 2px 12px rgba(0, 0, 0, 0.05);
        z-index: 100;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-left: none;
        color: #475569;
      }

      .breadcrumb-nav .crumb {
        color: var(--primary-blue);
        font-weight: 500;
        cursor: pointer;
        transition: 0.2s;
        padding: 4px 8px; /* Increased padding for larger hit area */
        border-radius: 4px;
        display: inline-block;
      }

      .breadcrumb-nav .crumb:hover,
      .crumb-container.open .crumb {
        background: rgba(0, 82, 217, 0.08); /* Stronger feedback */
      }

      .crumb-container {
        position: relative;
        display: flex;
        align-items: center;
      }

      .crumb-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        min-width: 160px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 12px;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
        padding: 8px 0;
        margin-top: 10px;
        display: none;
        z-index: 1000;
        animation: dropFade 0.2s ease-out;
      }

      @keyframes dropFade {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .dropdown-header {
        padding: 4px 16px 8px;
        margin-bottom: 4px;
        border-bottom: 1px solid rgba(0,0,0,0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: #94a3b8;
        font-weight: 600;
      }

      .btn-clear {
        background: none;
        border: none;
        color: var(--primary-blue);
        cursor: pointer;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .btn-clear:hover {
        background: rgba(0, 82, 217, 0.05);
      }

      .crumb-container.open .crumb-dropdown {
        display: block;
      }

      /* Bridge to prevent mouse-leave when moving to dropdown */
      .crumb-container.open::after {
        content: '';
        position: absolute;
        top: 100%;
        left: -20px; /* Expanded left for diagonal movement protection */
        width: calc(100% + 40px); /* Expanded width */
        height: 16px; /* Taller bridge to cover gap */
        z-index: 999;
      }

      .dropdown-item {
        padding: 8px 16px;
        font-size: 13px;
        color: #475569;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.2s;
      }

      .dropdown-item input[type="checkbox"] {
        cursor: pointer;
        width: 14px;
        height: 14px;
        accent-color: var(--primary-blue);
      }

      .dropdown-item:hover {
        background: rgba(0, 82, 217, 0.06);
        color: var(--primary-blue);
      }

      .dropdown-item.active {
        color: var(--primary-blue);
        background: rgba(0, 82, 217, 0.03);
      }

      .dropdown-item.active .item-label {
        font-weight: 600;
      }

      .breadcrumb-nav .separator {
        color: #94a3b8;
        font-size: 10px;
        margin: 0 2px;
      }
      
      /* Background Aircraft Image */
      .scene-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
      }

      .scene-container {
        position: relative;
        width: 85%;
        height: 85%;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .background-aircraft {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        user-select: none;
        pointer-events: none;
        filter: drop-shadow(0 20px 40px rgba(0,0,0,0.06));
        mix-blend-mode: multiply;
      }

      /* Leader Line Layer */
      .leader-line-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 5;
      }
      
      /* Hotspots */
      .hotspot {
        position: absolute;
        width: 32px; /* Increased hit area from 19px */
        height: 32px; /* Increased hit area from 19px */
        transform: translate(-50%, -50%);
        cursor: pointer;
        z-index: 10;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: auto; /* Ensure events are captured */
      }
      
      .dot-core {
        width: 6px;
        height: 6px;
        background: #1e3a8a;
        border: 1.5px solid white;
        border-radius: 50%;
        position: relative;
        z-index: 3;
        box-shadow: 0 0 8px rgba(30, 58, 138, 0.8);
      }
      
      .glow-ring {
        position: absolute;
        border-radius: 50%;
        border: 1.5px solid #ef4444;
        opacity: 0;
        z-index: 2;
      }

      .ring-1 {
        width: 16px;
        height: 16px;
        animation: glow-expand 2s infinite ease-out;
      }

      .ring-2 {
        width: 16px;
        height: 16px;
        animation: glow-expand 2s infinite ease-out 0.6s;
      }
      
      @keyframes glow-expand {
        0% { transform: scale(0.8); opacity: 0; }
        30% { opacity: 0.6; }
        100% { transform: scale(2.8); opacity: 0; }
      }
      
      .hotspot .tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(-8px);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        white-space: nowrap;
        opacity: 0;
        transition: 0.3s;
      }
      
      .hotspot:hover .tooltip { opacity: 1; }
      
      .hotspot .dot-core {
        width: 11px; /* Reduced from 14px */
        height: 11px;
        background: #1e3a8a; /* Dark Blue for existing */
        border-radius: 50%;
        position: relative;
        z-index: 2;
        box-shadow: 0 0 10px rgba(30, 58, 138, 0.5);
        display: flex; /* Center the icon */
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 8px;
        font-weight: bold;
        line-height: 1;
      }
      
      .hotspot .dot-core.numeric {
        background: #ef4444 !important;
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.5) !important;
      }

      /* Color Systems */
      .marker-existing .dot-core { background: #1e3a8a; box-shadow: 0 0 10px rgba(30, 58, 138, 0.5); }
      .marker-new .dot-core { background: #4EBBFF; box-shadow: 0 0 10px rgba(78, 187, 255, 0.5); }
      .marker-measure .dot-core { background: #a3e635 !important; box-shadow: 0 0 10px rgba(163, 230, 53, 0.5); }

      /* Animation Suppression: Only show ripples when selected */
      .hotspot:not(.selected) .glow-ring {
        display: none !important;
      }
      
      .hotspot.selected .glow-ring {
        display: block !important;
      }

      .hotspot.selected.marker-existing .glow-ring { border-color: rgba(30, 58, 138, 0.4); }
      .hotspot.selected.marker-new .glow-ring { border-color: rgba(78, 187, 255, 0.4); }
      .hotspot.selected.marker-measure .glow-ring { border-color: rgba(163, 230, 53, 0.4); }

      .hotspot.selected.marker-existing .dot-core { background: #1e3a8a; box-shadow: 0 0 15px #1e3a8a; }
      .hotspot.selected.marker-new .dot-core { background: #4EBBFF; box-shadow: 0 0 15px #4EBBFF; }
      .hotspot.selected.marker-measure .dot-core { background: #a3e635; box-shadow: 0 0 15px #a3e635; }
      
      /* Site Container & Spider Expansion */
      .site-container {
        position: absolute;
        width: 0;
        height: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
        pointer-events: none; /* Let children handle it */
      }

      .site-container:hover {
        z-index: 100; /* Bring to front on hover */
      }

      .sub-marker {
        z-index: 5;
        opacity: 0;
        pointer-events: none;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform: translate(-50%, -50%) scale(0.2);
      }

      .site-container:hover:not(.no-spread) .sub-marker {
        opacity: 1;
        pointer-events: auto;
        /* Spider layout expansion using calculate angle and radius */
        transform: translate(calc(-50% + cos(var(--angle)) * 34px), calc(-50% + sin(var(--angle)) * 34px)) scale(0.9);
      }

      .main-marker {
        z-index: 10;
        transition: transform 0.3s;
      }

      .site-container:hover:not(.no-spread) .main-marker {
        transform: translate(-50%, -50%) scale(0.85);
        opacity: 0.6;
      }

      .site-count {
        position: absolute;
        top: -6px;
        right: -6px;
        background: #ef4444;
        color: white;
        font-size: 9px;
        padding: 1px 4px;
        border-radius: 8px;
        border: 1.5px solid white;
        font-weight: bold;
        pointer-events: none;
      }

      /* Measurement active overrides */
      .measuring-active .site-container { pointer-events: none; }
      .drawing-active .site-container { pointer-events: none; }

      /* Toolbar Dock (Top Right) */
      .toolbar-dock {
        position: absolute;
        top: 16px;
        right: 16px; 
        width: 44px;
        background: rgba(245, 245, 245, 0.6);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 22px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 10px 0;
        gap: 8px;
        z-index: 100;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .dock-item {
        width: 32px;
        height: 32px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s;
        color: #475569;
      }
      
      .dock-item:hover {
        background: rgba(0, 82, 217, 0.08);
        color: var(--primary-blue);
        transform: scale(1.1);
      }
      
      .dock-divider {
        width: 20px;
        height: 1px;
        background: rgba(0, 0, 0, 0.05);
        margin: 2px 0;
      }
      /* Spatial Navigation Filters */
      .spatial-nav-tools {
        position: absolute;
        top: 16px;
        right: 76px; /* Adjacent to toolbar dock (44px width + 16px right margin + 16px gap) */
        height: 34px; /* Align with breadcrumb height */
        z-index: 101;
        display: flex;
        align-items: center;
      }

      .spatial-filter-group {
        display: flex;
        gap: 8px;
        background: rgba(255, 255, 255, 0.5);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        padding: 4px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.4);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }

      .spatial-dropdown {
        position: relative;
        height: 26px;
      }

      .spatial-trigger {
        height: 100%;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 10px;
        background: rgba(255, 255, 255, 0.4);
        border: 1px solid rgba(0, 0, 0, 0.05);
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        color: #475569;
        font-weight: 500;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .spatial-trigger:hover {
        background: rgba(255, 255, 255, 0.8);
        border-color: var(--primary-blue);
        color: var(--primary-blue);
      }

      .spatial-dropdown.selected .spatial-trigger {
        background: rgba(0, 82, 217, 0.1);
        border-color: var(--primary-blue);
        color: var(--primary-blue);
      }

      .spatial-arrow {
        font-size: 8px;
        opacity: 0.5;
      }

      .spatial-options-panel {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 140px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.5);
        padding: 6px 0;
        display: none;
        z-index: 1002;
        animation: dropFade 0.2s ease-out;
      }

      .spatial-dropdown.open .spatial-options-panel {
        display: block;
      }

      .options-header {
        padding: 4px 12px 8px;
        margin-bottom: 4px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.03);
        font-size: 10px;
        color: #94a3b8;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .spatial-option {
        padding: 8px 16px;
        font-size: 12px;
        color: #334155;
        cursor: pointer;
        transition: 0.2s;
      }

      .spatial-option:hover {
        background: rgba(0, 82, 217, 0.08);
        color: var(--primary-blue);
        padding-left: 20px;
      }

      .spatial-option-reset {
        margin-top: 4px;
        border-top: 1px solid rgba(0, 0, 0, 0.03);
        padding: 8px 16px;
        font-size: 11px;
        color: #ef4444;
        cursor: pointer;
        text-align: center;
        font-weight: 500;
      }

      .spatial-option-reset:hover {
        background: rgba(239, 68, 68, 0.05);
      }

      /* Timeline Styles */
      .spatial-timeline {
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        width: 85%;
        max-width: 1000px;
        background: transparent;
        padding: 12px 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 11000; /* Super high to stay above all side panels and sidebars */
        animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
        overflow: visible; /* Ensure nothing is clipped inside the timeline */
      }

      .spatial-timeline > * { pointer-events: auto; }

      @keyframes fadeInUp {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }

      .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
        position: relative;
        z-index: 11002; /* Stay above markers and lines */
        pointer-events: none; /* Allow underlying track to be interactive where buttons are NOT present */
      }

      .timeline-header > * {
        pointer-events: auto; /* Buttons remain interactive */
        transform: translateY(30px); /* Move buttons down exactly 30px */
      }

      .calendar-trigger {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.05);
        padding: 4px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: 0.3s;
        border: 1px solid transparent;
      }

      .calendar-trigger:hover {
        background: rgba(59, 130, 246, 0.2);
        border-color: rgba(59, 130, 246, 0.3);
      }

      .range-label {
        font-size: 11px;
        color: #94a3b8;
        font-family: 'Inter', sans-serif;
      }

      .tab-indicator {
        font-size: 10px;
        font-weight: 700;
        color: #3b82f6;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .timeline-main {
        position: relative;
        padding: 60px 0 20px; /* Further increased top padding for bubble room */
        overflow: visible;
      }

      .timeline-visual-track {
        position: relative;
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: visible; /* Ensure labels/stars aren't clipped */
      }

      .track-line {
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent);
      }

      .markers-layer {
        position: absolute;
        inset: 0;
        top: -4px;
        bottom: -4px;
        overflow: visible;
      }

      .timeline-record-marker {
        position: absolute;
        width: 12px; /* Base container size */
        height: 12px;
        transform: translateX(-50%);
        cursor: pointer;
        z-index: 10;
        overflow: visible;
      }

      .marker-body {
        width: 8px;
        height: 8px;
        background: #94a3b8;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.8);
        transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .timeline-record-marker:hover .marker-body {
        background: white;
        transform: translate(-50%, -50%) scale(1.5);
      }

      .timeline-record-marker.has-3d .marker-body {
        background: #3b82f6;
        box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
      }

      .timeline-record-marker.selected .marker-body {
        background: #fbbf24;
        clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        transform: translate(-50%, -50%) scale(2.8); /* Scale ONLY the star body */
        border-radius: 0;
        box-shadow: none !important;
        filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.8));
      }

      .timeline-record-marker.selected {
        z-index: 50; /* Ensure selected marker is above everything */
      }

      /* Pin Stem (Removed as per request) */

      /* Bubble-style Label (Disabled as per request) */
      .pin-label { display: none !important; }

      @keyframes subtleStarPulse {
        0% { filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8)); }
        50% { filter: drop-shadow(0 0 16px rgba(59, 130, 246, 0.6)); }
        100% { filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8)); }
      }
      
      .timeline-record-marker.selected {
        animation: subtleStarPulse 2s infinite;
      }

      .timeline-axis {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
        padding: 0 10px;
      }

      .timeline-axis span {
        font-size: 10px;
        color: #64748b;
        font-weight: 700;
        font-family: 'Inter', sans-serif;
        letter-spacing: 0.5px;
      }

      /* Drilldown visibility logic */
      .spatial-timeline,
      #spatial-filters {
        display: none;
      }

      .drilldown-active .spatial-timeline,
      .drilldown-active ~ #spatial-filters {
        display: flex; /* REMOVED !IMPORTANT TO ALLOW JS OVERRIDE */
      }
      
      /* Disable timeline in Marking/Measurement Interface - KEEP IMPORTANT TO OVERRIDE DRILLDOWN FLEX */
      .drilldown-active:has(.drawing-active) .spatial-timeline,
      .drilldown-active:has(.measuring-active) .spatial-timeline,
      .scene-container.drawing-active ~ .spatial-timeline,
      .scene-container.measuring-active ~ .spatial-timeline {
        display: none !important;
      }
      
      .spatial-timeline { pointer-events: auto; }

      .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0; /* REMOVED PADDING TO ALIGN WITH TRACK EDGES */
        position: relative;
        margin-bottom: 4px;
      }

      .header-left, .header-right {
        flex: 1;
        display: flex;
        align-items: center;
      }

      .header-center {
        flex: 2;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .header-right {
        justify-content: flex-end;
      }

      .calendar-trigger {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #94a3b8;
        font-size: 11px;
        cursor: pointer;
        padding: 4px 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        transition: 0.2s;
      }

      .calendar-trigger:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      .timeline-tab-label {
        font-size: 11px;
        font-weight: 700;
        color: #3b82f6;
        letter-spacing: 1px;
        text-transform: uppercase;
        background: rgba(59, 130, 246, 0.1);
        padding: 4px 16px;
        border-radius: 20px;
        border: 1px solid rgba(59, 130, 246, 0.2);
        white-space: nowrap;
      }

      .btn-timeline-action {
        background: rgba(255, 255, 255, 0.05);
        color: #94a3b8;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
      }

      .btn-timeline-action:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }

      .btn-timeline-action .icon {
        font-size: 10px;
        color: #3b82f6; /* Keep the lightning bolt slightly blue for "action" feel */
      }

      /* Drawing & Measurement Mode Styles */
      .scene-container.drawing-active,
      .scene-container.measuring-active {
        cursor: crosshair;
      }
      
      .spatial-banner {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(59, 130, 246, 0.4);
        padding: 8px 22px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 12px;
        color: white;
        font-size: 13px;
        font-weight: 500;
        z-index: 2000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255,255,255,0.05);
        animation: fadeInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
      }

      @keyframes fadeInDown {
        from { opacity: 0; transform: translate(-50%, -20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }

      .banner-icon { 
        color: #3b82f6; 
        font-size: 16px;
        filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.5));
      }


      @keyframes pulse {
        0% { opacity: 0.7; }
        50% { opacity: 1; }
        100% { opacity: 0.7; }
      }

      .new-marker .dot-core,
      .marker-measure .dot-core {
        background: #a3e635 !important;
        box-shadow: 0 0 8px rgba(163, 230, 53, 0.8);
      }

      .measure-tooltip {
        position: absolute;
        background: #a3e635;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        transform: translate(-50%, -120%);
        pointer-events: none;
        z-index: 100;
      }

      .toolbar-dock .dock-item.active {
        background: rgba(163, 230, 53, 0.1);
        color: #a3e635;
        box-shadow: inset 0 0 0 1px rgba(163, 230, 53, 0.2);
      }

      .confirm-dialog {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 240px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.05);
        z-index: 2000;
        animation: scaleUp 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);
      }

      @keyframes scaleUp {
        from { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
        to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }

      .confirm-header {
        padding: 12px;
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
        text-align: center;
        border-bottom: 1px solid #f1f5f9;
      }

      .confirm-content {
        padding: 16px;
        text-align: center;
      }

      .coord-label {
        font-size: 10px;
        color: #94a3b8;
        margin-bottom: 4px;
      }

      .coord-value {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        color: #3b82f6;
        font-weight: 600;
      }

      .confirm-footer {
        display: flex;
        border-top: 1px solid #f1f5f9;
      }

      .btn-confirm {
        flex: 1;
        padding: 10px;
        border: none;
        background: none;
        font-size: 12px;
        color: #64748b;
        cursor: pointer;
        transition: 0.2s;
      }

      .btn-confirm:hover {
        background: #f8fafc;
      }

      .btn-confirm.primary {
        color: #3b82f6;
        font-weight: 600;
        border-left: 1px solid #f1f5f9;
      }

      .btn-confirm.primary:hover {
        background: rgba(59, 130, 246, 0.05);
      }

      .calendar-popup {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 360px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(25px) saturate(180%);
        -webkit-backdrop-filter: blur(25px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.5);
        border-radius: 16px;
        z-index: 2500;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        animation: popupScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        display: none;
        flex-direction: column;
        pointer-events: auto;
      }

      @keyframes popupScale {
        from { opacity: 0; transform: translate(-50%, -45%) scale(0.95); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }

      .calendar-popup-header {
        padding: 20px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      }

      .calendar-popup-header span {
        font-size: 15px;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: -0.01em;
      }

      .btn-close-calendar {
        background: #f1f5f9;
        border: none;
        color: #64748b;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-close-calendar:hover { 
        background: #e2e8f0;
        color: #0f172a;
      }

      .calendar-content { 
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .date-range-picker {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .date-input-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .date-input-group label {
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .input-with-icon {
        position: relative;
        display: flex;
        align-items: center;
      }

      .input-icon {
        position: absolute;
        left: 12px;
        font-size: 14px;
        pointer-events: none;
      }

      #start-date-input, #end-date-input {
        width: 100%;
        padding: 10px 12px 10px 38px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        color: #334155;
        outline: none;
        transition: all 0.2s;
      }

      #start-date-input:focus, #end-date-input:focus {
        border-color: #3b82f6;
        background: #ffffff;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
      }

      .date-range-separator {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 4px 0;
      }

      .separator-line {
        flex: 1;
        height: 1px;
        background: #f1f5f9;
      }

      .separator-text {
        font-size: 11px;
        color: #cbd5e1;
        font-weight: 500;
      }

      .calendar-quick-ranges {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .range-chip {
        padding: 6px 12px;
        background: #f1f5f9;
        border: 1px solid transparent;
        border-radius: 20px;
        color: #64748b;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .range-chip:hover {
        background: #e2e8f0;
        color: #1e293b;
      }

      .range-chip.active {
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.2);
        color: #3b82f6;
      }

      .calendar-footer {
        padding: 20px 24px 24px;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
        display: flex;
        gap: 12px;
      }

      .btn-reset-calendar, .btn-apply-calendar {
        flex: 1;
        padding: 12px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        outline: none;
      }

      .btn-reset-calendar {
        background: #f8fafc;
        color: #64748b;
        border: 1px solid #e2e8f0;
      }

      .btn-reset-calendar:hover {
        background: #f1f5f9;
        color: #1e293b;
        border-color: #cbd5e1;
      }

      .btn-apply-calendar {
        background: #0052d9; /* Standard primary blue */
        color: white;
        border: none;
        box-shadow: 0 4px 12px rgba(0, 82, 217, 0.2);
      }

      .btn-apply-calendar:hover {
        background: #0045b8;
        transform: translateY(-1px);
        box-shadow: 0 6px 15px rgba(0, 82, 217, 0.3);
      }
    `;
    document.head.appendChild(style);
  }
}
