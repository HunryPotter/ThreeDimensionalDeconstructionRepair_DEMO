import { NavigationBar } from '../navigation-bar/NavigationBar.js';
import { RecordSidebar } from '../record-sidebar/RecordSidebar.js';
import { DetailSidebar } from '../detail-sidebar/DetailSidebar.js';
import { CaseDrillDownView } from './components/CaseDrillDownView.js';
import { SpatialView } from '../spatial-view/SpatialView.js';
import { PopupManager } from '../../components/PopupManager.js';
import { MarkerPopup } from '../../components/MarkerPopup.js';
import casePdf from '../../../prototype/CASE.pdf';

export class ExternalCaseView {
  constructor(container) {
    this.container = container;
    this.isVisible = false;
    this.markerEntryActive = false;
    this.structureTree = null;
    this.markerSpatialView = null;
    this.markerNavBar = null;
    this.hasMarker = false;
    this.markerState = 0; // 0: initial, 1: marking, 2: confirmed
    this.selectedAircraft = null; // { registration, msn, aircraftType, airline }
    
    // Instance management for CASE workspace
    this.caseLeftSidebar = null;
    this.caseRightSidebar = null;
    this.caseSpatialView = null;
    this.casePopupManager = null;
    this.caseMarkerPopup = null;
    
    this.render();
  }

  render() {
    // Prevent duplicate injection: Clean up existing instance if any
    const existing = this.container.querySelector('#external-case-container');
    if (existing) existing.remove();

    const template = `
      <div id="external-case-container" class="external-view" style="display: none;">
        <!-- Original CASE System View -->
        <div id="case-main-view" class="case-main-layout">
            <!-- Embedded PDF Site -->
            <div class="pdf-frame-wrapper">
              <embed src="${casePdf}" type="application/pdf" width="100%" height="100%" />
            </div>

            <!-- Float Return Action -->
            <button id="btn-return-to-app" class="float-return-btn">
              <span class="icon">➔</span> 返回系统
            </button>

            <!-- Overlay Banner -->
            <div class="external-header">
                <div class="external-logo">CASE 业务系统</div>
                <div class="external-header-actions">
                  <div class="external-status">仿真环境运营中</div>
                </div>
            </div>

            <!-- Case Details / Theme Panel -->
            <div class="case-info-panel">
                <div class="info-section marker-theme-section">
                    <h4 class="section-title">三维损伤标记</h4>
                    <div class="marker-status-row">
                        <span class="label">标记状态:</span>
                        <span id="marker-status-tag" class="status-tag ${this.hasMarker ? 'has' : 'none'}">
                            ${this.hasMarker ? '● 已有标记' : '○ 暂无标记'}
                        </span>
                    </div>
                    <button id="btn-initiate-marker" class="btn-theme-action">
                        ${this.hasMarker ? '查看/编辑三维损伤标记' : '添加三维损伤标记'}
                    </button>
                    <button id="btn-delete-marker" class="btn-theme-action delete" style="${this.hasMarker ? '' : 'display: none;'} margin-top: 8px;">
                        删除三维损伤标记
                    </button>
                </div>
            </div>
        </div>

        <!-- Case Delete Confirmation Popup -->
        <div id="case-delete-confirm" class="confirm-dialog" style="display: none;">
          <div class="confirm-header">是否确认删除</div>
          <div class="confirm-content" style="padding: 20px; font-size: 13px; color: #64748b;">
            删除后标记点将不可恢复，是否确定？
          </div>
          <div class="confirm-footer">
            <button id="btn-delete-no" class="btn-confirm">否</button>
            <button id="btn-delete-yes" class="btn-confirm primary">是</button>
          </div>
        </div>

        <!-- Marker Entry Interface (Standardized Grid Layout) -->
        <div id="marker-entry-view" class="marker-entry-page standard-grid-layout right-collapsed" style="display: none;">
            <header class="header-region" id="marker-header-mount"></header>
            <aside class="left-panel-region" id="marker-left-mount"></aside>
            <main class="main-view-region" id="marker-main-mount"></main>
            <aside class="right-panel-region" id="marker-right-mount"></aside>
            
            <!-- Global Floating Badge (Absolute within the grid container) -->
            <div id="case-aircraft-indicator" class="case-aircraft-badge" style="display: none;">
              <span class="badge-label">当前关联架次</span>
              <span class="badge-value" id="case-aircraft-badge-value">-- / --</span>
            </div>
        </div>

        <!-- Case Aircraft Selector Popup -->
        <div id="case-aircraft-selector" class="confirm-dialog aircraft-selector-dialog" style="display: none;">
          <div class="confirm-header">关联三维空间架次</div>
          <div class="confirm-content" style="padding: 16px;">
            <div style="font-size: 12px; color: #64748b; margin-bottom: 12px;">请从 CASE 业务记录对应的架次中选择，以同步三维损伤分布数据：</div>
            <div class="case-aircraft-list" id="case-aircraft-list-mount">
              <!-- JS Injected List -->
            </div>
          </div>
          <div class="confirm-footer">
            <button id="btn-aircraft-cancel" class="btn-confirm">取消</button>
            <button id="btn-aircraft-confirm" class="btn-confirm primary" disabled>确认并进入空间</button>
          </div>
        </div>
      </div>
    `;
    this.container.insertAdjacentHTML('beforeend', template);

    this.addStyles();
    this.initEvents();
  }

