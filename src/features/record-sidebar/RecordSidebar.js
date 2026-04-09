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
          
          let numTypes = Math.random() > 0.8 ? 2 : 1;
          const selectedLabels = [];
          const tempTypes = [...damageTypes];
          for (let k = 0; k < numTypes; k++) {
            const idx = Math.floor(Math.random() * tempTypes.length);
            selectedLabels.push(tempTypes.splice(idx, 1)[0]);
          }

          const ata = atas[Math.floor(Math.random() * atas.length)];
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
    this.render();
  }

  render() {
    if (this.view === 'selection') {
      this.renderSelectionView();
    } else {
      this.renderDrillDownView();
    }
    this.dispatchDataUpdate();
    this.initEvents(); // Binds local DOM events for current view
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
      const matchesManual = this.selectedManualStatuses.includes(item.srRecord.manualStatus);
      const itemTs = new Date(item.date).getTime();
      const matchesDate = itemTs >= startTs && itemTs <= endTs;
      
      return matchesSearch && matchesBreadcrumbType && matchesBreadcrumbAirline && matchesBreadcrumbAta && matchesBreadcrumbPartNo && matchesType && matchesManual && matchesDate && (!this.filter3D || item.has3D);
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
        <div class="sidebar-header-title">
          <strong>架次列表</strong>
          <button class="btn-toggle-sidebar left" id="btn-collapse-left" title="收起面板">◀</button>
        </div>
        
        <!-- Filters -->
        <div class="filter-section">
          <div class="filter-row">
            <span class="label">型别选择</span>
            <select id="type-select">
              <option ${isSelected('type', '全部型别') ? 'selected' : ''}>全部型别</option>
              <option ${isSelected('type', '基本型') ? 'selected' : ''}>基本型</option>
              <option ${isSelected('type', '高原型') ? 'selected' : ''}>高原型</option>
            </select>
          </div>
          <div class="filter-row">
            <span class="label">航司选择</span>
            <select id="airline-select">
              <option ${isSelected('airline', '全部航司') ? 'selected' : ''}>全部航司</option>
              <option ${isSelected('airline', '中国东航') ? 'selected' : ''}>中国东航</option>
              <option ${isSelected('airline', '中国国航') ? 'selected' : ''}>中国国航</option>
              <option ${isSelected('airline', '南方航空') ? 'selected' : ''}>南方航空</option>
            </select>
          </div>
          <div class="filter-row">
            <span class="label">MSN号</span>
            <select id="msn-select">
              <option ${isSelected('msn', '全部MSN') ? 'selected' : ''}>全部MSN</option>
              <option ${isSelected('msn', '10025') ? 'selected' : ''}>10025</option>
              <option ${isSelected('msn', '10026') ? 'selected' : ''}>10026</option>
            </select>
          </div>
          <div class="filter-row">
            <span class="label">注册号</span>
            <select id="registration-select">
              <option ${isSelected('registration', '全部注册号') ? 'selected' : ''}>全部注册号</option>
              <option ${isSelected('registration', 'B919M') ? 'selected' : ''}>B919M</option>
              <option ${isSelected('registration', 'B919A') ? 'selected' : ''}>B919A</option>
            </select>
          </div>
          <div class="filter-row">
            <span class="label">ATA章节</span>
            <select id="ata-select">
              <option ${isSelected('ata', '全部ATA') ? 'selected' : ''}>全部ATA</option>
              <option ${isSelected('ata', '32') ? 'selected' : ''}>ATA 32(起落架)</option>
              <option ${isSelected('ata', '52') ? 'selected' : ''}>ATA 52(舱门)</option>
              <option ${isSelected('ata', '53') ? 'selected' : ''}>ATA 53(机身)</option>
              <option ${isSelected('ata', '55') ? 'selected' : ''}>ATA 55(安定面)</option>
              <option ${isSelected('ata', '57') ? 'selected' : ''}>ATA 57(机翼)</option>
            </select>
          </div>
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
            <button class="btn-confirm">确认</button>
          </div>
        </div>
      </div>
    `;
  }

  renderDrillDownView() {
    const renderMultiSelect = (id, label, options, selectedValues) => {
      const selectedText = selectedValues.length === 0 || selectedValues.includes('all') || selectedValues.includes('全部ATA') || selectedValues.includes('全部类型')
        ? '全部'
        : selectedValues.length === 1 ? selectedValues[0] : `已选 ${selectedValues.length} 项`;
        
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
    };

    this.container.innerHTML = `
      <div class="sidebar-container">
        <div class="sidebar-header-title" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">
          <strong>损伤标记列表 (B919)</strong>
          <button class="btn-toggle-sidebar left" id="btn-collapse-left-drill" title="收起面板">◀</button>
        </div>
        
        <!-- Tabs Section -->
        <div class="tab-section">
          <div class="tab-item ${this.activeTab === 'ata-view' ? 'active' : ''}" data-tab="ata-view">ATA分类</div>
          <div class="tab-item ${this.activeTab === 'spatial-view' ? 'active' : ''}" data-tab="spatial-view">空间站位</div>
        </div>

        ${this.activeTab === 'ata-view' ? `
        <!-- Search & Tools Section -->
        <div class="search-tool-area filter-section" style="padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.06); margin-bottom: 4px; background: rgba(245,245,245,0.3);">
          
          ${renderMultiSelect('drill-manual-filter', '超手册评估', [
            { label: '全部状态', value: 'all' },
            { label: '已发布', value: 'published' },
            { label: '未发布', value: 'unpublished' },
            { label: '无状态', value: 'none' }
          ], this.selectedManualStatuses.length === 3 ? ['all'] : this.selectedManualStatuses)}
          
          ${renderMultiSelect('drill-type-filter', '损伤分类', [
            { label: '全部类型', value: '全部类型' },
            ...['凹坑', '裂纹', '腐蚀', '划伤', '磨损', '紧固件松动或缺损', '脱胶', '剥离', '穿孔', '缺损', '雷击', '金属腐蚀', '复合材料/分层', '其他'].map(t => ({ label: t, value: t }))
          ], this.selectedTypeLabels.length === 0 ? ['全部类型'] : this.selectedTypeLabels)}

          ${renderMultiSelect('drill-ata-filter', 'ATA章节', [
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
          
          <!-- Action Icons Row -->
          <div style="display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; margin-top: 4px; border-top: 1px dashed rgba(0,0,0,0.1); align-items: center;">
            <button class="icon-btn-view" id="btn-draw-markup" title="三维损伤标记" style="width: 28px; height: 28px; padding: 0;">
              <span style="font-size: 14px;">🖌️</span>
            </button>
            <button class="icon-btn-view" id="btn-export-tree" title="ATA结构树导出" style="width: 28px; height: 28px; padding: 0;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>
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
            <button class="btn-reset">重置</button>
          </div>
        </div>
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
      const matchesManual = this.selectedManualStatuses.includes(item.srRecord.manualStatus);
      const itemTs = new Date(item.date).getTime();
      const matchesDate = itemTs >= startTs && itemTs <= endTs;

      return matchesSearch && matchesBreadcrumbType && matchesBreadcrumbAirline && matchesBreadcrumbAta && matchesBreadcrumbPartNo && matchesType && matchesManual && matchesDate && (!this.filter3D || item.has3D);
    });

    const ataGroups = {};
    filteredItems.forEach(item => {
      if (!ataGroups[item.ataCode]) {
        ataGroups[item.ataCode] = { label: item.ataLabel, items: [] };
      }
      ataGroups[item.ataCode].items.push(item);
    });

    this.uncheckedMarkerIds = this.uncheckedMarkerIds || new Set();

    this.collapsedAtaGroups = this.collapsedAtaGroups || new Set();

    return Object.entries(ataGroups).sort((a, b) => a[0].localeCompare(b[0])).map(([code, group]) => {
      const allChecked = group.items.length > 0 && group.items.every(item => !this.uncheckedMarkerIds.has(item.id));
      const isExpanded = !this.collapsedAtaGroups.has(code);
      
      return `
      <div class="ata-group ${isExpanded ? 'expanded' : ''}">
        <div class="ata-header" data-ata="${code}">
          <input type="checkbox" class="ata-branch-checkbox" style="margin-right: 6px; cursor: pointer;" ${allChecked ? 'checked' : ''} />
          <span class="chevron" style="margin-right: 4px;">${isExpanded ? '▼' : '▶'}</span>
          <span class="ata-code">${group.label}</span>
          <span class="record-count">${group.items.length}</span>
        </div>
        <div class="ata-content">
          ${group.items.map(item => {
            const isSelected = item.id === this.selectedMarkerId;
            const msStatus = item.srRecord ? item.srRecord.manualStatus : 'none';
            const msConfig = {
              'published': { icon: '📝', color: '#ea580c', label: '已发布' },
              'unpublished': { icon: '📄', color: '#94a3b8', label: '未发布' },
              'none': { icon: '📄', color: '#94a3b8', label: '无状态', opacity: 0.5 }
            }[msStatus] || { icon: '📄', color: '#cbd5e1', label: '未知', opacity: 0.5 };
            
            return `
              <div class="record-item ${isSelected ? 'selected' : ''}" data-id="${item.id}">
                <div style="display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0;">
                   <span class="record-id" style="font-weight: bold;">${item.id}</span>
                   <span style="font-size: 10px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;">${item.title}</span>
                </div>
                <div class="record-actions" style="display: flex; align-items: center; gap: 6px; justify-content: flex-end;">
                  <span class="icon-manual" style="display: inline-flex; align-items: center; justify-content: center; border-radius: 2px; width: 16px; height: 16px; color: ${msConfig.color}; font-size: 11px; cursor: help; opacity: ${msConfig.opacity || 1};" title="超手册评估记录: ${msConfig.label}">${msConfig.icon}</span>
                  <span class="icon-grid" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; font-size: 14px; color: #64748b;" title="${item.typeLabels.length > 1 ? `混合损伤: ${item.typeLabels.join(', ')}` : `类型: ${item.typeLabels[0]}`} ">${item.typeLabels.length > 1 ? '⧉' : (iconMap[item.typeLabels[0]] || '⊞')}</span>
                  ${item.has3D ? `<span class="icon-pin ${this.filter3D ? 'active' : ''}" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; font-size: 11px;" title="三维标记">📍</span>` : '<span class="icon-placeholder" style="display: inline-block; width: 16px; height: 16px;"></span>'}
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
      const matchesManual = this.selectedManualStatuses.includes(item.srRecord.manualStatus);
      const itemTs = new Date(item.date).getTime();
      const matchesDate = itemTs >= startTs && itemTs <= endTs;

      this.uncheckedMarkerIds = this.uncheckedMarkerIds || new Set();
      const isChecked = !this.uncheckedMarkerIds.has(item.id);

      return matchesSearch && matchesBreadcrumbType && matchesBreadcrumbAirline && matchesBreadcrumbAta && matchesBreadcrumbPartNo && matchesType && matchesManual && matchesDate && (!this.filter3D || item.has3D) && isChecked;
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
        isExisting: true
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

  initEvents() {
    // Selection View Events
    if (this.view === 'selection') {
      const selects = ['type-select', 'airline-select', 'msn-select', 'registration-select', 'ata-select'];
      const dispatchFilterChange = () => {
        const newFilters = {
          type: [this.container.querySelector('#type-select').value],
          airline: [this.container.querySelector('#airline-select').value],
          msn: [this.container.querySelector('#msn-select').value],
          registration: [this.container.querySelector('#registration-select').value],
          ata: [this.container.querySelector('#ata-select').value],
          partNo: this.container.querySelector('#part-no-input').value
        };

        window.dispatchEvent(new CustomEvent('filter-change', {
          detail: newFilters
        }));
      };

      selects.forEach(id => {
        const el = this.container.querySelector(`#${id}`);
        if (el) el.addEventListener('change', dispatchFilterChange);
      });
      const partNoInput = this.container.querySelector('#part-no-input');
      if (partNoInput) {
        partNoInput.addEventListener('input', dispatchFilterChange);
      }

      const confirmBtn = this.container.querySelector('.btn-confirm');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          this.view = 'drilldown';
          // Dispatch event to show spatial filters in 3D view
          window.dispatchEvent(new CustomEvent('enter-drilldown'));
          this.render();
        });
      }

      const collapseBtn = this.container.querySelector('#btn-collapse-left');
      if (collapseBtn) {
        collapseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('toggle-left-panel', { detail: false }));
        });
      }

      const resetBtn = this.container.querySelector('.btn-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          selects.forEach(id => {
            const select = this.container.querySelector(`#${id}`);
            if (select) select.selectedIndex = 0;
          });
          if (partNoInput) partNoInput.value = '';
          dispatchFilterChange();
          window.dispatchEvent(new CustomEvent('filter-reset'));
        });
      }
    }
    // Drilldown View Events
    else {
      const backBtn = this.container.querySelector('.btn-back');
      const footerBackBtn = this.container.querySelector('.btn-back-footer');

      const goBack = () => {
        this.view = 'selection';
        // Dispatch event to hide spatial filters in 3D view
        window.dispatchEvent(new CustomEvent('exit-drilldown'));
        this.render();
      };

      if (backBtn) backBtn.addEventListener('click', goBack);
      if (footerBackBtn) footerBackBtn.addEventListener('click', goBack);

      const collapseBtnDrill = this.container.querySelector('#btn-collapse-left-drill');
      if (collapseBtnDrill) {
        collapseBtnDrill.addEventListener('click', (e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('toggle-left-panel', { detail: false }));
        });
      }

      // ATA Tree Toggle & Checkboxes
      const ataHeaders = this.container.querySelectorAll('.ata-header');
      this.uncheckedMarkerIds = this.uncheckedMarkerIds || new Set();
      
      ataHeaders.forEach(header => {
        const checkbox = header.querySelector('.ata-branch-checkbox');
        if (checkbox) {
          checkbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const items = header.parentElement.querySelectorAll('.record-item');
            items.forEach(item => {
              const id = item.dataset.id;
              if (isChecked) {
                  this.uncheckedMarkerIds.delete(id);
              } else {
                  this.uncheckedMarkerIds.add(id);
              }
            });
            this.render();
          });
        }
        
        header.addEventListener('click', (e) => {
          if (e.target.type === 'checkbox') return; // Prevent toggle if clicked on checkbox
          const group = header.parentElement;
          const code = header.dataset.ata;
          const isExpanded = group.classList.toggle('expanded');
          const chevron = header.querySelector('.chevron');
          if (isExpanded) {
            this.collapsedAtaGroups.delete(code);
            chevron.textContent = '▼';
          } else {
            this.collapsedAtaGroups.add(code);
            chevron.textContent = '▶';
          }
        });
      });

      // Record selection
      const recordItems = this.container.querySelectorAll('.record-item');
      recordItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();

          const pinIcon = e.target.closest('.icon-pin');
          if (pinIcon) {
            this.filter3D = !this.filter3D;
            this.render();
            return;
          }

          const id = item.getAttribute('data-id');
          this.selectedMarkerId = id;

          const marker = this.markerData.find(m => m.id === id);
          if (marker) {
            window.dispatchEvent(new CustomEvent('damage-marker-select', { detail: marker }));
          }
          this.render();
        });
      });

      // Tab switch logic
      const tabs = this.container.querySelectorAll('.tab-item');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const targetTab = tab.dataset.tab;
          if (this.activeTab === targetTab) return;
          this.activeTab = targetTab;
          if (window.app) window.app.toggleRightPanel(false);
          this.render();
        });
      });

      // Multi-select dropdown toggle
      const dropdowns = this.container.querySelectorAll('.custom-dropdown');
      dropdowns.forEach(dd => {
        const header = dd.querySelector('.dropdown-header');
        header.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = dd.dataset.id;
          if (this.openDropdownId === id) this.openDropdownId = null;
          else this.openDropdownId = id;
          this.render();
        });
      });

      // Multi-select checkbox change
      const cbs = this.container.querySelectorAll('.multi-select-cb');
      cbs.forEach(cb => {
        cb.addEventListener('change', (e) => {
          const val = e.target.value;
          const isChecked = e.target.checked;
          const dropdownId = e.target.dataset.dropdown;
          
          if (dropdownId === 'drill-ata-filter') {
            if (val === '全部ATA') {
              this.activeFilters.ata = ['全部ATA'];
            } else {
              this.activeFilters.ata = this.activeFilters.ata.filter(a => a !== '全部ATA');
              if (isChecked) this.activeFilters.ata.push(val);
              else this.activeFilters.ata = this.activeFilters.ata.filter(a => a !== val);
              if (this.activeFilters.ata.length === 0) this.activeFilters.ata = ['全部ATA'];
            }
          } else if (dropdownId === 'drill-manual-filter') {
            if (val === 'all') {
              this.selectedManualStatuses = ['published', 'unpublished', 'none'];
            } else {
               if (this.selectedManualStatuses.length === 3) this.selectedManualStatuses = [];
               if (isChecked) this.selectedManualStatuses.push(val);
               else this.selectedManualStatuses = this.selectedManualStatuses.filter(s => s !== val);
               if (this.selectedManualStatuses.length === 0) this.selectedManualStatuses = ['published', 'unpublished', 'none'];
            }
          } else if (dropdownId === 'drill-type-filter') {
            if (val === '全部类型') {
              this.selectedTypeLabels = [];
            } else {
              if (isChecked) this.selectedTypeLabels.push(val);
              else this.selectedTypeLabels = this.selectedTypeLabels.filter(t => t !== val);
            }
          }
          this.render();
        });
      });

      // Search input handler with Debounce
      let searchDebounceTimeout = null;
      const partSearchInput = this.container.querySelector('#drill-part-search');
      if (partSearchInput) {
        partSearchInput.addEventListener('input', (e) => {
          this.activeFilters.partNo = e.target.value;
          this.searchQuery = e.target.value;

          clearTimeout(searchDebounceTimeout);
          searchDebounceTimeout = setTimeout(() => {
            this.render();
            const newSearchInput = this.container.querySelector('#drill-part-search');
            if (newSearchInput) {
              newSearchInput.focus();
              newSearchInput.setSelectionRange(this.activeFilters.partNo.length, this.activeFilters.partNo.length);
            }
          }, 300); // 300ms debounce
        });
      }

      // Buttons
      const btnMarkup = this.container.querySelector('#btn-draw-markup');
      if (btnMarkup) {
        btnMarkup.addEventListener('click', (e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('enter-drawing-mode'));
        });
      }

      const btnExport = this.container.querySelector('#btn-export-tree');
      if (btnExport) {
        btnExport.addEventListener('click', (e) => {
          e.stopPropagation();
          alert('ATA结构树导出功能触发 (Mock: Exported to ATA_Tree.xlsx)');
        });
      }

      const crSearchInput = this.container.querySelector('#cr-search-input');
      if (crSearchInput) {
        crSearchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value;

          clearTimeout(searchDebounceTimeout);
          searchDebounceTimeout = setTimeout(() => {
            this.render();
            const newInput = this.container.querySelector('#cr-search-input');
            if (newInput) {
              newInput.focus();
              newInput.setSelectionRange(this.searchQuery.length, this.searchQuery.length);
            }
          }, 300); // 300ms debounce
        });
      }

      // Drilldown Reset Handler
      const drillResetBtn = this.container.querySelector('.sidebar-footer .btn-reset');
      if (drillResetBtn) {
        drillResetBtn.addEventListener('click', () => {
          this.filterManual = false;
          this.filter3D = false;
          this.selectedTypeLabels = [];
          this.selectedManualStatuses = ['published', 'unpublished', 'none'];
          this.searchQuery = '';
          this.dateRange = { start: '2026-01-01', end: '2026-04-01' };
          this.damageTypePanelVisible = false;
          this.manualFilterPanelVisible = false;
          this.render();
        });
      }
    }

    // Common Row selection logic
    const tbody = this.container.querySelector('.data-table tbody');
    if (tbody) {
      tbody.addEventListener('click', (e) => {
        const tr = e.target.closest('tr');
        if (tr) {
          this.container.querySelectorAll('.data-table tr').forEach(r => r.classList.remove('selected'));
          tr.classList.add('selected');
        }
      });
    }
  }

  addStyles() {
    const styleId = 'record-sidebar-styles';
    if (document.getElementById(styleId)) {
      // Update existing style if needed, or just return. 
      // For recovery, let's replace it to be sure.
      document.getElementById(styleId).remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .sidebar-container {
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
        overflow: hidden;
        min-height: 0;
      }

      .separator {
        color: #cbd5e1;
      }

      /* Refined Sidebar Header */
      .sidebar-header-title {
        padding: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-main);
        font-size: 15px;
        background: rgba(240, 242, 245, 0.4);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .btn-toggle-sidebar {
        background: rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(0, 0, 0, 0.05);
        color: #64748b;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .btn-toggle-sidebar:hover {
        background: white;
        color: var(--primary-blue);
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }

      
      /* Refined Filter Section */
      .filter-section {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        background: rgba(245, 245, 245, 0.3);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
      
      .ata-header {
        padding: 6px 12px;
        display: flex;
        align-items: center;
        cursor: pointer;
        gap: 6px;
        font-size: 12px;
        color: var(--text-main);
        transition: background 0.2s;
      }
      
      .ata-header:hover {
        background: #f8fafc;
      }
      
      .ata-header .chevron {
        font-size: 9px;
        color: #cbd5e1;
        width: 10px;
        transition: transform 0.2s;
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
