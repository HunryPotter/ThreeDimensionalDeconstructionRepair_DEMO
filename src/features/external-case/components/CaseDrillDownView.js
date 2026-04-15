/**
 * CaseDrillDownView
 * A specialized version of the DrillDown sidebar for use within the CASE system.
 * This view is decoupled from the main app's Level 2 to allow independent evolution.
 */
export class CaseDrillDownView {
  constructor(sidebar) {
    this.sidebar = sidebar;
  }

  render() {
    const { sidebar } = this;

    sidebar.container.innerHTML = `
      <div class="sidebar-container case-workspace-sidebar">
        <div class="sidebar-header-title" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 2px solid rgba(0,0,0,0.04);">
          <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
            <strong style="font-size: 14px; color: #1e293b;">损伤标记列表</strong>
          </div>
          <div class="header-actions" style="display: flex; gap: 4px; align-items: center;">
            <button class="icon-btn-view" id="btn-case-drill-reset" title="重置筛选" style="width: 24px; height: 24px; padding: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.03); border-radius: 4px; border: 1px solid rgba(0,0,0,0.05); cursor: pointer; color: #64748b;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
            <button class="icon-btn-view" id="btn-case-export-tree" title="ATA结构树导出" style="width: 24px; height: 24px; padding: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.03); border-radius: 4px; border: 1px solid rgba(0,0,0,0.05); cursor: pointer; color: #64748b;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>
          </div>
        </div>
        
        <div class="tab-section">
          <div class="tab-item ${sidebar.activeTab === 'ata-view' ? 'active' : ''}" data-tab="ata-view">ATA结构树</div>
          <div class="tab-item ${sidebar.activeTab === 'spatial-view' ? 'active' : ''}" data-tab="spatial-view">框站位参照</div>
        </div>

        ${sidebar.activeTab === 'ata-view' ? `
        <div class="search-tool-area filter-section" style="padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.06); margin-bottom: 4px; background: rgba(245,245,245,0.3);">
          
          ${sidebar.renderDropdownField('drill-manual-filter', '飞机状态', [
            { label: '全部状态', value: 'all' },
            { label: '运行中', value: 'published' },
            { label: '故障停场', value: 'unpublished' },
            { label: '定检改装', value: 'none' }
          ], sidebar.selectedManualStatuses.length === 3 ? ['all'] : sidebar.selectedManualStatuses)}

          ${sidebar.renderDropdownField('drill-type-filter', '损伤分类', [
            { label: '全部类型', value: '全部类型' },
            ...['凹坑', '裂纹', '腐蚀', '划伤', '磨损', '紧固件松动', '脱胶', '剥离', '穿孔', '缺损', '雷击', '金属腐蚀', '分层', '其他'].map(t => ({ label: t, value: t }))
          ], sidebar.selectedTypeLabels.length === 0 ? ['全部类型'] : sidebar.selectedTypeLabels)}

          ${sidebar.renderDropdownField('drill-ata-filter', 'ATA章节', [
            { label: '全部ATA', value: '全部ATA' },
            { label: 'ATA 32', value: '32' },
            { label: 'ATA 52', value: '52' },
            { label: 'ATA 53', value: '53' },
            { label: 'ATA 55', value: '55' },
            { label: 'ATA 57', value: '57' }
          ], sidebar.activeFilters.ata)}

          <div class="filter-row">
            <span class="label">件号模糊</span>
            <div class="search-box" style="margin: 0; width: 150px; box-sizing: border-box;">
              <input type="text" placeholder="输入件号搜索..." id="case-part-search" value="${sidebar.activeFilters.partNo}">
            </div>
          </div>
          
          <div class="filter-row">
            <span class="label">标记搜索</span>
            <div class="search-box" style="margin: 0; width: 150px; box-sizing: border-box;">
              <input type="text" placeholder="输入编号/标题..." id="case-marker-search" value="${sidebar.activeFilters.markerQuery}">
            </div>
          </div>

          <div class="filter-row">
            <span class="label">SR 查询</span>
            <div class="search-box" style="margin: 0; width: 150px; box-sizing: border-box;">
              <input type="text" placeholder="输入 SR 编号..." id="case-sr-search" value="${sidebar.activeFilters.srQuery}">
            </div>
          </div>

          <div class="filter-row">
            <span class="label">CRS 查询</span>
            <div class="search-box" style="margin: 0; width: 150px; box-sizing: border-box;">
              <input type="text" placeholder="输入 CRS 编号..." id="case-crs-search" value="${sidebar.activeFilters.crsQuery}">
            </div>
          </div>
        </div>
        
        <div class="table-container tree-view-container">
          ${sidebar.renderAtaGroups()}
        </div>
        ` : `
        <div class="table-container" id="case-spatial-tree-mount" style="padding: 0;"></div>
        `}
        
        <div class="sidebar-footer">
          <div class="footer-actions" style="grid-template-columns: 1fr;">
            <button class="btn-confirm" id="btn-case-action-integrated" style="display: flex; align-items: center; justify-content: center; gap: 8px; background: #0052d9; color: white;">
              <span id="case-btn-text">开始三维标记</span>
            </button>
          </div>
        </div>
      </div>
    `;

    if (sidebar.activeTab === 'spatial-view') {
      import('../../record-sidebar/StructureTree.js').then(module => {
        const mount = sidebar.container.querySelector('#case-spatial-tree-mount');
        if (mount) {
          new module.StructureTree(mount);
        }
      });
    }

    const visibleMarkers = sidebar.getFilteredMarkers();
    window.dispatchEvent(new CustomEvent('spatial-markers-update', { detail: visibleMarkers }));

    this.initEvents();
    this.syncButtonState();
  }

