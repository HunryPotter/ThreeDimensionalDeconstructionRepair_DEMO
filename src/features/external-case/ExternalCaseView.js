import { NavigationBar } from '../navigation-bar/NavigationBar.js';
import { StructureTree } from '../record-sidebar/StructureTree.js';
import { SpatialView } from '../spatial-view/SpatialView.js';
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
    this.markerActiveTab = 'ata'; // 'ata' or 'section'
    this.markerSelectedAta = '全部ATA';
    this.markerPnQuery = '';
    this.markerOpenDropdown = null;
    this.markerUncheckedAtaItems = new Set(); // Stores ID of unchecked frameworks
    this.ataFrameworkData = [
      { code: '32', label: '起落架', branches: ['G20', 'G40', 'G50', '通用分段'], expanded: true },
      { code: '52', label: '舱门', branches: ['G20', 'G40', 'G50', '通用分段'], expanded: false },
      { code: '53', label: '机身', branches: ['G20', 'G40', 'G50', '通用分段'], expanded: false },
      { code: '55', label: '安定面', branches: ['G20', 'G40', 'G50', '通用分段'], expanded: false },
      { code: '57', label: '机翼', branches: ['G20', 'G40', 'G50', '通用分段'], expanded: false }
    ];
    this.render();
  }

  render() {
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
            <aside class="right-panel-region"></aside>
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
        this.enterMarkerEntryMode();
      });
    }

    const cancelBtn = this.container.querySelector('#btn-cancel-entry');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.exitMarkerEntryMode();
      });
    }

    const saveBtn = this.container.querySelector('#btn-save-marker');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        console.log('Saving Marker...');
        this.exitMarkerEntryMode();
      });
    }

    // Delete Marker Flow
    const deleteBtn = this.container.querySelector('#btn-delete-marker');
    const deleteConfirm = this.container.querySelector('#case-delete-confirm');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (deleteConfirm) deleteConfirm.style.display = 'block';
      });
    }

    if (deleteConfirm) {
      deleteConfirm.querySelector('#btn-delete-no').addEventListener('click', () => {
        deleteConfirm.style.display = 'none';
      });
      deleteConfirm.querySelector('#btn-delete-yes').addEventListener('click', () => {
        this.hasMarker = false;
        if (this.markerSpatialView) {
          this.markerSpatialView.clearTemporaryMarker();
        }
        this.updateThemeUI();
        deleteConfirm.style.display = 'none';
      });
    }
  }

  enterMarkerEntryMode() {
    this.markerEntryActive = true;
    this.markerState = 0; // Reset state on entry
    
    // Clear marker if we don't have one (e.g. after deletion)
    if (this.markerSpatialView && !this.hasMarker) {
      this.markerSpatialView.clearTemporaryMarker();
    }

    const entryView = this.container.querySelector('#marker-entry-view');
    const mainView = this.container.querySelector('#case-main-view');
    if (entryView) entryView.style.display = 'grid';
    if (mainView) mainView.style.display = 'none';

    const headerMount = this.container.querySelector('#marker-header-mount');
    const leftMount = this.container.querySelector('#marker-left-mount');
    const mainMount = this.container.querySelector('#marker-main-mount');

    // 1. Initialize Navigation & Sidebar
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

    if (leftMount) {
      leftMount.innerHTML = `
        <div class="marker-sidebar-container">
          <div class="tab-section">
            <div class="tab-item ${this.markerActiveTab === 'ata' ? 'active' : ''}" data-tab="ata">ATA章节</div>
            <div class="tab-item ${this.markerActiveTab === 'section' ? 'active' : ''}" data-tab="section">机身部段</div>
          </div>
          <div id="case-sidebar-content" class="case-sidebar-body"></div>
        </div>
      `;
      this.renderMarkerSidebar();
    }

    // 2. Initialize SpatialView (MUST be before button creation as it wipes innerHTML)
    if (!this.markerSpatialView) {
      this.markerSpatialView = new SpatialView(mainMount);
    } else {
      // Cleanup existing instance state to ensure timeline/filters are hidden
      const canvas = this.markerSpatialView.container.querySelector('#canvas-container');
      if (canvas) canvas.classList.remove('drilldown-active');
      const timeline = this.markerSpatialView.container.querySelector('#spatial-timeline');
      if (timeline) timeline.style.display = 'none';
      this.markerSpatialView.hideBanner();
    }

    // 3. Ensure unified action button exists (Floating bottom-center)
    if (mainMount && !mainMount.querySelector('.marker-action-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'marker-action-overlay';
      overlay.innerHTML = `<button id="btn-start-drawing" class="btn-primary-case center-bottom">开始三维标记</button>`;
      mainMount.appendChild(overlay);

      const actionBtn = overlay.querySelector('#btn-start-drawing');
      actionBtn.addEventListener('click', () => {
        if (this.markerState === 0) {
          console.log('Activating 3D Marking Mode...');
          window.dispatchEvent(new CustomEvent('enter-drawing-mode'));
          this.markerState = 1;
          this.updateMarkerButton();
        } else if (this.markerState === 2) {
          console.log('Returning data to CASE System...');
          this.hasMarker = true;
          this.updateThemeUI();
          this.exitMarkerEntryMode();
        }
      });
    }

    // 4. Force UI refresh (We don't want drilldown-active here as it shows the timeline)
    this.updateMarkerButton();
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
    const actionBtn = this.container.querySelector('#btn-start-drawing');
    if (!actionBtn) return;

    if (this.markerState === 0) {
      actionBtn.textContent = '开始三维标记';
      actionBtn.disabled = false;
      actionBtn.style.background = ''; // Primary Blue
      actionBtn.style.opacity = '1';
    } else if (this.markerState === 1) {
      actionBtn.textContent = '正在标记...';
      actionBtn.disabled = true;
      actionBtn.style.opacity = '0.6';
    } else if (this.markerState === 2) {
      actionBtn.textContent = '回传数据至CASE系统';
      actionBtn.disabled = false;
      actionBtn.style.background = '#22c55e'; // Green for completion
      actionBtn.style.opacity = '1';
    }
  }

  renderMarkerSidebar() {
    const content = this.container.querySelector('#case-sidebar-content');
    if (!content) return;

    if (this.markerActiveTab === 'section') {
      this.structureTree = new StructureTree(content);
    } else {
      this.renderMarkerAtaTab(content);
    }
    this.initMarkerSidebarEvents();
  }

  renderMarkerAtaTab(container) {
    const isAtaOpen = this.markerOpenDropdown === 'ata';
    const ataOptions = [
      { code: 'all', label: '全部ATA' },
      ...this.ataFrameworkData.map(a => ({ code: a.code, label: `ATA ${a.code}(${a.label})` }))
    ];

    container.innerHTML = `
      <div class="case-ata-panel">
        <div class="case-filter-area">
          <div class="case-filter-row">
            <span class="label">ATA章节</span>
            <div class="case-custom-dropdown" data-id="ata">
              <div class="dropdown-header">
                <span>${this.markerSelectedAta}</span>
                <span class="chevron">▼</span>
              </div>
              <div class="dropdown-list" style="display: ${isAtaOpen ? 'block' : 'none'}">
                ${ataOptions.map(opt => `
                  <div class="dropdown-item ${this.markerSelectedAta === opt.label ? 'selected' : ''}" data-value="${opt.label}">
                    ${opt.label}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="case-filter-row">
            <span class="label">件号搜索</span>
            <div class="search-input-wrapper">
              <input type="text" id="marker-pn-search" placeholder="输入件号..." value="${this.markerPnQuery}">
              <span class="search-icon">🔍</span>
            </div>
          </div>
        </div>
        <div class="ata-tree-framework">
          <div class="framework-header">ATA结构树框架</div>
          <div class="framework-content">
            ${this.renderMarkerAtaTree()}
          </div>
        </div>
      </div>
    `;
  }

  renderMarkerAtaTree() {
    // Basic fuzzy search logic for the framework
    const query = this.markerPnQuery.toLowerCase();
    const filtered = this.ataFrameworkData.filter(ata => {
      const labelMatch = ata.label.includes(query) || ata.code.includes(query);
      const branchesMatch = ata.branches.some(b => b.toLowerCase().includes(query));
      const selectionMatch = this.markerSelectedAta === '全部ATA' || `ATA ${ata.code}(${ata.label})` === this.markerSelectedAta;
      return selectionMatch && (labelMatch || branchesMatch);
    });

    return filtered.map(ata => {
      const isAtaUnchecked = this.markerUncheckedAtaItems.has(ata.code);
      
      return `
        <div class="ata-group ${ata.expanded ? 'expanded' : ''}" data-code="${ata.code}">
          <div class="ata-header">
            <input type="checkbox" class="ata-branch-checkbox" ${isAtaUnchecked ? '' : 'checked'} style="margin-right: 6px; cursor: pointer;" />
            <span class="chevron" style="margin-right: 4px;">${ata.expanded ? '▼' : '▶'}</span>
            <span class="ata-code">ATA ${ata.code} ${ata.label}</span>
          </div>
          <div class="ata-content">
            ${ata.branches.map(b => {
              const branchId = `${ata.code}-${b}`;
              const isBranchUnchecked = this.markerUncheckedAtaItems.has(branchId);
              return `
                <div class="ata-sub-branch" data-branch-id="${branchId}">
                  <div class="ata-sub-header">
                    <input type="checkbox" class="ata-sub-checkbox" ${isBranchUnchecked ? '' : 'checked'} style="margin-right: 6px; cursor: pointer;" />
                    <span class="branch-name">${b}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  initMarkerSidebarEvents() {
    const content = this.container.querySelector('#marker-left-mount');
    if (!content) return;

    // 1. Tab switching
    const tabs = content.querySelectorAll('.tab-item');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        if (this.markerActiveTab !== target) {
          this.markerActiveTab = target;
          this.enterMarkerEntryMode(); // Re-render everything in sidebar
        }
      });
    });

    // 2. Dropdown Logic (ATA Tab)
    if (this.markerActiveTab === 'ata') {
      const dropdownHeader = content.querySelector('.case-custom-dropdown .dropdown-header');
      if (dropdownHeader) {
        dropdownHeader.addEventListener('click', (e) => {
          e.stopPropagation();
          this.markerOpenDropdown = this.markerOpenDropdown === 'ata' ? null : 'ata';
          this.renderMarkerSidebar();
        });
      }

      const dropdownItems = content.querySelectorAll('.dropdown-item');
      dropdownItems.forEach(item => {
        item.addEventListener('click', () => {
          this.markerSelectedAta = item.dataset.value;
          this.markerOpenDropdown = null;
          this.renderMarkerSidebar();
        });
      });

      // 3. Search Logic
      const pnInput = content.querySelector('#marker-pn-search');
      if (pnInput) {
        pnInput.addEventListener('input', (e) => {
          this.markerPnQuery = e.target.value;
          // Partial re-render (only the tree for speed if possible, but full is safer for now)
          const treeContent = content.querySelector('.framework-content');
          if (treeContent) treeContent.innerHTML = this.renderMarkerAtaTree();
          this.initAtaTreeEvents();
        });
      }

      this.initAtaTreeEvents();
    }

    // Global click to close dropdowns
    document.addEventListener('click', () => {
      if (this.markerOpenDropdown) {
        this.markerOpenDropdown = null;
        this.renderMarkerSidebar();
      }
    }, { once: true });
  }

  initAtaTreeEvents() {
    const treeHeaders = this.container.querySelectorAll('.ata-tree-framework .ata-header');
    treeHeaders.forEach(header => {
      // 1. Toggle expansion
      header.addEventListener('click', (e) => {
        if (e.target.type === 'checkbox') return;
        e.stopPropagation();
        const code = header.parentElement.dataset.code;
        const ata = this.ataFrameworkData.find(a => a.code === code);
        if (ata) {
          ata.expanded = !ata.expanded;
          this.refreshAtaTree();
        }
      });

      // 2. Parent Checkbox logic
      const checkbox = header.querySelector('.ata-branch-checkbox');
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          const code = header.parentElement.dataset.code;
          const isChecked = e.target.checked;
          const ata = this.ataFrameworkData.find(a => a.code === code);
          
          if (isChecked) {
            this.markerUncheckedAtaItems.delete(code);
            if (ata) ata.branches.forEach(b => this.markerUncheckedAtaItems.delete(`${code}-${b}`));
          } else {
            this.markerUncheckedAtaItems.add(code);
            if (ata) ata.branches.forEach(b => this.markerUncheckedAtaItems.add(`${code}-${b}`));
          }
          this.refreshAtaTree();
        });
      }
    });

    // 3. Sub-branch Checkbox logic
    const subCheckboxes = this.container.querySelectorAll('.ata-sub-checkbox');
    subCheckboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const branchId = cb.closest('.ata-sub-branch').dataset.branchId;
        const code = branchId.split('-')[0];
        const isChecked = e.target.checked;

        if (isChecked) {
          this.markerUncheckedAtaItems.delete(branchId);
          // Check if all siblings are checked to uncheck-parent from unselected
          const ata = this.ataFrameworkData.find(a => a.code === code);
          const allChecked = ata.branches.every(b => !this.markerUncheckedAtaItems.has(`${code}-${b}`));
          if (allChecked) this.markerUncheckedAtaItems.delete(code);
        } else {
          this.markerUncheckedAtaItems.add(branchId);
          this.markerUncheckedAtaItems.add(code); // Uncheck parent if any child is unchecked
        }
        this.refreshAtaTree();
      });
    });
  }

  refreshAtaTree() {
    const treeContent = this.container.querySelector('.framework-content');
    if (treeContent) {
      treeContent.innerHTML = this.renderMarkerAtaTree();
      this.initAtaTreeEvents();
    }
  }

  updateThemeUI() {
    const statusTag = this.container.querySelector('#marker-status-tag');
    const initiateBtn = this.container.querySelector('#btn-initiate-marker');

    if (statusTag) {
      statusTag.className = `status-tag ${this.hasMarker ? 'has' : 'none'}`;
      statusTag.textContent = this.hasMarker ? '● 已有标记' : '○ 暂无标记';
    }

    if (initiateBtn) {
      initiateBtn.textContent = this.hasMarker ? '查看/编辑三维损伤标记' : '添加三维损伤标记';
    }

    const deleteBtn = this.container.querySelector('#btn-delete-marker');
    if (deleteBtn) {
      deleteBtn.style.display = this.hasMarker ? 'block' : 'none';
    }
  }

  exitMarkerEntryMode() {
    this.markerEntryActive = false;
    const entryView = this.container.querySelector('#marker-entry-view');
    const mainView = this.container.querySelector('#case-main-view');
    if (entryView) entryView.style.display = 'none';
    if (mainView) mainView.style.display = 'flex'; // Use flex to match layout

    // Ensure the theme UI is in sync when we return
    this.updateThemeUI();

    // Reset global interaction modes to restore main view timeline
    window.dispatchEvent(new CustomEvent('exit-interaction-modes'));
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
    `;
    document.head.appendChild(style);
  }
}
