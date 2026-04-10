export class RecordSidebar {
  constructor(container) {
    this.container = container;
    this.view = 'selection'; // 'selection' or 'drilldown'
    this.damageTypePanelVisible = false; // Toggle for filter panel

    // Global Filters (Now supporting arrays for multi-select)
    this.filterManual = false;
    this.filter3D = false;
    this.selectedTypeLabels = []; // Array for multi-select
    this.selectedManualStatuses = ['published', 'unpublished', 'none']; // Default: all selected
    this.searchQuery = '';
    this.manualFilterPanelVisible = false; // Toggle for manual filter
    this.dateRange = { start: '2026-01-01', end: '2026-04-01' }; // Initial date range
    this.damageTypePanelVisible = false; // Toggle for filter panel
    this.activeFilters = {
      type: ['全部型别'],
      airline: ['全部航司'],
      msn: ['全部MSN'],
      registration: ['全部注册号'],
      ata: ['全部ATA'],
      partNo: ''
    };

    // Bidirectional Sync: Listen for filter changes from breadcrumbs
    window.addEventListener('filter-change', (e) => {
      // Avoid infinite loop by checking if data is different
      const newData = e.detail;
      let changed = false;
      Object.keys(newData).forEach(key => {
        if (this.activeFilters[key] !== undefined && JSON.stringify(this.activeFilters[key]) !== JSON.stringify(newData[key])) {
          this.activeFilters[key] = newData[key];
          changed = true;
        }
      });
      if (changed) {
        this.render();
      }
    });

    // Pre-defined spatial sites for grouping (all on fuselage)
    this.spatialSites = [
      { id: 'site-01', x: 28, y: 45 }, { id: 'site-02', x: 35, y: 52 },
      { id: 'site-03', x: 42, y: 48 }, { id: 'site-04', x: 48, y: 55 },
      { id: 'site-05', x: 55, y: 44 }, { id: 'site-06', x: 62, y: 50 },
      { id: 'site-07', x: 68, y: 46 }, { id: 'site-08', x: 74, y: 53 },
      { id: 'site-09', x: 32, y: 48 }, { id: 'site-10', x: 40, y: 54 },
      { id: 'site-11', x: 45, y: 43 }, { id: 'site-12', x: 52, y: 51 },
      { id: 'site-13', x: 58, y: 47 }, { id: 'site-14', x: 65, y: 55 },
      { id: 'site-15', x: 71, y: 49 }
    ];

    this.activeTab = 'ata-view'; // 'ata-view', 'spatial-view'
    this.selectedMarkerId = null;
    this.selectedTreeNodeId = null;

    // Virtual Database (Mock Data)
    const damageTypes = ['凹坑', '裂纹', '腐蚀', '划伤', '磨损', '紧固件松动或缺损', '脱胶', '剥离', '穿孔', '缺损', '雷击', '金属腐蚀', '复合材料/分层', '其他'];
    const aircraftTypes = ['基本型', '高原型'];
    const airlines = ['中国东航', '中国国航', '南方航空'];
    const atas = [
      { code: '32', label: 'ATA 32(起落架)' },
      { code: '52', label: 'ATA 52(舱门)' },
      { code: '53', label: 'ATA 53(机身)' },
      { code: '55', label: 'ATA 55(安定面)' },
      { code: '57', label: 'ATA 57(机翼)' }
    ];

    this.markerData = [];
    let markerCounter = 1;

    const getRandomDate = (start, end) => {
      const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      return d.toISOString().split('T')[0];
    };
    const dateRangeStart = new Date('2026-01-01');
    const dateRangeEnd = new Date('2026-04-01');

    aircraftTypes.forEach(type => {
      airlines.forEach(airline => {
        for (let i = 0; i < 15; i++) {
          const suffix = (markerCounter++).toString().padStart(4, '0');
          const markerId = `M-${suffix}`;

          const ata = atas[Math.floor(Math.random() * atas.length)];
          const branches = ['G20', 'G40', 'G50', '通用分段'];
          const subBranch = branches[Math.floor(Math.random() * branches.length)];

          let numTypes = Math.random() > 0.8 ? 2 : 1;
          const selectedLabels = [];
          const tempTypes = [...damageTypes];
          for (let k = 0; k < numTypes; k++) {
            const idx = Math.floor(Math.random() * tempTypes.length);
            selectedLabels.push(tempTypes.splice(idx, 1)[0]);
          }

          const has3D = Math.random() > 0.3;
          let siteCoords = null;
          let siteId = null;
          if (has3D) {
            const site = this.spatialSites[Math.floor(Math.random() * this.spatialSites.length)];
            siteId = site.id;
            siteCoords = { x: site.x, y: site.y };
          }

          const manualRoll = Math.random();
          const manualStatus = manualRoll > 0.6 ? 'published' : (manualRoll > 0.3 ? 'unpublished' : 'none');

          const srId = `ET-STR2026-M${suffix}`;
          const srRecord = {
            id: srId,
            title: `C919 ${ata.code}区域 ${selectedLabels.join('&')}损伤评估`,
            manualStatus: manualStatus,
            date: getRandomDate(dateRangeStart, dateRangeEnd)
          };

          const crsRecords = [];
          if (manualStatus === 'published') {
            crsRecords.push({
              id: `ET-CRS2026-A${suffix}`,
              title: `${selectedLabels[0]} 补强修理方案`,
              status: Math.random() > 0.5 ? '已批准' : '处理中',
              date: srRecord.date,
              description: `针对 ${markerId} 的 ${selectedLabels[0]} 损伤进行的修理方案。`,
              partNos: ['5311C13001G70']
            });
          }

          const crRecords = [];
          if (Math.random() > 0.7) {
            crRecords.push({
              id: `CR-C919-${suffix}`,
              title: `关于 ${markerId} 偏离评估`,
              status: '已生效',
              date: getRandomDate(dateRangeStart, dateRangeEnd),
              customerImpact: '对全寿命运营安全无直接负面影响。'
            });
          }

          this.markerData.push({
            id: markerId,
            title: `${ata.label} - ${selectedLabels.join(',')}损伤`,
            typeLabels: selectedLabels,
            aircraftType: type,
            airline: airline,
            ataCode: ata.code,
            ataLabel: ata.label,
            subBranch: subBranch,
            has3D: has3D,
            siteId: siteId,
            coords: siteCoords,
            date: srRecord.date,
            srRecord: srRecord,
            crsRecords: crsRecords,
            crRecords: crRecords
          });
        }
      });
    });

    this.addStyles(); // Inject styles once during initialization
    this.initGlobalEvents(); // Call only once at the start
    this.render();
  }

  selectRecord(id) {
    this.selectedMarkerId = id || null;
    this.selectedTreeNodeId = id || null;
    this.render();
  }

  render() {
    // 1. Save scroll position of the table container if it exists
    const scrollContainer = this.container.querySelector('.table-container');
    const savedScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;

    if (this.view === 'selection') {
      this.renderSelectionView();
    } else {
      this.renderDrillDownView();
    }
    this.dispatchDataUpdate();
    this.initEvents();

    // 2. Restore scroll position
    const newScrollContainer = this.container.querySelector('.table-container');
    if (newScrollContainer && savedScrollTop > 0) {
      newScrollContainer.scrollTop = savedScrollTop;
    }
  }

  dispatchDataUpdate() {
    const startTs = new Date(this.dateRange.start).getTime();
    const endTs = new Date(this.dateRange.end).getTime();

    const currentData = this.markerData.filter(item => {
      const matchesSearch = item.id.toLowerCase().includes(this.searchQuery.toLowerCase()) || (item.title && item.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
      const { type: aircraftTypeFilter, airline, ata, partNo } = this.activeFilters;
      const matchesBreadcrumbType = !aircraftTypeFilter || aircraftTypeFilter.includes('全部型别') || aircraftTypeFilter.includes(item.aircraftType);
      const matchesBreadcrumbAirline = !airline || airline.includes('全部航司') || airline.includes(item.airline);
      const matchesBreadcrumbAta = !ata || ata.includes('全部ATA') || ata.includes(item.ataCode);
      const matchesBreadcrumbPartNo = !partNo || item.id.toLowerCase().includes(partNo.toLowerCase()) || item.title.toLowerCase().includes(partNo.toLowerCase());

      const matchesType = this.selectedTypeLabels.length === 0 || item.typeLabels.some(l => this.selectedTypeLabels.includes(l));
      const manualStatus = item.srRecord ? item.srRecord.manualStatus : 'none';
      const matchesManual = this.selectedManualStatuses.includes(manualStatus);
      const itemTs = new Date(item.date).getTime();
      const matchesDate = itemTs >= startTs && itemTs <= endTs;

      // Exclude marker currently being edited
      const isEditing = this.editingId === item.id;

      return !isEditing && matchesSearch && matchesBreadcrumbType && matchesBreadcrumbAirline && matchesBreadcrumbAta && matchesBreadcrumbPartNo && (item.isUserMarkup || (matchesType && matchesManual && matchesDate)) && (!this.filter3D || item.has3D);
    });

    window.dispatchEvent(new CustomEvent('records-updated', {
      detail: {
        tab: 'DamageMarkers',
        records: currentData
      }
    }));
  }

  initGlobalEvents() {
    // 1. Selection Sync (Bidirectional)
    window.addEventListener('damage-marker-reverse-select', (e) => {
      const id = e.detail.id;
      if (!id) return;

      this.activeTab = 'ata-view';
      this.selectedMarkerId = id;

      const marker = this.markerData.find(m => m.id === id);
      if (marker) {
        window.dispatchEvent(new CustomEvent('damage-marker-select', { detail: marker }));
      }

      if (window.app) window.app.toggleRightPanel(true);
      this.render();

      // Scroll to the selected item if visible
      setTimeout(() => {
        const item = this.container.querySelector(`.record-item[data-id="${id}"]`);
        if (item) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    });

    // 2. Filter Change Sync
    window.addEventListener('filter-change', (e) => {
      this.activeFilters = e.detail;
      this.render();
    });

    // 3. Date Range Sync
    window.addEventListener('date-range-change', (e) => {
      this.dateRange = e.detail;
      this.render();
    });

    // 4. Save User Markup
    window.addEventListener('save-user-markup', (e) => {
      const detail = e.detail;
      const targetNodeId = this.selectedTreeNodeId;
      const editingId = detail.editingId;

      if (!targetNodeId && !editingId) {
        alert("请先在左侧选择一个ATA章节或分段");
        return;
      }

      let ataCode = '32';
      let ataLabel = 'ATA 32(起落架)'; // Default
      let subBranch = '通用分段';

      if (targetNodeId && targetNodeId.includes('-')) {
        const parts = targetNodeId.split('-');
        ataCode = parts[0];
        subBranch = parts[1];
      } else if (targetNodeId) {
        ataCode = targetNodeId;
      }

      // If editing, find the marker to update
      if (editingId) {
        const existingMarker = this.markerData.find(m => m.id === editingId);
        if (existingMarker) {
          existingMarker.title = detail.title;
          existingMarker.coords = { x: detail.x, y: detail.y };
          // Keep same ID, date, ATA branch etc.
          this.editingId = null;
          this.selectedMarkerId = editingId;
          this.render();
          return;
        }
      }

      // Find the label for ataCode
      const existing = this.markerData.find(m => m.ataCode === ataCode);
      if (existing) ataLabel = existing.ataLabel;

      const newId = `U-${Math.floor(1000 + Math.random() * 9000)}`;

      const newMarker = {
        id: newId,
        title: detail.title || '自定义零部件标记',
        typeLabels: [],
        aircraftType: '基本型',
        airline: '中国东航',
        ataCode: ataCode,
        ataLabel: ataLabel,
        subBranch: subBranch,
        has3D: true,
        siteId: `site-user-${newId}`,
        coords: { x: detail.x, y: detail.y },
        date: new Date().toISOString().split('T')[0],
        srRecord: null,
        crsRecords: [],
        crRecords: [],
        isUserMarkup: true
      };

      this.markerData.push(newMarker);
      this.selectedTreeNodeId = newId;
      this.render();
    });

    // 5. Handle Custom Delete Confirmation
    window.addEventListener('confirm-delete-action', (e) => {
      const id = e.detail.id;
      this.markerData = this.markerData.filter(m => m.id !== id);
      if (this.selectedMarkerId === id) {
        this.selectedMarkerId = null;
        if (window.app) window.app.toggleRightPanel(false);
      }
      this.render();
      this.dispatchDataUpdate(); // Ensure timeline and other views sync immediately
    });

    // 6. Refresh timeline data on demand (e.g. after exiting marking/measuring mode)
    window.addEventListener('refresh-timeline-data', () => {
      this.dispatchDataUpdate();
    });
  }

  renderSelectionView() {
    const isSelected = (key, value) => {
      const current = this.activeFilters[key];
      if (Array.isArray(current)) return current.includes(value);
      return current === value;
    };

    this.container.innerHTML = `
      <div class="sidebar-container">
        <!-- Sidebar Header -->
        <div class="sidebar-header-title" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 2px solid rgba(0,0,0,0.04);">
          <strong style="font-size: 14px; color: #1e293b;">筛选看板</strong>
        </div>
        
        <!-- Filters -->
        <div class="filter-section">
          ${this.renderDropdownField('type', '型别选择', [
      { label: '全部型别', value: '全部型别' },
      { label: '基本型', value: '基本型' },
      { label: '高原型', value: '高原型' }
    ], this.activeFilters.type)}

          ${this.renderDropdownField('airline', '航司选择', [
      { label: '全部航司', value: '全部航司' },
      { label: '中国东航', value: '中国东航' },
      { label: '中国国航', value: '中国国航' },
      { label: '南方航空', value: '南方航空' }
    ], this.activeFilters.airline)}

          ${this.renderDropdownField('msn', 'MSN号查询', [
      { label: '全部MSN', value: '全部MSN' },
      { label: '10025', value: '10025' },
      { label: '10026', value: '10026' }
    ], this.activeFilters.msn)}

          ${this.renderDropdownField('registration', '注册号查询', [
      { label: '全部注册号', value: '全部注册号' },
      { label: 'B919M', value: 'B919M' },
      { label: 'B919A', value: 'B919A' }
    ], this.activeFilters.registration)}

          ${this.renderDropdownField('ata', 'ATA章节', [
      { label: '全部ATA', value: '全部ATA' },
      { label: '32', value: '32' },
      { label: '52', value: '52' },
      { label: '53', value: '53' },
      { label: '55', value: '55' },
      { label: '57', value: '57' }
    ], this.activeFilters.ata)}

          <div class="filter-row">
            <span class="label">件号查询</span>
            <input type="text" id="part-no-input" placeholder="输入件号模糊搜索" value="${this.activeFilters.partNo || ''}" class="sidebar-input">
          </div>
        </div>
        
        <!-- Table Area -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>注册号</th>
                <th>MSN号</th>
                <th>ATA章节</th>
              </tr>
            </thead>
            <tbody>
              ${Array(30).fill(0).map((_, i) => `
                <tr class="${i === 0 ? 'selected' : ''}">
                  <td>${i + 1}</td>
                  <td>B919${i % 2 === 0 ? 'M' : 'A'}</td>
                  <td>100${25 + i}</td>
                  <td>ATA ${['32', '52', '53', '55', '57'][i % 5]}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="sidebar-footer">
          <div class="footer-stats">共 30 条</div>
          <div class="footer-actions">
            <button class="btn-reset">重置</button>
            <button class="btn-confirm" id="btn-overview-confirm">确认</button>
          </div>
        </div>

        <!-- Panel Toggle Bookmark (Right Edge, Middle) -->
        <button class="btn-toggle-handle" id="btn-left-sidebar-toggle" title="隐藏/显示面板">
          <span class="handle-icon">◀</span>
        </button>
      </div>
    `;
  }

  renderDropdownField(id, label, options, selectedValues) {
    const selectedText = selectedValues.length === 0 || selectedValues.includes('all') || selectedValues.includes('全部ATA') || selectedValues.includes('全部类型') || selectedValues.includes('全部型别') || selectedValues.includes('全部航司') || selectedValues.includes('全部MSN') || selectedValues.includes('全部注册号')
      ? '全部'
      : selectedValues.length === 1 ? selectedValues[0] : `${selectedValues[0]} 等${selectedValues.length}项`;

    const isOpen = this.openDropdownId === id;

    return `
        <div class="filter-row" style="position: relative; z-index: ${isOpen ? 2000 : 1};">
          <span class="label">${label}</span>
          <div class="custom-dropdown" data-id="${id}" style="width: 150px; position: relative; margin: 0; box-sizing: border-box;">
            <div class="dropdown-header" style="width: 100%; box-sizing: border-box; padding: 4px 8px; border: 1px solid ${isOpen ? 'var(--primary-blue, #2563eb)' : '#e2e8f0'}; border-radius: 6px; background: white; font-size: 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #1e293b;">${selectedText}</span>
              <span style="font-size: 10px; color: #64748b; margin-left: 4px;">▼</span>
            </div>
            ${isOpen ? `
            <div class="dropdown-list" style="position: absolute; top: calc(100% + 4px); right: 0; width: 100%; background: white; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 2000; max-height: 200px; overflow-y: auto;">
              ${options.map(opt => `
                <label style="display: flex; align-items: center; padding: 6px 12px; gap: 8px; cursor: pointer; font-size: 12px; margin: 0; transition: background 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">
                  <input type="checkbox" class="multi-select-cb" data-dropdown="${id}" value="${opt.value}" ${selectedValues.includes(opt.value) ? 'checked' : ''} style="cursor: pointer; margin: 0;">
                  <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${opt.label}</span>
                </label>
              `).join('')}
            </div>` : ''}
          </div>
        </div>
      `;
  }

  renderDrillDownView() {
    this.container.innerHTML = `
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
          <div class="tab-item ${this.activeTab === 'ata-view' ? 'active' : ''}" data-tab="ata-view">ATA结构树</div>
          <div class="tab-item ${this.activeTab === 'spatial-view' ? 'active' : ''}" data-tab="spatial-view">框站位参照系</div>
        </div>

        ${this.activeTab === 'ata-view' ? `
        <!-- Search & Tools Section -->
        <div class="search-tool-area filter-section" style="padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.06); margin-bottom: 4px; background: rgba(245,245,245,0.3);">
          
          ${this.renderDropdownField('drill-manual-filter', '超手册评估', [
      { label: '全部状态', value: 'all' },
      { label: '已发布', value: 'published' },
      { label: '未发布', value: 'unpublished' },
      { label: '无状态', value: 'none' }
    ], this.selectedManualStatuses.length === 3 ? ['all'] : this.selectedManualStatuses)}
          
          ${this.renderDropdownField('drill-type-filter', '损伤分类', [
      { label: '全部类型', value: '全部类型' },
      ...['凹坑', '裂纹', '腐蚀', '划伤', '磨损', '紧固件松动或缺损', '脱胶', '剥离', '穿孔', '缺损', '雷击', '金属腐蚀', '复合材料/分层', '其他'].map(t => ({ label: t, value: t }))
    ], this.selectedTypeLabels.length === 0 ? ['全部类型'] : this.selectedTypeLabels)}

          ${this.renderDropdownField('drill-ata-filter', 'ATA章节', [
      { label: '全部ATA', value: '全部ATA' },
      { label: 'ATA 32', value: '32' },
      { label: 'ATA 52', value: '52' },
      { label: 'ATA 53', value: '53' },
      { label: 'ATA 55', value: '55' },
      { label: 'ATA 57', value: '57' }
    ], this.activeFilters.ata)}
          
          <div class="filter-row">
            <span class="label">件号模糊</span>
            <div class="search-box" style="margin: 0; width: 150px; box-sizing: border-box; padding: 4px 8px;">
              <input type="text" placeholder="输入模糊搜索..." id="drill-part-search" value="${this.activeFilters.partNo}">
            </div>
          </div>
          
        </div>
        
        <div class="table-container tree-view-container">
          ${this.renderAtaGroups()}
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
        
        <!-- Panel Toggle Bookmark (Right Edge, Middle) -->
        <button class="btn-toggle-handle" id="btn-left-sidebar-toggle" title="隐藏/显示面板">
          <span class="handle-icon">◀</span>
        </button>
      </div>
    `;

    if (this.activeTab === 'spatial-view') {
      import('./StructureTree.js').then(module => {
        const mount = this.container.querySelector('#spatial-tree-mount-point');
        if (mount) {
          // Mount spatial tree but allow it to render internally
          new module.StructureTree(mount);
        }
      });
    }

    const visibleMarkers = this.getFilteredMarkers();
    window.dispatchEvent(new CustomEvent('spatial-markers-update', { detail: visibleMarkers }));
  }

  renderAtaGroups() {
    const iconMap = {
      '凹坑': '◯', '裂纹': '⚡', '腐蚀': '░', '划伤': '≡', '磨损': '≈',
      '紧固件松动或缺损': '◩', '脱胶': '▚', '剥离': '◪', '穿孔': '◎',
      '缺损': '⊝', '雷击': '↯', '金属腐蚀': '▣', '复合材料/分层': '☰', '其他': '⧉'
    };

    const startTs = new Date(this.dateRange.start).getTime();
    const endTs = new Date(this.dateRange.end).getTime();

    const filteredItems = this.markerData.filter(item => {
      const matchesSearch = item.id.toLowerCase().includes(this.searchQuery.toLowerCase()) || (item.title && item.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
      const { type: aircraftTypeFilter, airline, ata, partNo } = this.activeFilters;
      const matchesBreadcrumbType = !aircraftTypeFilter || aircraftTypeFilter.includes('全部型别') || aircraftTypeFilter.includes(item.aircraftType);
      const matchesBreadcrumbAirline = !airline || airline.includes('全部航司') || airline.includes(item.airline);
      const matchesBreadcrumbAta = !ata || ata.includes('全部ATA') || ata.includes(item.ataCode);
      const matchesBreadcrumbPartNo = !partNo || item.id.toLowerCase().includes(partNo.toLowerCase()) || item.title.toLowerCase().includes(partNo.toLowerCase());

      const matchesType = this.selectedTypeLabels.length === 0 || item.typeLabels.some(l => this.selectedTypeLabels.includes(l));
      const manualStatus = item.srRecord ? item.srRecord.manualStatus : 'none';
      const matchesManual = this.selectedManualStatuses.includes(manualStatus);
      const itemTs = new Date(item.date).getTime();
      const matchesDate = itemTs >= startTs && itemTs <= endTs;

      // Exclude marker currently being edited
      const isEditing = this.editingId === item.id;

      return !isEditing && matchesSearch && matchesBreadcrumbType && matchesBreadcrumbAirline && matchesBreadcrumbAta && matchesBreadcrumbPartNo && (item.isUserMarkup || (matchesType && matchesManual && matchesDate)) && (!this.filter3D || item.has3D);
    });

    const ataGroups = {};
    filteredItems.forEach(item => {
      if (!ataGroups[item.ataCode]) {
        ataGroups[item.ataCode] = { label: item.ataLabel, branches: {} };
      }

      const branchName = item.subBranch || '通用分段';
      if (!ataGroups[item.ataCode].branches[branchName]) {
        ataGroups[item.ataCode].branches[branchName] = { label: branchName, items: [] };
      }
      ataGroups[item.ataCode].branches[branchName].items.push(item);
    });

    this.uncheckedMarkerIds = this.uncheckedMarkerIds || new Set();
    this.collapsedAtaGroups = this.collapsedAtaGroups || new Set();
    this.selectedTreeNodeId = this.selectedTreeNodeId || null;

    return Object.entries(ataGroups).sort((a, b) => a[0].localeCompare(b[0])).map(([code, group]) => {
      const isExpanded = !this.collapsedAtaGroups.has(code);
      const branchesArr = Object.values(group.branches);
      const totalItems = branchesArr.reduce((sum, b) => sum + b.items.length, 0);
      const groupHasChecked = totalItems > 0 && branchesArr.some(b => b.items.some(item => !this.uncheckedMarkerIds.has(item.id)));

      return `
      <div class="ata-group ${isExpanded ? 'expanded' : ''}">
        <div class="ata-header ${this.selectedTreeNodeId === code ? 'selected' : ''}" data-node-id="${code}">
          <input type="checkbox" class="ata-branch-checkbox" style="margin-right: 6px; cursor: pointer;" ${groupHasChecked ? 'checked' : ''} />
          <span class="chevron" style="margin-right: 4px;">${isExpanded ? '▼' : '▶'}</span>
          <span class="ata-code">${group.label}</span>
          <span class="record-count">${totalItems}</span>
        </div>
        <div class="ata-content">
          ${Object.entries(group.branches).sort((a, b) => a[0].localeCompare(b[0])).map(([branchName, branch]) => {
        const branchId = `${code}-${branchName}`;
        const isBranchExpanded = !this.collapsedAtaGroups.has(branchId);
        const branchHasChecked = branch.items.length > 0 && branch.items.some(item => !this.uncheckedMarkerIds.has(item.id));

        return `
             <div class="ata-sub-branch ${isBranchExpanded ? 'expanded' : ''}">
                <div class="ata-sub-header ${this.selectedTreeNodeId === branchId ? 'selected' : ''}" data-node-id="${branchId}">
                  <input type="checkbox" class="ata-branch-checkbox" style="margin-right: 6px; cursor: pointer;" ${branchHasChecked ? 'checked' : ''} />
                  <span class="chevron" style="margin-right: 4px;">${isBranchExpanded ? '▼' : '▶'}</span>
                  <span class="branch-name">${branch.label}</span>
                  <span class="record-count" style="margin-left: auto; font-size: 10px; color: #94a3b8;">${branch.items.length}</span>
                </div>
                <div class="ata-sub-content">
                  ${branch.items.map(item => {
          const isSelected = item.id === this.selectedMarkerId;
          const isTreeSelected = item.id === this.selectedTreeNodeId;
          const isUserMarkup = item.isUserMarkup;

          let actionsHtml = '';
          if (isUserMarkup) {
            actionsHtml = `
               <span class="icon-delete" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; font-size: 11px; cursor: pointer;" title="删除标记">🗑️</span>
               <span class="icon-edit" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; font-size: 11px; cursor: pointer;" title="重新标点">📝</span>
               <span class="icon-pin ${this.filter3D ? 'active' : ''}" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; font-size: 11px;" title="自定义零部件标记">✏️</span>
            `;
          } else {
            const msStatus = item.srRecord ? item.srRecord.manualStatus : 'none';
            const msConfig = {
              'published': { icon: '📝', color: '#ea580c', label: '已发布' },
              'unpublished': { icon: '📄', color: '#94a3b8', label: '未发布' },
              'none': { icon: '📄', color: '#94a3b8', label: '无状态', opacity: 0.5 }
            }[msStatus] || { icon: '📄', color: '#cbd5e1', label: '未知', opacity: 0.5 };

            actionsHtml = `
              <span class="icon-manual" style="display: inline-flex; align-items: center; justify-content: center; border-radius: 2px; width: 16px; height: 16px; color: ${msConfig.color}; font-size: 11px; cursor: help; opacity: ${msConfig.opacity || 1};" title="超手册评估记录: ${msConfig.label}">${msConfig.icon}</span>
              <span class="icon-grid" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; font-size: 14px; color: #64748b;" title="${item.typeLabels.length > 1 ? `混合损伤: ${item.typeLabels.join(', ')}` : `类型: ${item.typeLabels[0]}`} ">${item.typeLabels.length > 1 ? '⧉' : (iconMap[item.typeLabels[0]] || '⊞')}</span>
              ${item.has3D ? `<span class="icon-pin ${this.filter3D ? 'active' : ''}" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; font-size: 11px;" title="三维标记">📍</span>` : '<span class="icon-placeholder" style="display: inline-block; width: 16px; height: 16px;"></span>'}
            `;
          }

          return `
                    <div class="record-item ${isSelected || isTreeSelected ? 'selected' : ''}" data-id="${item.id}">
                      <div style="display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0;">
                         <span class="record-id" style="font-weight: bold; color: ${isUserMarkup ? '#adff2f' : ''}">${item.id}</span>
                         <span style="font-size: 10px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;">${item.title}</span>
                      </div>
                      <div class="record-actions" style="display: flex; align-items: center; gap: 6px; justify-content: flex-end;">
                        ${actionsHtml}
                      </div>
                    </div>`;
        }).join('')}
                </div>
             </div>`;
      }).join('')}
        </div>
      </div>
    `}).join('');
  }

  getFilteredMarkers() {
    const iconMap = {
      '凹坑': '◯', '裂纹': '⚡', '腐蚀': '░', '划伤': '≡', '磨损': '≈',
      '紧固件松动或缺损': '◩', '脱胶': '▚', '剥离': '◪', '穿孔': '◎',
      '缺损': '⊝', '雷击': '↯', '金属腐蚀': '▣', '复合材料/分层': '☰', '其他': '⧉'
    };

    const startTs = new Date(this.dateRange.start).getTime();
    const endTs = new Date(this.dateRange.end).getTime();

    const filteredItems = this.markerData.filter(item => {
      if (!item.has3D) return false;
      const matchesSearch = item.id.toLowerCase().includes(this.searchQuery.toLowerCase()) || (item.title && item.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
      const { type: aircraftTypeFilter, airline, ata, partNo } = this.activeFilters;
      const matchesBreadcrumbType = !aircraftTypeFilter || aircraftTypeFilter.includes('全部型别') || aircraftTypeFilter.includes(item.aircraftType);
      const matchesBreadcrumbAirline = !airline || airline.includes('全部航司') || airline.includes(item.airline);
      const matchesBreadcrumbAta = !ata || ata.includes('全部ATA') || ata.includes(item.ataCode);
      const matchesBreadcrumbPartNo = !partNo || item.id.toLowerCase().includes(partNo.toLowerCase()) || item.title.toLowerCase().includes(partNo.toLowerCase());

      const matchesType = this.selectedTypeLabels.length === 0 || item.typeLabels.some(l => this.selectedTypeLabels.includes(l));
      const manualStatus = item.srRecord ? item.srRecord.manualStatus : 'none';
      const matchesManual = this.selectedManualStatuses.includes(manualStatus);
      const itemTs = new Date(item.date).getTime();
      const matchesDate = itemTs >= startTs && itemTs <= endTs;

      this.uncheckedMarkerIds = this.uncheckedMarkerIds || new Set();
      const isChecked = !this.uncheckedMarkerIds.has(item.id);

      return matchesSearch && matchesBreadcrumbType && matchesBreadcrumbAirline && matchesBreadcrumbAta && matchesBreadcrumbPartNo && (item.isUserMarkup || (matchesType && matchesManual && matchesDate)) && (!this.filter3D || item.has3D) && isChecked;
    });

    const siteGroups = {};
    filteredItems.forEach(item => {
      if (!siteGroups[item.siteId]) {
        siteGroups[item.siteId] = {
          id: item.siteId,
          x: item.coords.x,
          y: item.coords.y,
          isExisting: true,
          records: [],
          typeIcon: item.typeLabels.length > 1 ? '⧉' : (iconMap[item.typeLabels[0]] || '⊞')
        };
      }
      siteGroups[item.siteId].records.push({
        id: item.id,
        typeIcon: item.typeLabels.length > 1 ? '⧉' : (iconMap[item.typeLabels[0]] || '⊞'),
        isExisting: true,
        isUserMarkup: !!item.isUserMarkup
      });
    });

    return Object.values(siteGroups).map(site => {
      const isSelected = site.records.some(r => r.id === this.selectedMarkerId);
      return {
        ...site,
        isSelected: isSelected
      };
    });
  }

  handleAtaExport() {
    const startTs = new Date(this.dateRange.start).getTime();
    const endTs = new Date(this.dateRange.end).getTime();

    // Use the exact same filtering logic as renderAtaGroups
    const filteredItems = this.markerData.filter(item => {
      const matchesSearch = item.id.toLowerCase().includes(this.searchQuery.toLowerCase()) || (item.title && item.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
      const { type: aircraftTypeFilter, airline, ata, partNo } = this.activeFilters;
      const matchesBreadcrumbType = !aircraftTypeFilter || aircraftTypeFilter.includes('全部型别') || aircraftTypeFilter.includes(item.aircraftType);
      const matchesBreadcrumbAirline = !airline || airline.includes('全部航司') || airline.includes(item.airline);
      const matchesBreadcrumbAta = !ata || ata.includes('全部ATA') || ata.includes(item.ataCode);
      const matchesBreadcrumbPartNo = !partNo || item.id.toLowerCase().includes(partNo.toLowerCase()) || item.title.toLowerCase().includes(partNo.toLowerCase());

      const matchesType = this.selectedTypeLabels.length === 0 || item.typeLabels.some(l => this.selectedTypeLabels.includes(l));
      const manualStatus = item.srRecord ? item.srRecord.manualStatus : 'none';
      const matchesManual = this.selectedManualStatuses.includes(manualStatus);
      const itemTs = new Date(item.date).getTime();
      const matchesDate = itemTs >= startTs && itemTs <= endTs;

      const isEditing = this.editingId === item.id;
      return !isEditing && matchesSearch && matchesBreadcrumbType && matchesBreadcrumbAirline && matchesBreadcrumbAta && matchesBreadcrumbPartNo && (item.isUserMarkup || (matchesType && matchesManual && matchesDate)) && (!this.filter3D || item.has3D);
    });

    if (filteredItems.length === 0) {
      alert('当前列表无数据可导出');
      return;
    }

    // Prepare CSV Content
    const headers = ['损伤编号', '名称', '发现日期', 'ATA章节', '子分段', '损伤类型', '评估状态', '架次', '航司', '有无3D', 'X坐标(%)', 'Y坐标(%)'];
    
    const escapeCSV = (val) => {
      const str = String(val === null || val === undefined ? '' : val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filteredItems.map(item => [
      item.id,
      item.title || '无名称',
      item.date,
      item.ataLabel,
      item.subBranch || '通用分段',
      item.typeLabels.join(' & '),
      item.srRecord ? (item.srRecord.manualStatus === 'published' ? '已发布' : '未发布') : '无',
      item.aircraftType,
      item.airline,
      item.has3D ? '有' : '无',
      item.coords?.x ? item.coords.x.toFixed(1) : '-',
      item.coords?.y ? item.coords.y.toFixed(1) : '-'
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n');
    
    // Add UTF-8 BOM for Excel compatibility
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `ATA_Damage_Records_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  initEvents() {
    // 1. Sidebar Toggle Handle (Universal)
    const toggleHandle = this.container.querySelector('#btn-left-sidebar-toggle');
    if (toggleHandle) {
      toggleHandle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.app) window.app.toggleLeftPanel();
      });
    }

    // 2. View-Specific Events
    if (this.view === 'selection') {
      const dispatchFilterChange = () => {
        window.dispatchEvent(new CustomEvent('filter-change', { detail: this.activeFilters }));
      };

      // Confirm button to proceed to Level 2
      const btnConfirm = this.container.querySelector('#btn-overview-confirm');
      if (btnConfirm) {
        btnConfirm.addEventListener('click', (e) => {
          e.stopPropagation();
          this.view = 'drilldown';
          if (window.app) window.app.setViewLevel(2);
          this.render();
          window.dispatchEvent(new CustomEvent('enter-drilldown'));
        });
      }

      // Reset button
      const resetBtn = this.container.querySelector('.btn-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.activeFilters = {
            type: ['全部型别'],
            airline: ['全部航司'],
            msn: ['全部MSN'],
            registration: ['全部注册号'],
            ata: ['全部ATA'],
            partNo: ''
          };
          dispatchFilterChange();
          window.dispatchEvent(new CustomEvent('filter-reset'));
          this.render();
        });
      }

      // Search Input
      const partNoInput = this.container.querySelector('#part-no-input');
      if (partNoInput) {
        partNoInput.addEventListener('input', (e) => {
          this.activeFilters.partNo = e.target.value;
          dispatchFilterChange();
        });
      }
    } 
    else {
      // Drilldown View Events
      const backBtn = this.container.querySelector('.btn-back-footer');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          this.view = 'selection';
          if (window.app) window.app.setViewLevel(1);
          window.dispatchEvent(new CustomEvent('exit-drilldown'));
          this.render();
        });
      }

      const drillResetBtn = this.container.querySelector('#btn-drill-reset-icon');
      if (drillResetBtn) {
        drillResetBtn.addEventListener('click', () => {
          this.filterManual = false;
          this.filter3D = false;
          this.selectedTypeLabels = [];
          this.selectedManualStatuses = ['published', 'unpublished', 'none'];
          this.searchQuery = '';
          this.activeFilters.ata = ['全部ATA'];
          this.activeFilters.partNo = '';
          this.render();
          window.dispatchEvent(new CustomEvent('filter-change', { detail: this.activeFilters }));
        });
      }

      const exportBtn = this.container.querySelector('#btn-export-tree');
      if (exportBtn) {
        exportBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleAtaExport();
        });
      }

      // ATA Tree Logic
      const ataHeaders = this.container.querySelectorAll('.ata-header, .ata-sub-header');
      ataHeaders.forEach(header => {
        header.addEventListener('click', (e) => {
          if (e.target.type === 'checkbox') {
            // Handle branch checkbox
            const isChecked = e.target.checked;
            const items = header.parentElement.querySelectorAll('.record-item');
            items.forEach(item => {
              const id = item.dataset.id;
              if (isChecked) this.uncheckedMarkerIds.delete(id);
              else this.uncheckedMarkerIds.add(id);
            });
            this.render();
            return;
          }

          const nodeId = header.dataset.nodeId;
          if (nodeId) this.selectedTreeNodeId = nodeId;

          if (e.target.classList.contains('chevron')) {
            const group = header.parentElement;
            const isExpanded = group.classList.toggle('expanded');
            if (isExpanded) this.collapsedAtaGroups.delete(nodeId);
            else this.collapsedAtaGroups.add(nodeId);
          }
          this.render();
        });
      });

      // Tab switch
      const tabs = this.container.querySelectorAll('.tab-item');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          this.activeTab = tab.dataset.tab;
          this.render();
        });
      });

      // 3D Marking
      const markupBtn = this.container.querySelector('#btn-draw-markup-footer');
      if (markupBtn) {
        markupBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('enter-drawing-mode', { detail: { mode: 'local-component' } }));
        });
      }

      // Record items
      const recordItems = this.container.querySelectorAll('.record-item');
      recordItems.forEach(item => {
        item.addEventListener('click', (e) => {
          const id = item.dataset.id;
          const marker = this.markerData.find(m => m.id === id);
          if (!marker) return;

          // Check if specific action icons were clicked
          const target = e.target;
          if (target.closest('.icon-delete')) {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('request-delete-markup', { detail: { id } }));
            return;
          }

          if (target.closest('.icon-edit')) {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('enter-drawing-mode', { 
              detail: { 
                mode: 'local-component', 
                editingId: id, 
                initialTitle: marker.title 
              } 
            }));
            return;
          }

          if (target.closest('.icon-pin')) {
            e.stopPropagation();
            this.selectedMarkerId = id;
            window.dispatchEvent(new CustomEvent('damage-marker-select', { detail: marker }));
            // Dispatch custom retrieval event for the leader line animation
            window.dispatchEvent(new CustomEvent('locate-spatial-marker', { detail: marker }));
            this.render();
            return;
          }

          // Default selection behavior
          this.selectedMarkerId = id;
          window.dispatchEvent(new CustomEvent('damage-marker-select', { detail: marker }));
          this.render();
        });
      });
    }

    // 3. Common Components (Dropdowns, etc.)
    const dropdowns = this.container.querySelectorAll('.custom-dropdown');
    dropdowns.forEach(dd => {
      const header = dd.querySelector('.dropdown-header');
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = dd.dataset.id;
        this.openDropdownId = (this.openDropdownId === id) ? null : id;
        this.render();
      });
    });

    const checkboxes = this.container.querySelectorAll('.multi-select-cb');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const val = e.target.value;
        const isChecked = e.target.checked;
        const dropdownId = e.target.dataset.dropdown;

        const syncFilter = (key, allLabel) => {
          if (val === allLabel) {
            this.activeFilters[key] = [allLabel];
          } else {
            let current = [...this.activeFilters[key]].filter(v => v !== allLabel);
            if (isChecked) current.push(val);
            else current = current.filter(v => v !== val);
            if (current.length === 0) current = [allLabel];
            this.activeFilters[key] = current;
          }
        };

        if (dropdownId === 'type') syncFilter('type', '全部型别');
        else if (dropdownId === 'airline') syncFilter('airline', '全部航司');
        else if (dropdownId === 'msn') syncFilter('msn', '全部MSN');
        else if (dropdownId === 'registration') syncFilter('registration', '全部注册号');
        else if (dropdownId === 'ata' || dropdownId === 'drill-ata-filter') syncFilter('ata', '全部ATA');
        else if (dropdownId === 'drill-manual-filter') {
          if (val === 'all') this.selectedManualStatuses = ['published', 'unpublished', 'none'];
          else {
            if (this.selectedManualStatuses.length === 3) this.selectedManualStatuses = [];
            if (isChecked) this.selectedManualStatuses.push(val);
            else this.selectedManualStatuses = this.selectedManualStatuses.filter(s => s !== val);
            if (this.selectedManualStatuses.length === 0) this.selectedManualStatuses = ['published', 'unpublished', 'none'];
          }
        }
        else if (dropdownId === 'drill-type-filter') {
          if (val === '全部类型') {
            this.selectedTypeLabels = [];
          } else {
            if (isChecked) this.selectedTypeLabels.push(val);
            else this.selectedTypeLabels = this.selectedTypeLabels.filter(t => t !== val);
          }
        }

        window.dispatchEvent(new CustomEvent('filter-change', { detail: this.activeFilters }));
        this.render();
      });
    });

    // Row Selection in Table
    const tableRows = this.container.querySelectorAll('.data-table tbody tr');
    tableRows.forEach(row => {
      row.addEventListener('click', () => {
        tableRows.forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
      });
    });
  }

  addStyles() {
    const styleId = 'record-sidebar-styles';
    if (document.getElementById(styleId)) {
      document.getElementById(styleId).remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .sidebar-container {
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background: rgba(245, 245, 245, 0.72);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.3);
        min-height: 0;
        transition: background 0.4s, border 0.4s, box-shadow 0.4s;
      }

      /* 核心修复：收起时平滑隐藏内部内容，并增加位移以同步面板移动 */
      .sidebar-container > *:not(.btn-toggle-handle) {
        transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                    visibility 0.4s;
        transform: translateX(0);
      }

      #app-container.left-collapsed .left-panel-region .sidebar-container > *:not(.btn-toggle-handle) {
        opacity: 0;
        pointer-events: none;
        visibility: hidden;
        transform: translateX(-20px);
      }

      #app-container.left-collapsed .left-panel-region .sidebar-container {
        background: transparent;
        border: none;
        box-shadow: none;
        backdrop-filter: none;
      }

      /* 左侧手柄定位隔离 */
      .left-panel-region .btn-toggle-handle {
        position: absolute;
        right: -20px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 80px;
        background: white;
        border: 1px solid #e2e8f0;
        border-left: none;
        box-shadow: 6px 0 15px rgba(0,0,0,0.08);
        border-radius: 0 12px 12px 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        z-index: 2000;
        transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
        pointer-events: auto !important;
      }

      .left-panel-region .btn-toggle-handle:hover {
        width: 28px;
        right: -28px;
        background: var(--primary-blue);
        border-color: var(--primary-blue);
        box-shadow: 8px 0 20px rgba(0, 82, 217, 0.3);
      }

      .left-panel-region .handle-icon {
        font-size: 10px;
        color: #94a3b8;
        transform: scaleY(1.2);
        transition: all 0.2s;
      }

      .left-panel-region .btn-toggle-handle:hover .handle-icon {
        color: white;
      }

      #app-container.left-collapsed .left-panel-region .btn-toggle-handle .handle-icon {
        transform: scaleY(1.2) rotate(180deg);
        color: var(--primary-blue);
      }

      
      /* Refined Filter Section */
      .filter-section {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        background: rgba(245, 245, 245, 0.3);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        position: relative;
        z-index: 100; /* Ensure dropdowns are above the table below */
      }
      
      .filter-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      
      .filter-row .label {
        font-size: 12px;
        color: #64748b;
        white-space: nowrap;
        font-weight: 500;
      }
      
      .filter-row select {
        width: 150px; /* Reduced to fit better */
        padding: 4px 8px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        outline: none;
        font-size: 12px;
        color: var(--text-main);
        background: #fdfdfd;
        transition: border-color 0.2s;
        cursor: pointer;
      }

      .filter-row select:focus {
        border-color: var(--primary-blue);
      }
      
      /* Tab Section Styles - Integrated Unified Look */
      .tab-section {
        display: flex;
        background: rgba(240, 242, 245, 0.5);
        margin: 0; /* Removed large margins for integration */
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
        border-bottom: 2px solid transparent; /* Prepare for underline */
      }
      
      .tab-item.active {
        color: var(--primary-blue);
        border-bottom-color: var(--primary-blue); /* High-fidelity underline */
        background: rgba(255, 255, 255, 0.3);
      }
      
      .tab-item:hover:not(.active) {
        color: var(--primary-blue);
        background: rgba(255, 255, 255, 0.2);
      }

      /* 搜索和工具区域 - 增加视觉深度和不透明度 */
      .search-tool-area {
        padding: 14px 24px 14px 16px; /* 增加右侧内边距，确保对齐且不被遮挡 */
        display: flex;
        align-items: center;
        gap: 10px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        background: rgba(255, 255, 255, 0.85); 
        backdrop-filter: blur(10px);
        position: relative;
        z-index: 20; 
      }
      
      .search-box {
        width: 170px; /* 微调宽度以确保总长度（含图标）在容器内完美对齐 */
        display: flex;
        align-items: center;
        background: white;
        padding: 6px 12px;
        border-radius: 8px;
        gap: 8px;
        border: 1px solid #e2e8f0;
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
      }
      
      .search-label {
        font-size: 11px;
        color: #64748b;
        font-weight: 600;
        white-space: nowrap;
      }
      
      .search-box input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: 12px;
        color: var(--text-main);
        padding: 2px 0;
      }
      
      .icon-btn-view {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #64748b;
        transition: all 0.2s;
      }

      .icon-btn-view:hover, .icon-btn-view.active {
        background: #f1f5f9;
        color: var(--primary-blue);
        border-color: var(--primary-blue);
      }

      /* 筛选面板统一逻辑 */
      .type-filter-panel, .manual-filter-panel {
        position: absolute;
        top: calc(100% - 4px); 
        right: 24px; /* 与 padding-right 对齐 */
        width: 200px;
        background: white;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.15);
        z-index: 1000;
        display: none;
        padding-bottom: 8px;
        animation: panelFadeIn 0.2s ease-out;
      }

      @keyframes panelFadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .manual-filter-panel {
        right: 60px; /* 对应右移后的位置 (24 + 32 + 4) */
      }
      
      .type-filter-panel.visible {
        display: block;
      }
      
      .type-filter-panel .panel-header {
        padding: 10px 16px;
        font-size: 12px;
        font-weight: 600;
        background: #f8fafc;
        border-bottom: 1px solid #f1f5f9;
        border-radius: 8px 8px 0 0;
      }
      
      .type-filter-panel .panel-options {
        max-height: 250px;
        overflow-y: auto;
      }
      
      .filter-option {
        padding: 8px 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .filter-option:hover {
        background: #f0f7ff;
      }
      
      .filter-option label {
        font-size: 12px;
        cursor: pointer;
        flex: 1;
      }
      
      .filter-option input[type="radio"] {
        cursor: pointer;
      }

      /* Toggle Switch */
      .switch {
        position: relative;
        display: inline-block;
        width: 30px;
        height: 16px;
        background-color: #cbd5e1;
        border-radius: 10px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .switch::after {
        content: "";
        position: absolute;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: white;
        top: 2px;
        left: 2px;
        transition: transform 0.2s;
      }

      /* CR List Styling */
      .cr-table-header {
        display: flex;
        justify-content: space-between;
        padding: 8px 16px;
        font-size: 11px;
        color: #64748b;
        font-weight: 600;
        border-bottom: 1px solid rgba(0,0,0,0.05);
        background: rgba(0,0,0,0.02);
      }

      .cr-list {
        display: flex;
        flex-direction: column;
        padding: 4px 8px;
        gap: 4px;
      }

      .cr-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px !important;
      }

      .cr-category-tag {
        font-weight: bold;
        color: var(--primary-blue);
        background: rgba(0, 82, 217, 0.1);
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        font-size: 11px;
      }
      
      #live-toggle {
        display: none;
      }
      
      #live-toggle:checked + .switch {
        background-color: var(--primary-blue);
      }
      
      #live-toggle:checked + .switch::after {
        transform: translateX(14px);
      }

      /* ATA Tree Styles */
      .tree-view-container {
        padding: 8px 0;
      }
      
      .ata-header, .ata-sub-header {
        padding: 6px 12px;
        display: flex;
        align-items: center;
        cursor: pointer;
        gap: 6px;
        font-size: 12px;
        color: var(--text-main);
        transition: background 0.2s, border-color 0.2s;
        border-right: 2px solid transparent;
      }
      
      .ata-header:hover, .ata-sub-header:hover {
        background: #f8fafc;
      }

      .ata-header.selected, .ata-sub-header.selected {
        background: rgba(0, 82, 217, 0.05);
        color: var(--primary-blue);
        font-weight: 600;
        border-right-color: var(--primary-blue);
      }
      .ata-header.selected .ata-code, .ata-sub-header.selected .branch-name {
        color: var(--primary-blue);
        font-weight: 600;
      }

      .ata-sub-header {
        padding-left: 20px;
        border-bottom: 1px dotted rgba(0,0,0,0.05);
      }

      .ata-sub-content {
        display: none;
        padding-left: 14px;
        border-left: 1px dashed #e2e8f0;
        margin-left: 23px;
        padding-bottom: 4px;
      }

      .ata-sub-branch.expanded .ata-sub-content {
        display: block;
      }
      
      .ata-group.expanded > .ata-content {
        display: block;
      }
      
      .ata-header .chevron, .ata-sub-header .chevron {
        font-size: 9px;
        color: #cbd5e1;
        width: 14px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
        border-radius: 2px;
      }

      .ata-header .chevron:hover, .ata-sub-header .chevron:hover {
        background: rgba(0,0,0,0.05);
      }
      
      .ata-group.expanded .ata-header .chevron {
        transform: rotate(90deg) translateX(2px);
      }
      
      .ata-header .record-count {
        margin-left: auto;
        font-size: 11px;
        color: #94a3b8;
      }
      
      .ata-content {
        display: none;
        padding-left: 12px;
        border-left: 1px solid #f1f5f9;
        margin-left: 17px;
      }
      
      .ata-group.expanded .ata-content {
        display: block;
      }
      
      .record-item {
        padding: 6px 8px 6px 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        font-size: 11px;
        color: #64748b;
        border-radius: 4px;
        margin-right: 6px;
        transition: all 0.2s;
        gap: 4px;
      }
      
      .record-item:hover {
        background: #f0f7ff;
        color: var(--primary-blue);
      }
      
      .record-item.selected {
        background: #e6f0ff;
        color: var(--primary-blue);
        font-weight: 500;
      }
      
      .record-actions {
        display: grid;
        grid-template-columns: repeat(3, 18px); /* Rigid columns for alignment */
        gap: 2px;
        opacity: 0.8;
        flex-shrink: 0;
        justify-items: center;
      }
      
      .record-actions span {
        cursor: pointer;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        transition: all 0.2s;
      }
      
      .record-actions span:hover {
        color: var(--primary-blue);
      }

      .record-actions span.active {
        color: #ef4444; /* Alert color for active filters */
        opacity: 1;
        font-weight: bold;
        transform: scale(1.1);
      }

      .icon-placeholder {
        visibility: hidden;
        width: 18px;
        height: 18px;
      }
      
      .record-id {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      }

      .table-container {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        position: relative;
        /* 移除顶部遮挡渐变，只保留底部渐变以示还有更多内容 */
        -webkit-mask-image: linear-gradient(to bottom, 
            black 0%, 
            black calc(100% - 40px), 
            transparent 100%
        );
        mask-image: linear-gradient(to bottom, 
            black 0%, 
            black calc(100% - 40px), 
            transparent 100%
        );
      }

      /* Custom sleek scrollbar */
      .table-container::-webkit-scrollbar {
        width: 6px;
      }
      .table-container::-webkit-scrollbar-track {
        background: transparent;
      }
      .table-container::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
      }
      .table-container::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.2);
      }
      
      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      
      .data-table th {
        background: #f8fafc;
        text-align: left;
        padding: 8px 10px;
        border-bottom: 1px solid var(--border-color);
        color: var(--text-secondary);
        font-weight: 500;
        position: sticky;
        top: 0;
      }
      
      .data-table td {
        padding: 10px;
        border-bottom: 1px solid #f1f5f9;
        color: var(--text-main);
      }
      
      .data-table tr {
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .data-table tr:hover {
        background: #f0f7ff;
      }
      
      .data-table tr.selected {
        background: #e6f0ff;
      }
      
      .sidebar-footer {
        padding: 16px;
        border-top: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: white;
      }
      
      .footer-stats {
        font-size: 12px;
        color: var(--text-secondary);
      }
      
      .footer-actions {
        display: flex;
        gap: 12px;
      }
      
      .footer-actions button {
        flex: 1;
        padding: 8px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid transparent;
      }
      
      .btn-reset {
        background: #f1f5f9;
        color: var(--text-secondary);
        border-color: var(--border-color);
      }
      
      .btn-reset:hover {
        background: #e2e8f0;
      }
      
      .btn-back-footer {
        background: #f1f5f9;
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        padding: 8px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        flex: 1;
        transition: all 0.2s;
      }
      
      .btn-back-footer:hover {
        background: #e2e8f0;
      }
      
      .btn-confirm {
        background: var(--primary-blue);
        color: white;
      }
      
      .type-filter-panel.visible, .manual-filter-panel.visible {
        display: block;
      }

      .panel-header {
        padding: 8px 16px;
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid rgba(0,0,0,0.04);
        margin-bottom: 6px;
      }

      .filter-option {
        padding: 8px 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .filter-option:hover {
        background: rgba(0, 82, 217, 0.05);
      }

      .filter-option label {
        font-size: 12px;
        color: #475569;
        cursor: pointer;
        flex: 1;
      }

      .filter-option input {
        cursor: pointer;
      }

      .icon-file-light {
        opacity: 0.3;
      }

      /* Status Tags */
      .status-tag {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
      }
      .status-tag.done {
        background: #eefdf5;
        color: #24b47e;
        border: 1px solid #b7eb8f;
      }
      .status-tag.process {
        background: #e6f7ff;
        color: #1890ff;
        border: 1px solid #91d5ff;
      }

      .btn-confirm:hover {
        background: var(--primary-blue-hover);
      }
      
      .sidebar-input {
        width: 150px;
        padding: 4px 8px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 12px;
        color: var(--text-main);
        background: #fdfdfd;
        outline: none;
        transition: border-color 0.2s;
        box-sizing: border-box;
      }
      
      .sidebar-input:focus {
        border-color: var(--primary-blue);
      }
    `;
    document.head.appendChild(style);
  }
}
