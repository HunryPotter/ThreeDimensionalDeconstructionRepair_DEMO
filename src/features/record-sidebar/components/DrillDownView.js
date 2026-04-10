/**
 * DrillDownView (Level 2)
 * Handles the Damage Marker List and ATA Tree
 */
export class DrillDownView {
  constructor(sidebar) {
    this.sidebar = sidebar;
  }

  render() {
    const { sidebar } = this;
    sidebar.container.innerHTML = `
      <div class="sidebar-container">
        <div class="sidebar-header-title" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 2px solid rgba(0,0,0,0.04);">
          <strong style="font-size: 14px; color: #1e293b;">损伤标记列表 (B919)</strong>
          <div class="header-actions" style="display: flex; gap: 4px; align-items: center;">
            <button class="icon-btn-view" id="btn-drill-reset-icon" title="重置筛选" style="width: 24px; height: 24px; padding: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.03); border-radius: 4px; border: 1px solid rgba(0,0,0,0.05); cursor: pointer; color: #64748b;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
            <button class="icon-btn-view" id="btn-export-tree" title="ATA结构树导出" style="width: 24px; height: 24px; padding: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.03); border-radius: 4px; border: 1px solid rgba(0,0,0,0.05); cursor: pointer; color: #64748b;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>
          </div>
        </div>
        
        <!-- Tabs Section -->
        <div class="tab-section">
          <div class="tab-item ${sidebar.activeTab === 'ata-view' ? 'active' : ''}" data-tab="ata-view">ATA结构树</div>
          <div class="tab-item ${sidebar.activeTab === 'spatial-view' ? 'active' : ''}" data-tab="spatial-view">框站位参照系</div>
        </div>

        ${sidebar.activeTab === 'ata-view' ? `
        <!-- Search & Tools Section -->
        <div class="search-tool-area filter-section" style="padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.06); margin-bottom: 4px; background: rgba(245,245,245,0.3);">
          
          ${sidebar.renderDropdownField('drill-manual-filter', '超手册评估', [
            { label: '全部状态', value: 'all' },
            { label: '已发布', value: 'published' },
            { label: '未发布', value: 'unpublished' },
            { label: '无状态', value: 'none' }
          ], sidebar.selectedManualStatuses.length === 3 ? ['all'] : sidebar.selectedManualStatuses)}
          
          ${sidebar.renderDropdownField('drill-type-filter', '损伤分类', [
            { label: '全部类型', value: '全部类型' },
            ...['凹坑', '裂纹', '腐蚀', '划伤', '磨损', '紧固件松动或缺损', '脱胶', '剥离', '穿孔', '缺损', '雷击', '金属腐蚀', '复合材料/分层', '其他'].map(t => ({ label: t, value: t }))
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
            <div class="search-box" style="margin: 0; width: 150px; box-sizing: border-box; padding: 4px 8px;">
              <input type="text" placeholder="输入模糊搜索..." id="drill-part-search" value="${sidebar.activeFilters.partNo}">
            </div>
          </div>
          
        </div>
        
        <div class="table-container tree-view-container">
          ${sidebar.renderAtaGroups()}
        </div>
        ` : `
        <div class="table-container" id="spatial-tree-mount-point" style="padding: 0;"></div>
        `}
        
        <div class="sidebar-footer">
          <div class="footer-actions">
            <button class="btn-back-footer">返回</button>
            <button class="btn-confirm" id="btn-draw-markup-footer" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
              <span style="font-size: 14px;">🖌️</span> 三维标记
            </button>
          </div>
        </div>
        
        <button class="btn-toggle-handle" id="btn-left-sidebar-toggle" title="隐藏/显示面板">
          <span class="handle-icon">◀</span>
        </button>
      </div>
    `;

    if (sidebar.activeTab === 'spatial-view') {
      import('../StructureTree.js').then(module => {
        const mount = sidebar.container.querySelector('#spatial-tree-mount-point');
        if (mount) {
          new module.StructureTree(mount);
        }
      });
    }

    const visibleMarkers = sidebar.getFilteredMarkers();
    window.dispatchEvent(new CustomEvent('spatial-markers-update', { detail: visibleMarkers }));

    this.initEvents();
  }

  initEvents() {
    const { sidebar } = this;

    // Back button
    const backBtn = sidebar.container.querySelector('.btn-back-footer');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        sidebar.view = 'selection';
        if (window.app) window.app.setViewLevel(1);
        window.dispatchEvent(new CustomEvent('exit-drilldown'));
        sidebar.render();
      });
    }

    // Reset button
    const drillResetBtn = sidebar.container.querySelector('#btn-drill-reset-icon');
    if (drillResetBtn) {
      drillResetBtn.addEventListener('click', () => {
        sidebar.filterManual = false;
        sidebar.filter3D = false;
        sidebar.selectedTypeLabels = [];
        sidebar.selectedManualStatuses = ['published', 'unpublished', 'none'];
        sidebar.searchQuery = '';
        sidebar.activeFilters.ata = ['全部ATA'];
        sidebar.activeFilters.partNo = '';
        sidebar.render();
        window.dispatchEvent(new CustomEvent('filter-change', { detail: sidebar.activeFilters }));
      });
    }

    // Export button
    const exportBtn = sidebar.container.querySelector('#btn-export-tree');
    if (exportBtn) {
      exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.handleAtaExport();
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

    // 3D Marking
    const markupBtn = sidebar.container.querySelector('#btn-draw-markup-footer');
    if (markupBtn) {
      markupBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // 强制约束：必须选择一个ATA结构条目（树枝）而不是具体损伤条目
        if (!sidebar.selectedBranchId) {
          window.dispatchEvent(new CustomEvent('request-internal-alert', {
            detail: {
              title: '新增标记限制',
              message: '请先在左侧选择一个ATA结构条目（章节或分段），而非具体损伤条目。'
            }
          }));
          return;
        }
        
        window.dispatchEvent(new CustomEvent('enter-drawing-mode', { detail: { mode: 'local-component' } }));
      });
    }

    // Toggle Sidebar
    const toggleHandle = sidebar.container.querySelector('#btn-left-sidebar-toggle');
    if (toggleHandle) {
      toggleHandle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.app) window.app.toggleLeftPanel();
      });
    }

    // Search input for Part No
    const partSearch = sidebar.container.querySelector('#drill-part-search');
    if (partSearch) {
      partSearch.addEventListener('input', (e) => {
        sidebar.activeFilters.partNo = e.target.value;
        window.dispatchEvent(new CustomEvent('filter-change', { detail: sidebar.activeFilters }));
        // Note: In Level 2, we might not need to full re-render immediately for every keystroke if performance is an issue, 
        // but for prototype consistency we do.
        sidebar.render();
      });
    }
  }
}