  syncButtonState() {
    // We delegate the actual state handling to ExternalCaseView via events
    window.dispatchEvent(new CustomEvent('request-case-button-sync'));
  }

  initEvents() {
    const { sidebar } = this;

    // Reset button
    const resetBtn = sidebar.container.querySelector('#btn-case-drill-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        sidebar.selectedManualStatuses = ['published', 'unpublished', 'none'];
        sidebar.selectedTypeLabels = [];
        sidebar.activeFilters.ata = ['全部ATA'];
        sidebar.activeFilters.partNo = '';
        sidebar.activeFilters.markerQuery = '';
        sidebar.activeFilters.srQuery = '';
        sidebar.activeFilters.crsQuery = '';
        sidebar.render();
      });
    }

    // Export button
    const exportBtn = sidebar.container.querySelector('#btn-case-export-tree');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (sidebar.handleAtaExport) {
          sidebar.handleAtaExport();
        }
      });
    }

    // Tab switch
    const tabs = sidebar.container.querySelectorAll('.tab-item');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        sidebar.activeTab = tab.dataset.tab;
        sidebar.render();
      });
    });

    // Integrated Action Button
    const actionBtn = sidebar.container.querySelector('#btn-case-action-integrated');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('trigger-case-primary-action'));
      });
    }

    // Search inputs
    const inputs = [
      { id: '#case-part-search', field: 'partNo' },
      { id: '#case-marker-search', field: 'markerQuery' },
      { id: '#case-sr-search', field: 'srQuery' },
      { id: '#case-crs-search', field: 'crsQuery' }
    ];

    inputs.forEach(inputDef => {
      const el = sidebar.container.querySelector(inputDef.id);
      if (el) {
        el.addEventListener('input', (e) => {
          sidebar.activeFilters[inputDef.field] = e.target.value;
          sidebar.render();
        });
      }
    });

    // Listen for sidebar toggle to notify parent
    const toggleBtn = sidebar.container.querySelector('.btn-toggle-handle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        // RecordSidebar handles the transition, we just need to let ExternalCaseView know
        setTimeout(() => {
          const isCollapsed = sidebar.container.querySelector('.sidebar-container').classList.contains('collapsed');
          window.dispatchEvent(new CustomEvent('case-sidebar-toggle', { detail: { isCollapsed } }));
        }, 10);
      });
    }
  }
}
