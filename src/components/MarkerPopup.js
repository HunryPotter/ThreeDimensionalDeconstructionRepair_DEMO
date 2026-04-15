export class MarkerPopup {
  constructor(parentContainer) {
    this.parent = parentContainer;
    this.container = null;
    this.data = null;
    this.isVisible = false;
    this.activeSectionTab = 'SR'; // Local tab state for SR/CRS toggle
    this.selectedId = null; // Track which specific SR/CRS is highlighted
    this.init();
  }

  init() {
    this.container = document.createElement('div');
    this.container.className = 'marker-detail-popup';
    this.container.style.display = 'none';
    this.parent.appendChild(this.container);
    this.addStyles();
    this.initGlobalEvents();
  }

  initGlobalEvents() {
    window.addEventListener('confirm-delete-action', (e) => {
      const id = e.detail.id;
      if (this.data && this.data.id === id) {
        this.hide();
      }
    });
  }

  show(markerData) {
    this.data = markerData;
    this.isVisible = true;
    
    // Initial selection sync: Default to the first record of active tab if none set
    if (!this.selectedId) {
      if (this.activeSectionTab === 'SR' && this.data.srRecords?.length > 0) {
        this.selectedId = this.data.srRecords[0].id;
      } else if (this.activeSectionTab === 'CRS') {
        const firstCrs = this.data.srRecords?.flatMap(sr => sr.crsRecords || [])[0];
        if (firstCrs) this.selectedId = firstCrs.id;
      }
    }

    this.render();
    this.container.style.display = 'block';
    this.initEvents();
    setTimeout(() => this.updateLeaderLine(), 50);
  }

  hide() {
    this.isVisible = false;
    this.container.style.display = 'none';
    this.clearLeaderLine();
  }

  updateLeaderLine() {
    const dot = document.getElementById('main-hotspot'); // In this demo we still assume the primary dot
    const svgLayer = document.getElementById('leader-line-svg');
    const path = document.getElementById('leader-line-path');

    if (!dot || !svgLayer || !path || !this.isVisible) return;

    const dotRect = dot.getBoundingClientRect();
    const svgRect = svgLayer.getBoundingClientRect();
    const popupRect = this.container.getBoundingClientRect();

    const x1 = dotRect.left - svgRect.left + dotRect.width / 2;
    const y1 = dotRect.top - svgRect.top + dotRect.height / 2;

    let x2, y2;
    if (dotRect.left < popupRect.left) {
      x2 = popupRect.left - svgRect.left;
      y2 = popupRect.top - svgRect.top + 20; // Point to header area
    } else {
      x2 = popupRect.right - svgRect.left;
      y2 = popupRect.top - svgRect.top + 20;
    }

    const midX = x1 + (x2 - x1) * 0.3;
    path.setAttribute('d', `M ${x1} ${y1} L ${midX} ${y1} L ${x2} ${y2}`);
    path.setAttribute('stroke', '#0EA5E9'); // Light blue for detailed popup
  }

  clearLeaderLine() {
    const path = document.getElementById('leader-line-path');
    if (path) path.setAttribute('d', '');
  }

  render() {
    const m = this.data;
    if (!m) return;

    const coords = m.coords ? `X: ${m.coords.x.toFixed(1)} / Y: ${m.coords.y.toFixed(1)} / Z: 0.0` : '--';
    const typeLabel = (m.typeLabels || []).join(' & ') || '未知损伤';
    
    this.container.innerHTML = `
      <div class="m-popup-header">
        <div class="m-popup-id-badge">
          <span class="m-id">${m.id}</span>
        </div>
        <button class="m-btn-close">×</button>
      </div>
      <div class="m-popup-body">
        <div class="m-meta-row">
          <span class="m-label">损伤分类:</span>
          <span class="m-value highlight">${typeLabel}</span>
        </div>
        <div class="m-meta-row">
          <span class="m-label">三维座标:</span>
          <span class="m-value mono">${coords}</span>
        </div>
        <div class="m-meta-row">
          <span class="m-label">创建日期:</span>
          <span class="m-value">${m.date || '--'}</span>
        </div>

        <div class="m-action-section">
          <div class="m-tab-header">
            <div class="m-tab-item ${this.activeSectionTab === 'SR' ? 'active' : ''}" data-section="SR">维修申请 (SR)</div>
            <div class="m-tab-item ${this.activeSectionTab === 'CRS' ? 'active' : ''}" data-section="CRS">修理方案 (CRS)</div>
          </div>
          
          <div class="m-tab-body">
            ${this.activeSectionTab === 'SR' ? `
              <div class="m-doc-list">
                ${(m.srRecords || []).map(sr => `
                  <div class="m-doc-item ${this.selectedId === sr.id ? 'selected' : ''}">
                    <div class="m-doc-info">
                      <span class="m-doc-type">SR</span>
                      <span class="m-doc-id">${sr.id}</span>
                    </div>
                    <button class="m-btn-portal" data-target-type="SR" data-id="${sr.id}">查看详情</button>
                  </div>
                `).join('')}
                ${(!m.srRecords || m.srRecords.length === 0) ? '<div class="m-empty">暂无关联 SR 单据</div>' : ''}
              </div>
            ` : `
              <div class="m-doc-list">
                ${(m.srRecords || []).flatMap(sr => (sr.crsRecords || []).map(crs => ({ ...crs, parentSrId: sr.id }))).map(crs => `
                  <div class="m-doc-item ${this.selectedId === crs.id ? 'selected' : ''}">
                    <div class="m-doc-info">
                      <span class="m-doc-type crs">CRS</span>
                      <span class="m-doc-id">${crs.id}</span>
                    </div>
                    <button class="m-btn-portal" data-target-type="CRS" data-id="${crs.id}" data-parent-sr="${crs.parentSrId}">查看详情</button>
                  </div>
                `).join('')}
                ${!(m.srRecords && m.srRecords.some(sr => sr.crsRecords && sr.crsRecords.length > 0)) ? '<div class="m-empty">暂无关联 CRS 方案</div>' : ''}
              </div>
            `}
          </div>
        </div>
      </div>
      <div class="m-popup-footer">
         <span class="m-location-tag">${m.ataCode || 'ATA --'}</span>
      </div>
    `;
  }

  initEvents() {
    const closeBtn = this.container.querySelector('.m-btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Tab switching with seamless sidebar sync (Context-Aware)
    const tabs = this.container.querySelectorAll('.m-tab-item');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const section = tab.dataset.section;
        const currentId = this.selectedId;
        
        // Find the SR context we are coming from or going to
        let activeSr = null;
        if (this.activeSectionTab === 'SR') {
          activeSr = this.data.srRecords.find(sr => sr.id === currentId);
        } else {
          // If we were in CRS, find which SR it belonged to
          activeSr = this.data.srRecords.find(sr => sr.crsRecords?.some(crs => crs.id === currentId));
        }

        let canSync = true;
        let targetId = null;

        if (section === 'CRS') {
          // Rule: Only sync if the CURRENTLY SELECTED SR has CRS
          if (activeSr && activeSr.crsRecords?.length > 0 && activeSr.manualStatus === 'published') {
            targetId = activeSr.crsRecords[0].id;
          } else {
            canSync = false;
          }
        } else if (section === 'SR') {
          // Always allow sync back to its parent SR
          targetId = activeSr ? activeSr.id : (this.data.srRecords[0]?.id);
        }

        if (canSync && targetId) {
          this.selectedId = targetId;
          window.dispatchEvent(new CustomEvent('damage-marker-select', { 
            detail: {
              ...this.data,
              forceTab: section,
              targetSrId: activeSr ? activeSr.id : targetId
            }
          }));
        } else if (section === 'CRS' && !canSync) {
          // Contextual sync: If current SR has no CRS, close the right panel
          if (window.app) window.app.toggleRightPanel(false);
        }

        this.activeSectionTab = section;
        this.render();
        this.initEvents();
      });
    });

    const portalBtns = this.container.querySelectorAll('.m-btn-portal');
    portalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.targetType;
        const id = btn.dataset.id;
        const parentSrId = btn.dataset.parentSr;

        this.selectedId = id;
        this.render();
        this.initEvents();

        // Trigger sidebar highlight and tab switch, while forcing it open
        if (window.app) window.app.toggleRightPanel(true);
        window.dispatchEvent(new CustomEvent('damage-marker-select', { 
           detail: {
             ...this.data,
             forceTab: type,
             targetSrId: type === 'SR' ? id : parentSrId,
             targetCrsId: type === 'CRS' ? id : null
           }
        }));
      });
    });

    window.addEventListener('resize', () => {
      if (this.isVisible) this.updateLeaderLine();
    });
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .marker-detail-popup {
        position: absolute;
        top: 40%;
        left: 65%;
        width: 280px;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(0, 0, 0, 0.05);
        border-radius: 6px;
        box-shadow: 
          0 10px 40px rgba(0, 0, 0, 0.1), 
          0 0 1px rgba(0, 0, 0, 0.1);
        z-index: 1001;
        color: #1e293b;
        font-family: 'Inter', sans-serif;
        overflow: hidden;
      }

      .m-popup-header {
        padding: 8px 12px;
        background: #475569;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: white;
      }

      .m-popup-id-badge {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .m-id {
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        font-weight: 700;
        color: #ffffff;
      }

      .m-btn-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        transition: color 0.1s;
      }

      .m-btn-close:hover { color: white; }

      .m-popup-body { padding: 12px; }

      .m-meta-row {
        margin-bottom: 8px;
        font-size: 11px;
        display: flex;
        justify-content: space-between;
      }

      .m-label { color: #64748b; }
      .m-value { font-weight: 600; color: #1e293b; }
      .m-value.highlight { color: #0052d9; }
      .m-value.mono { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #64748b; }

      .m-action-section {
        margin-top: 14px;
        padding-top: 10px;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
      }

      .m-tab-header {
        display: flex;
        gap: 12px;
        margin-bottom: 10px;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 4px;
      }

      .m-tab-item {
        font-size: 11px;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px 0;
        position: relative;
        font-weight: 600;
        transition: color 0.2s;
      }

      .m-tab-item:hover { color: #475569; }

      .m-tab-item.active {
        color: #0052d9;
      }

      .m-tab-item.active::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 0;
        width: 100%;
        height: 2px;
        background: #0052d9;
        border-radius: 1px;
      }

      .m-tab-body { min-height: 100px; }

      .m-doc-list { display: flex; flex-direction: column; gap: 4px; }

      .m-doc-item {
        background: #f8fafc;
        padding: 6px 8px;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid #e2e8f0;
        transition: all 0.2s;
      }

      .m-doc-item.selected {
        border-color: #0052d9;
        background: rgba(0, 82, 217, 0.04);
        box-shadow: 0 0 0 1px #0052d9;
      }

      .m-doc-info { display: flex; align-items: center; gap: 6px; }
      .m-doc-type {
        font-size: 8px;
        background: #0052d9;
        color: white;
        padding: 1px 4px;
        border-radius: 3px;
        font-weight: 800;
      }
      .m-doc-type.crs { background: #8b5cf6; } 
      .m-doc-id { font-size: 11px; font-weight: 700; color: #334155; }

      .m-btn-portal {
        background: white;
        border: 1px solid #0052d9;
        color: #0052d9;
        font-size: 10px;
        padding: 3px 6px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 600;
      }
      .m-btn-portal:hover {
        background: #0052d9;
        color: white;
      }

      .m-empty { font-size: 11px; color: #94a3b8; text-align: center; font-style: italic; }

      .m-popup-footer {
        padding: 6px 12px;
        background: rgba(0, 0, 0, 0.02);
        display: flex;
        justify-content: flex-end;
      }

      .m-location-tag {
        font-size: 9px;
        color: #94a3b8;
        font-weight: 700;
      }
    `;
    document.head.appendChild(style);
  }
}