  initEvents() {
    const returnBtn = this.container.querySelector('#btn-return-to-app');
    if (returnBtn) {
      returnBtn.addEventListener('click', () => {
        this.hide(); // Ensure hidden when returning
        window.dispatchEvent(new CustomEvent('return-from-external'));
      });
    }

    const initiateBtn = this.container.querySelector('#btn-initiate-marker');
    if (initiateBtn) {
      initiateBtn.addEventListener('click', () => {
        this.showAircraftSelector();
      });
    }

    // Delete Marker Events
    const deleteBtn = this.container.querySelector('#btn-delete-marker');
    const deleteConfirm = this.container.querySelector('#case-delete-confirm');
    if (deleteBtn && deleteConfirm) {
      deleteBtn.addEventListener('click', () => {
        deleteConfirm.style.display = 'block';
      });

      deleteConfirm.querySelector('#btn-delete-no').addEventListener('click', () => {
        deleteConfirm.style.display = 'none';
      });

      deleteConfirm.querySelector('#btn-delete-yes').addEventListener('click', () => {
        deleteConfirm.style.display = 'none';
        this.hasMarker = false;
        this.updateThemeUI();
      });
    }

    // Aircraft Selector Events
    const aircraftSelector = this.container.querySelector('#case-aircraft-selector');
    if (aircraftSelector) {
      aircraftSelector.querySelector('#btn-aircraft-cancel').addEventListener('click', () => {
        aircraftSelector.style.display = 'none';
      });

      aircraftSelector.querySelector('#btn-aircraft-confirm').addEventListener('click', () => {
        if (this.selectedAircraft) {
          aircraftSelector.style.display = 'none';
          this.enterMarkerEntryMode();
        }
      });
    }

    const cancelBtn = this.container.querySelector('#btn-cancel-entry');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.exitMarkerEntryMode();
      });
    }
  }

  showAircraftSelector() {
    const selector = this.container.querySelector('#case-aircraft-selector');
    const listMount = this.container.querySelector('#case-aircraft-list-mount');
    if (!selector || !listMount) return;

    // Simulate aircraft list from CASE background
    const mockAircrafts = [
      { registration: 'B91901P', msn: '10001', aircraftType: '基本型', airline: '中国东航' },
      { registration: 'B91911P', msn: '10011', aircraftType: '基本型', airline: '中国国航' },
      { registration: 'B91921P', msn: '10021', aircraftType: '基本型', airline: '南方航空' }
    ];

    listMount.innerHTML = mockAircrafts.map(ac => `
      <div class="case-aircraft-item" data-msn="${ac.msn}">
        <div class="ac-main">${ac.registration}</div>
        <div class="ac-sub">MSN: ${ac.msn} | ${ac.airline}</div>
      </div>
    `).join('');

    const items = listMount.querySelectorAll('.case-aircraft-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        this.selectedAircraft = mockAircrafts.find(a => a.msn === item.dataset.msn);
        selector.querySelector('#btn-aircraft-confirm').disabled = false;
      });
    });

    selector.style.display = 'block';
  }

  enterMarkerEntryMode() {
    this.markerEntryActive = true;
    this.markerState = 0; // Reset state on entry

    const entryView = this.container.querySelector('#marker-entry-view');
    const mainView = this.container.querySelector('#case-main-view');
    if (entryView) entryView.style.display = 'grid';
    if (mainView) mainView.style.display = 'none';

    const headerMount = this.container.querySelector('#marker-header-mount');
    const leftMount = this.container.querySelector('#marker-left-mount');
    const rightMount = this.container.querySelector('#marker-right-mount');
    const mainMount = this.container.querySelector('#marker-main-mount');

    // 1. Initialize Navigation
    if (!this.markerNavBar) {
      this.markerNavBar = new NavigationBar(headerMount);
      const navRight = headerMount.querySelector('.nav-right .utility-icons');
      if (navRight) {
        navRight.innerHTML = `
          <button id="btn-cancel-entry" class="btn-ghost-case" style="color: #cbd5e1;">返回CASE系统</button>
        `;
        this.initMarkerNavBarEvents();
      }
    }

    // 2. Initialize SpatialView (Always fresh to ensure DOM linkage)
    this.caseSpatialView = new SpatialView(mainMount);
    
    // Ensure timeline visibility
    const canvasContainer = mainMount.querySelector('#canvas-container');
    if (canvasContainer) {
      canvasContainer.classList.add('drilldown-active');
    }
    this.caseSpatialView.hideBanner();

    // 3. Initialize REAL Sidebars (Always fresh to ensure listeners bind to current DOM)
    this.caseLeftSidebar = new RecordSidebar(leftMount, {
      initialView: 'drilldown',
      context: 'case',
      drillDownViewClass: CaseDrillDownView
    });
    
    // Apply filters and RENDER
    if (this.selectedAircraft) {
      this.caseLeftSidebar.activeFilters.registration = this.selectedAircraft.registration;
      this.caseLeftSidebar.activeFilters.msn = this.selectedAircraft.msn;
      this.caseLeftSidebar.render();
    }

    this.caseRightSidebar = new DetailSidebar(rightMount);

    // Update Aircraft Badge
    const badge = this.container.querySelector('#case-aircraft-indicator');
    const badgeValue = this.container.querySelector('#case-aircraft-badge-value');
    if (badge && badgeValue && this.selectedAircraft) {
      badge.style.display = 'flex';
      badgeValue.textContent = `${this.selectedAircraft.registration} / MSN ${this.selectedAircraft.msn}`;
    }

    this.updateMarkerButton();

    // 5. Initialize Popups within the main mount
    if (!this.casePopupManager) {
      this.casePopupManager = new PopupManager(mainMount);
    }
    if (!this.caseMarkerPopup) {
      this.caseMarkerPopup = new MarkerPopup(mainMount);
    }

    // 6. Context-Aware Event Handling:
    if (!this._evBound) {
      window.addEventListener('damage-marker-select', (e) => {
        if (!this.markerEntryActive) return;
        this.caseMarkerPopup.show(e.detail);
        this.casePopupManager.hide();
      });

      window.addEventListener('site-click', (e) => {
        if (!this.markerEntryActive) return;
        const siteData = e.detail;
        if (siteData.isExisting && siteData.records.length > 0) {
          this.casePopupManager.show(siteData.records, siteData.records[0].id);
          this.caseMarkerPopup.hide();
        }
      });

      window.addEventListener('ata-branch-select', (e) => {
        if (!this.markerEntryActive) return;
        const ataCode = e.detail.ataCode;
        
        if (this.caseLeftSidebar) {
          const records = this.caseLeftSidebar.markerData.filter(m => m.ataCode.startsWith(ataCode));
          if (records.length > 0) {
            this.casePopupManager.show(records, records[0].id);
            this.caseMarkerPopup.hide();
          }
        }
      });

      this._evBound = true;
    }

    // Integrated Action Listeners (from Sidebar)
    window.addEventListener('request-case-button-sync', () => {
      if (!this.markerEntryActive) return;
      this.updateMarkerButton();
    });

    window.addEventListener('trigger-case-primary-action', () => {
      if (!this.markerEntryActive) return;
      this.handlePrimaryAction();
    });

    window.addEventListener('case-sidebar-toggle', (e) => {
      if (!this.markerEntryActive) return;
      const entryView = this.container.querySelector('#marker-entry-view');
      if (entryView) {
        if (e.detail.isCollapsed) entryView.classList.add('left-collapsed');
        else entryView.classList.remove('left-collapsed');
      }
    });

    this.updateMarkerButton();
    console.log('CASE Marking Workspace Initialized with High-Fidelity Components');
  }

  toggleRightPanel(show) {
    const entryView = this.container.querySelector('#marker-entry-view');
    if (!entryView) return;
    if (show === undefined) {
      entryView.classList.toggle('right-collapsed');
    } else if (show) {
      entryView.classList.remove('right-collapsed');
    } else {
      entryView.classList.add('right-collapsed');
    }
  }

  handlePrimaryAction() {
    if (this.markerState === 0) {
      if (!this.caseLeftSidebar.selectedBranchId) {
        window.dispatchEvent(new CustomEvent('request-internal-alert', {
          detail: {
            title: '操作限制',
            message: '在执行三维标记之前，请先在下方 ATA 结构树内选择具体的结构位置。'
          }
        }));
        return;
      }

      window.dispatchEvent(new CustomEvent('enter-drawing-mode', {
        detail: {
          context: 'case-system',
          ataCode: this.caseLeftSidebar.selectedBranchId,
          aircraft: this.selectedAircraft,
          caseRef: this
        }
      }));
      this.markerState = 1;
      this.updateMarkerButton();
    } else if (this.markerState === 2) {
      // Direct return as requested
      this.hasMarker = true;
      this.updateThemeUI();
      this.exitMarkerEntryMode();
    }
  }

  initMarkerNavBarEvents() {
    const cancelBtn = this.container.querySelector('#btn-cancel-entry');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.exitMarkerEntryMode();
      });
    }

    // Secondary Confirmation Listener
    window.addEventListener('confirm-technical-request', () => {
      if (this.markerEntryActive) {
        this.markerState = 2;
        this.updateMarkerButton();
      }
    });
  }

  updateMarkerButton() {
    // Current integrated button info from CaseDrillDownView
    const btnText = this.container.querySelector('#case-btn-text');
    const actionBtn = this.container.querySelector('#btn-case-action-integrated');
    if (!btnText || !actionBtn) return;

    if (this.markerState === 0) {
      btnText.innerHTML = `<span style="font-size: 14px;">🖌️</span> 开始三维标记`;
      actionBtn.disabled = false;
      actionBtn.style.background = '#0052d9';
      actionBtn.style.opacity = '1';
    } else if (this.markerState === 1) {
      btnText.innerHTML = `正在标记中...`;
      actionBtn.disabled = true;
      actionBtn.style.background = '#64748b';
      actionBtn.style.opacity = '0.6';
    } else if (this.markerState === 2) {
      btnText.innerHTML = `🏁 确认回传数据至 CASE`;
      actionBtn.disabled = false;
      actionBtn.style.background = '#22c55e'; // Green for completion
      actionBtn.style.opacity = '1';
    }
  }

  updateThemeUI() {
    const statusTag = this.container.querySelector('#marker-status-tag');
    const initiateBtn = this.container.querySelector('#btn-initiate-marker');

    if (statusTag) {
      statusTag.className = `status-tag ${this.hasMarker ? 'has' : 'none'}`;
      statusTag.textContent = this.hasMarker ? '● 已有标记数据' : '○ 暂无标记数据';
    }

    if (initiateBtn) {
      initiateBtn.textContent = this.hasMarker ? '查看/编辑三维损伤标记' : '开始三维损伤标记';
    }

    const deleteBtn = this.container.querySelector('#btn-delete-marker');
    if (deleteBtn) {
      deleteBtn.style.display = this.hasMarker ? 'block' : 'none';
    }
  }

  exitMarkerEntryMode() {
    this.markerState = 0;
    this.markerEntryActive = false;
    const entryView = this.container.querySelector('#marker-entry-view');
    const mainView = this.container.querySelector('#case-main-view');
    if (entryView) entryView.style.display = 'none';
    if (mainView) mainView.style.display = 'flex'; // Use flex to match layout

    // Ensure the theme UI is in sync when we return
    this.updateThemeUI();

    // Reset global interaction modes
    window.dispatchEvent(new CustomEvent('exit-interaction-modes'));
    
    // Explicitly reset the button state for next entry
    this.updateMarkerButton();
  }

  show() {
    this.isVisible = true;
    const view = this.container.querySelector('#external-case-container');
    if (view) view.style.display = 'block';
  }

  hide() {
    this.isVisible = false;
    const view = this.container.querySelector('#external-case-container');
    if (view) view.style.display = 'none';
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .external-view {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9999;
        background: #f8fafc;
        overflow: hidden;
      }

      .case-main-layout {
        width: 100%;
        height: 100%;
        position: relative;
        display: flex;
      }

      .case-info-panel {
        width: 320px;
        height: 100%;
        background: #ffffff;
        border-left: 1px solid #e2e8f0;
        padding: 24px;
        margin-top: 60px;
        box-shadow: -4px 0 12px rgba(0,0,0,0.02);
        z-index: 1000;
      }

      .pdf-frame-wrapper {
        flex: 1;
        height: calc(100% - 60px);
        margin-top: 60px;
        background: #f1f5f9;
        border-right: 1px solid #e2e8f0;
      }

      .external-header {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 60px;
        background: #1e293b;
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      .external-logo {
        font-weight: 700;
        letter-spacing: 1px;
        font-size: 18px;
        color: #38bdf8;
      }

      .external-status {
        font-size: 11px;
        color: #94a3b8;
        background: rgba(255,255,255,0.05);
        padding: 4px 12px;
        border-radius: 20px;
      }

      .float-return-btn {
        position: absolute;
        top: 12px;
        right: 24px;
        background: #38bdf8;
        color: #0f172a;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
        z-index: 10001;
      }

      .float-return-btn:hover {
        background: #7dd3fc;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(56, 189, 248, 0.4);
      }

      .float-return-btn .icon {
        transform: rotate(180deg);
        font-size: 16px;
      }

      /* Theme Section Styles */
      .section-title {
        font-size: 12px;
        text-transform: uppercase;
        color: #94a3b8;
        letter-spacing: 1px;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f1f5f9;
      }

      .info-section {
        margin-bottom: 32px;
      }

      .info-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .info-item {
        font-size: 13px;
      }

      .info-item .label {
        color: #64748b;
        margin-right: 8px;
      }

      .info-item .value {
        color: #1e293b;
        font-weight: 500;
      }

      .marker-status-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .status-tag {
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 600;
      }

      .status-tag.none {
        background: #fee2e2;
        color: #ef4444;
      }

      .status-tag.has {
        background: #dcfce7;
        color: #22c55e;
      }

      .btn-theme-action {
        width: 100%;
        background: #0052d9;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-theme-action:hover {
        background: #0045b5;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 82, 217, 0.2);
      }

      /* Floating Action Overlay */
      .marker-action-overlay {
        position: absolute;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        pointer-events: none;
      }

      .btn-primary-case.center-bottom {
        pointer-events: auto;
        padding: 12px 32px;
        font-size: 16px;
        border-radius: 30px;
        box-shadow: 0 10px 25px rgba(0, 82, 217, 0.3);
        animation: fadeInUp 0.4s ease-out;
      }

      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .external-header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .btn-case-action {
        background: #334155;
        color: white;
      }

      /* Premium Floating Aircraft Badge */
      .case-aircraft-badge {
        position: absolute;
        top: 76px; /* Below navbar */
        left: calc(var(--left-panel-width) + 16px);
        z-index: 1001; /* Above almost everything */
        display: flex;
        flex-direction: column;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(0, 82, 217, 0.2);
        border-radius: 10px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        pointer-events: none;
        transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        animation: badgeSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      }

      /* Adaptive left-adhesion when sidebar is collapsed */
      .marker-entry-page.left-collapsed .case-aircraft-badge {
        left: 16px;
      }

      @keyframes badgeSlideIn {
        from { transform: translateX(-10px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      .case-aircraft-badge .badge-label {
        font-size: 10px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }

      .case-aircraft-badge .badge-value {
        font-size: 13px;
        font-weight: 700;
        color: #0052d9;
        font-family: 'Outfit', 'Inter', sans-serif;
      }

      .btn-case-action {
        background: #334155;
        color: white;
        border: 1px solid #475569;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
      }

      .btn-case-action:hover {
        background: #475569;
        border-color: #64748b;
      }

      .marker-entry-overlay {
        position: absolute;
        top: 60px;
        left: 0;
        width: 100%;
        height: calc(100% - 60px);
        background: #f8fafc;
        z-index: 10002;
        padding: 40px;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }

      .entry-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 40px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 20px;
      }

      .btn-back {
        background: none;
        border: 1px solid #cbd5e1;
        padding: 4px 12px;
        border-radius: 4px;
        cursor: pointer;
        color: #475569;
      }

      .entry-placeholder {
        max-width: 600px;
        margin: 0 auto;
        text-align: center;
      }

      .placeholder-icon {
        font-size: 48px;
        margin-bottom: 20px;
      }

      .mock-form {
        margin-top: 40px;
        text-align: left;
        background: white;
        padding: 24px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .form-row {
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .form-row span {
        width: 80px;
        font-size: 13px;
        color: #64748b;
      }

      .form-input {
        flex: 1;
        height: 32px;
        background: #f1f5f9;
        border-radius: 4px;
      }

      .muted {
        color: #94a3b8;
        font-size: 13px;
      }

      .marker-entry-page {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #f8fafc;
        z-index: 10002;
        animation: fadeIn 0.3s ease-out;
      }

      .standard-grid-layout {
        display: grid;
        grid-template-columns: var(--left-panel-width) 1fr var(--right-panel-width);
        grid-template-rows: var(--header-height) 1fr;
        grid-template-areas:
            "header header header"
            "left-panel main-view right-panel";
      }

      .standard-grid-layout.right-collapsed {
        grid-template-columns: var(--left-panel-width) 1fr 0px;
      }

      .marker-entry-page .header-region { grid-area: header; }
      .marker-entry-page .left-panel-region { 
        grid-area: left-panel; 
        padding: 0; /* Override layout.css padding for the tree */
        border-right: 1px solid #e2e8f0;
        background: white;
      }
      .marker-entry-page .main-view-region { grid-area: main-view; position: relative; }
      .marker-entry-page .right-panel-region { grid-area: right-panel; padding: 0; }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .btn-ghost-case {
        background: none;
        border: none;
        color: #64748b;
        font-size: 13px;
        cursor: pointer;
        padding: 6px 12px;
        border-radius: 4px;
      }

      .btn-ghost-case:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      .btn-primary-case {
        background: #0052d9;
        color: white;
        border: none;
        padding: 6px 16px;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-primary-case:hover {
        background: #0045b5;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 82, 217, 0.3);
      }

      /* Hide global UI elements when inside marker entry spatial view */
      #marker-main-mount .breadcrumb-nav,
      #marker-main-mount .floating-actions,
      #marker-main-mount .spatial-nav-tools {
        display: none !important;
      }

      /* CASE Sidebar Tabs - Synced with Second Level Sidebar */
      .marker-sidebar-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: white;
      }

      .tab-section {
        display: flex;
        background: rgba(240, 242, 245, 0.5);
        margin: 0;
        padding: 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        gap: 0;
      }

      .tab-item {
        flex: 1;
        text-align: center;
        padding: 12px 0;
        font-size: 13px;
        font-weight: 500;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
        border-bottom: 2px solid transparent;
      }

      .tab-item.active {
        color: #0052d9;
        border-bottom-color: #0052d9;
        background: rgba(255, 255, 255, 0.3);
        font-weight: 600;
      }

      .tab-item:hover:not(.active) {
        color: #0052d9;
        background: rgba(255, 255, 255, 0.2);
      }

      .case-sidebar-body {
        flex: 1;
        overflow-y: hidden;
        display: flex;
        flex-direction: column;
      }

      /* ATA Panel */
      .case-ata-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .case-filter-area {
        padding: 16px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .case-filter-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .case-filter-row .label {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
      }

      /* Custom Dropdown for CASE */
      .case-custom-dropdown {
        position: relative;
        width: 100%;
      }

      .case-custom-dropdown .dropdown-header {
        background: white;
        border: 1px solid #e2e8f0;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: border-color 0.2s;
      }

      .case-custom-dropdown .dropdown-header:hover {
        border-color: #0052d9;
      }

      .case-custom-dropdown .dropdown-list {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        width: 100%;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        z-index: 2000;
        max-height: 250px;
        overflow-y: auto;
      }

      .case-custom-dropdown .dropdown-item {
        padding: 8px 12px;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .case-custom-dropdown .dropdown-item:hover {
        background: #f1f5f9;
      }

      .case-custom-dropdown .dropdown-item.selected {
        background: rgba(0, 82, 217, 0.05);
        color: #0052d9;
        font-weight: 600;
      }

      /* Search Input */
      .search-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .search-input-wrapper input {
        width: 100%;
        padding: 8px 12px 8px 30px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        outline: none;
        font-size: 13px;
      }

      .search-input-wrapper .search-icon {
        position: absolute;
        left: 10px;
        font-size: 12px;
        color: #94a3b8;
      }

      /* ATA Tree Framework - Synced with RecordSidebar.js */
      .ata-tree-framework {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }

      .framework-header {
        padding: 12px 16px;
        font-size: 12px;
        font-weight: 700;
        color: #94a3b8;
        background: white;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .framework-content {
        padding: 0;
      }

      .ata-group {
        border-bottom: 1px solid rgba(0, 0, 0, 0.03);
      }

      .ata-header, .ata-sub-header {
        display: flex;
        align-items: center;
        padding: 10px 16px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 13px;
        color: #475569;
      }

      .ata-header:hover, .ata-sub-header:hover {
        background: #f1f5f9;
        color: #0052d9;
      }

      .ata-code, .branch-name {
        font-weight: 500;
      }

      .ata-content {
        display: none;
        background: rgba(248, 250, 252, 0.5);
      }

      .ata-group.expanded > .ata-content {
        display: block;
      }

      .ata-sub-branch {
        padding-left: 20px;
      }

      .ata-branch-checkbox {
        accent-color: #0052d9;
      }

      .ata-tree-framework .chevron {
        font-size: 10px;
        width: 12px;
        color: #94a3b8;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      /* Case Aircraft Selector Styles */
      .aircraft-selector-dialog {
        max-width: 400px;
        z-index: 11000;
        box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      }

      .case-aircraft-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 300px;
        overflow-y: auto;
        padding: 4px;
      }

      .case-aircraft-item {
        padding: 12px 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .case-aircraft-item:hover {
        border-color: #0052d9;
        background: #f1f5f9;
        transform: translateX(4px);
      }

      .case-aircraft-item.selected {
        background: rgba(0, 82, 217, 0.05);
        border-color: #0052d9;
        box-shadow: 0 4px 12px rgba(0, 82, 217, 0.1);
      }

      .case-aircraft-item .ac-main {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
      }

      .case-aircraft-item .ac-sub {
        font-size: 11px;
        color: #64748b;
        margin-top: 2px;
      }
    `;
    document.head.appendChild(style);
  }
}
