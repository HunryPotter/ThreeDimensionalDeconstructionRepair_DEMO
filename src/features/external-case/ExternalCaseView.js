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
            <!-- Overlay Header (Fixed on Top) -->
            <div class="external-header">
                <div class="external-logo">CASE 业务系统</div>
                <div class="external-header-actions">
                  <div class="external-status">仿真环境运营中</div>
                  <button id="btn-return-to-app" class="btn-case-return">
                    <span style="font-size:12px; margin-right:4px;">➔</span> 返回首页
                  </button>
                </div>
            </div>

            <!-- Embedded PDF Site (Flex Grow) -->
            <div class="pdf-frame-wrapper">
              <embed src="${casePdf}" type="application/pdf" width="100%" height="100%" />
            </div>

            <!-- Case Details / Theme Panel (Fixed Width) -->
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
    // 1. Level 1 & Level 2 Click Delegator
    // We bind to this.container and stop propagation to prevent collisions with the main app entry events
    const container = this.container.querySelector('#external-case-container');
    if (container) {
      container.addEventListener('click', (e) => {
        // Stop bubbling to window to prevent L2 auto-triggering when CASE shows up
        e.stopPropagation();

        // 1. Initial Entry Button (Start Marking)
        const initiateBtn = e.target.closest('#btn-initiate-marker');
        if (initiateBtn) {
          this.showAircraftSelector();
          return;
        }

        // 2. Return to Main Page
        const returnBtn = e.target.closest('#btn-return-to-app');
        if (returnBtn) {
          this.hide();
          window.dispatchEvent(new CustomEvent('return-from-external'));
          return;
        }

        // 3. Delete Marking Logic
        const deleteBtn = e.target.closest('#btn-delete-marker');
        if (deleteBtn) {
          const dialog = document.querySelector('#case-delete-confirm');
          if (dialog) dialog.style.display = 'block';
          return;
        }

        const deleteYes = e.target.closest('#btn-delete-yes');
        if (deleteYes) {
          const dialog = document.querySelector('#case-delete-confirm');
          if (dialog) dialog.style.display = 'none';
          this.hasMarker = false;
          this.markerState = 0;
          this.updateThemeUI();
          this.updateMarkerButton();
          return;
        }

        const deleteNo = e.target.closest('#btn-delete-no');
        if (deleteNo) {
          const dialog = document.querySelector('#case-delete-confirm');
          if (dialog) dialog.style.display = 'none';
          return;
        }

        // 4. Aircraft Selector Popup Actions
        const cancelAc = e.target.closest('#btn-aircraft-cancel');
        if (cancelAc) {
          const selector = document.querySelector('#case-aircraft-selector');
          if (selector) selector.style.display = 'none';
          return;
        }

        const confirmAc = e.target.closest('#btn-aircraft-confirm');
        if (confirmAc) {
          if (this.selectedAircraft) {
            const selector = document.querySelector('#case-aircraft-selector');
            if (selector) selector.style.display = 'none';
            this.enterMarkerEntryMode();
          }
          return;
        }

        // 5. Entry Cancel (L2 NavBar)
        const cancelEntry = e.target.closest('#btn-cancel-entry');
        if (cancelEntry) {
          this.exitMarkerEntryMode();
          return;
        }
      });
    }

    // 2. State Synchronization Listeners (One-time registration)
    if (!this._globalBound) {
      window.addEventListener('confirm-delete-action', () => {
        if (this.markerEntryActive) {
          this.markerState = 0;
          this.updateMarkerButton();
          window.dispatchEvent(new CustomEvent('exit-interaction-modes'));
        }
      });

      window.addEventListener('trigger-case-primary-action', (e) => {
        if (!this.markerEntryActive) return;
        this.handlePrimaryAction(e.detail?.action);
      });

      window.addEventListener('save-user-markup', () => {
        if (this.markerEntryActive) {
          this.markerState = 2;
          this.updateMarkerButton();
        }
      });

      window.addEventListener('case-sidebar-toggle', (e) => {
        if (!this.markerEntryActive) return;
        const entryView = document.querySelector('#marker-entry-view');
        if (entryView) {
          if (e.detail.isCollapsed) entryView.classList.add('left-collapsed');
          else entryView.classList.remove('left-collapsed');
        }
      });

      this._globalBound = true;
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

  enterMarkerEntryMode(aircraft = null) {
    if (aircraft) {
      this.selectedAircraft = aircraft;
    }
    this.markerEntryActive = true;
    this.markerState = 0; // Reset state on entry

    // Set viewLevel to 2 so DetailSidebar allows right panel to open
    // (DetailSidebar.render() checks viewLevel===2 to allow right panel)
    if (window.app) window.app.viewLevel = 2;

    const entryView = this.container.querySelector('#marker-entry-view');
    const mainView = this.container.querySelector('#case-main-view');
    if (entryView) {
      entryView.style.display = 'grid';
      entryView.classList.add('right-collapsed');
    }
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
    // Always recreate them because SpatialView rebuilds the DOM on each entry,
    // which detaches any previously created popup containers.
    this.casePopupManager = new PopupManager(mainMount);
    this.caseMarkerPopup = new MarkerPopup(mainMount);

    // 6. Context-Aware Event Handling:
    if (!this._evBound) {
      window.addEventListener('damage-marker-select', (e) => {
        if (!this.markerEntryActive) return;
        
        // Positive Selection Sync: Update Sidebar state when a marker is selected (either from list or 3D)
        if (this.caseLeftSidebar && e.detail.id !== this.caseLeftSidebar.selectedMarkerId) {
          this.caseLeftSidebar.selectRecord(e.detail.id);
        }

        this.caseMarkerPopup.show(e.detail);
        this.casePopupManager.hide();
        this.updateMarkerButton();

        // If user clicked a portal button (SR/CRS view detail), open right sidebar
        if (e.detail.forceTab) {
          if (this.caseRightSidebar) {
            this.caseRightSidebar.markerData = e.detail;
            this.caseRightSidebar.activeInnerTab = e.detail.forceTab;
            if (e.detail.targetSrId) this.caseRightSidebar.selectedSrId = e.detail.targetSrId;
            this.caseRightSidebar.render();
          }
          this.toggleRightPanel(true);
        }
      });

      window.addEventListener('site-click', (e) => {
        if (!this.markerEntryActive) return;
        const siteData = e.detail;
        if (siteData.isExisting && siteData.records.length > 0) {
          this.casePopupManager.show(siteData.records, siteData.records[0].id);
          this.caseMarkerPopup.hide();
          this.updateMarkerButton();
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
          this.updateMarkerButton();
        }
      });

      // Fix: DetailSidebar calls window.app.toggleRightPanel() which operates on app-container.
      // Intercept show-sidebar-detail here to call the CASE-specific right panel toggle instead.
      window.addEventListener('show-sidebar-detail', (e) => {
        if (!this.markerEntryActive) return;
        if (this.caseRightSidebar) {
          this.caseRightSidebar.markerData = e.detail.markerData;
          this.caseRightSidebar.activeInnerTab = e.detail.type || 'SR';
          this.caseRightSidebar.render();
        }
        this.toggleRightPanel(true);
      });

      // Fix: CaseDrillDownView.syncButtonState() dispatches this event.
      // Was removed in a previous refactor. Restoring it.
      window.addEventListener('request-case-button-sync', () => {
        if (!this.markerEntryActive) return;
        this.updateMarkerButton();
      });

      this._evBound = true;
    }

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

  handlePrimaryAction(actionType) {
    if (actionType === 'return-l1') {
      const selectedId = this.caseLeftSidebar?.selectedMarkerId;
      if (!selectedId) return;

      this.linkedMarkerId = selectedId;
      this.hasMarker = true;
      this.updateThemeUI();
      this.exitMarkerEntryMode();
      return;
    }

    // Default: Start Marking flow
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
          mode: 'local-component', // Enabling naming dialog logic in SpatialView
          ataCode: this.caseLeftSidebar.selectedBranchId,
          aircraft: this.selectedAircraft,
          associatedAircraft: [this.selectedAircraft], // Automatically bypassing internal aircraft selection
          caseRef: this
        }
      }));
      this.markerState = 1;
      this.updateMarkerButton();
    } else if (this.markerState === 2) {
      // Logic for confirming newly created marker
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

    // Handle state transition after naming popup is confirmed (local-component mode)
    window.addEventListener('save-user-markup', () => {
      if (this.markerEntryActive) {
        this.markerState = 2;
        this.updateMarkerButton();
      }
    });
  }

  updateMarkerButton() {
    const returnBtn = this.container.querySelector('#btn-case-return-to-l1');
    const startBtn = this.container.querySelector('#btn-case-start-marking');
    if (!returnBtn || !startBtn) return;

    const hasSelection = this.caseLeftSidebar && this.caseLeftSidebar.selectedMarkerId;

    // Left Button: "回传至 CASE 系统"
    if (hasSelection) {
      returnBtn.disabled = false;
      returnBtn.style.opacity = '1';
      returnBtn.style.background = '#22c55e'; // Highlight green when ready to return
      returnBtn.style.color = 'white';
      returnBtn.style.borderColor = '#22c55e';
    } else {
      returnBtn.disabled = true;
      returnBtn.style.opacity = '0.5';
      returnBtn.style.background = '#f8fafc';
      returnBtn.style.color = '#64748b';
      returnBtn.style.borderColor = '#e2e8f0';
    }

    // Right Button: "三维标记"
    if (this.markerState === 1) {
      startBtn.innerHTML = `标记中...`;
      startBtn.disabled = true;
      startBtn.style.opacity = '0.6';
    } else {
      startBtn.innerHTML = `<span style="font-size: 14px;">🖌️</span> 三维标记`;
      startBtn.disabled = false;
      startBtn.style.opacity = '1';
      startBtn.style.background = '#0052d9';
    }
  }

  updateThemeUI() {
    const statusTag = this.container.querySelector('#marker-status-tag');
    const initiateBtn = this.container.querySelector('#btn-initiate-marker');

    if (statusTag) {
      statusTag.className = `status-tag ${this.hasMarker ? 'has' : 'none'}`;
      if (this.hasMarker && this.linkedMarkerId) {
        statusTag.innerHTML = `<span style="color: #22c55e;">●</span> 已关联: ${this.linkedMarkerId}`;
        statusTag.style.background = 'rgba(34, 197, 94, 0.05)';
        statusTag.style.border = '1px solid rgba(34, 197, 94, 0.2)';
      } else {
        statusTag.textContent = this.hasMarker ? '● 已有标记数据' : '○ 暂无标记数据';
        statusTag.style.background = '';
        statusTag.style.border = '';
      }
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

    // Reset viewLevel when leaving marker mode
    if (window.app) window.app.viewLevel = 0;

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
    this.interactionLocked = true; // Safety lock for entry signals
    
    const view = this.container.querySelector('#external-case-container');
    if (view) view.style.display = 'block';

    // Direct binding for L1 buttons to ensure absolute responsiveness
    const initiateBtn = document.querySelector('#btn-initiate-marker');
    if (initiateBtn) {
      initiateBtn.onclick = (e) => {
        if (this.interactionLocked) return;
        this.showAircraftSelector();
      };
    }

    const returnBtn = document.querySelector('#btn-return-to-app');
    if (returnBtn) {
      returnBtn.onclick = (e) => {
        if (this.interactionLocked) return;
        this.hide();
        window.dispatchEvent(new CustomEvent('return-from-external'));
      };
    }

    // Release interaction lock after a short delay
    setTimeout(() => {
      this.interactionLocked = false;
    }, 200);

    if (!this.markerEntryActive) this.markerState = 0;
    
    this.updateThemeUI();
    this.updateMarkerButton();
  }

  hide() {
    this.isVisible = false;
    const view = this.container.querySelector('#external-case-container');
    if (view) view.style.display = 'none';

    // Reset all popup states to prevent stale display on re-entry
    const aircraftSelector = document.querySelector('#case-aircraft-selector');
    if (aircraftSelector) aircraftSelector.style.display = 'none';
    const deleteConfirm = document.querySelector('#case-delete-confirm');
    if (deleteConfirm) deleteConfirm.style.display = 'none';
    
    // Reset selectedAircraft to prevent stale state
    this.selectedAircraft = null;
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
        display: flex;
        position: relative;
        background: #f1f5f9;
        overflow: hidden;
      }

      .pdf-frame-wrapper {
        flex: 1;
        height: calc(100% - 60px);
        margin-top: 60px;
        margin-right: 320px;
        background: #f1f5f9;
        z-index: 1000;
      }

      .case-info-panel {
        position: fixed;
        right: 0;
        top: 60px;
        bottom: 0;
        width: 320px;
        background: #ffffff;
        border-left: 1px solid #e2e8f0;
        padding: 24px;
        z-index: 20001;
        display: flex;
        flex-direction: column;
        box-shadow: -4px 0 12px rgba(0,0,0,0.05);
      }

      .external-header {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 60px;
        background: #1e293b;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 24px;
        z-index: 20002;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        color: white;
      }

      .external-header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .btn-case-return {
        background: rgba(56, 189, 248, 0.2);
        border: 1px solid rgba(56, 189, 248, 0.4);
        color: #38bdf8;
        padding: 6px 14px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s;
        display: flex;
        align-items: center;
      }

      .btn-case-return:hover {
        background: rgba(56, 189, 248, 0.3);
        border-color: #38bdf8;
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
        border-radius: 6px;
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

      /* ========================================
         Confirm Dialog Styles (Self-contained)
         These are copied from SpatialView.js to
         ensure CASE works without App.init()
         ======================================== */
      .confirm-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 320px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(24px) saturate(160%);
        -webkit-backdrop-filter: blur(24px) saturate(160%);
        border-radius: 8px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.4);
        z-index: 30000;
        overflow: hidden;
        animation: casePopupIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        display: flex;
        flex-direction: column;
      }

      @keyframes casePopupIn {
        from { opacity: 0; transform: translate(-50%, -45%) scale(0.9); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }

      .confirm-header {
        padding: 20px 24px 12px;
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
        letter-spacing: -0.01em;
      }

      .confirm-footer {
        padding: 16px 24px 24px;
        display: flex;
        gap: 12px;
        background: rgba(248, 250, 252, 0.3);
      }

      .btn-confirm {
        flex: 1;
        padding: 10px 0;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #e2e8f0;
        background: #f1f5f9;
        color: #64748b;
      }

      .btn-confirm.primary {
        background: #0052d9;
        color: white;
        border: none;
        box-shadow: 0 4px 12px rgba(0, 82, 217, 0.16);
      }

      .btn-confirm.primary:hover {
        background: #0045b8;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 82, 217, 0.24);
      }

      .btn-confirm:not(.primary):hover {
        background: #e2e8f0;
        color: #1e293b;
      }

      .btn-confirm:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
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
