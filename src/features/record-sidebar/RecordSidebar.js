import { MockDataService } from '../../services/MockDataService.js';
import { ExportUtils } from '../../utils/ExportUtils.js';

// Sub-components
import { SelectionView } from './components/SelectionView.js';
import { DrillDownView } from './components/DrillDownView.js';
import { AtaTreeView } from './components/AtaTreeView.js';

// Styles
import './RecordSidebar.css';

/**
 * RecordSidebar (Coordinator)
 * Centrally manages markers, filters, and high-level routing between Level 1 and Level 2 views.
 */
export class RecordSidebar {
  constructor(container) {
    this.container = container;
    this.view = 'selection'; // 'selection' or 'drilldown'
    this.damageTypePanelVisible = false;

    // Global Filters
    this.filterManual = false;
    this.filter3D = false;
    this.selectedTypeLabels = [];
    this.selectedManualStatuses = ['published', 'unpublished', 'none'];
    this.searchQuery = '';
    this.manualFilterPanelVisible = false;
    this.dateRange = { start: '2026-01-01', end: '2026-04-01' };
    
    this.activeFilters = {
      type: ['全部型别'],
      airline: ['全部航司'],
      msn: ['全部MSN'],
      registration: ['全部注册号'],
      ata: ['全部ATA'],
      partNo: ''
    };

    this.activeTab = 'ata-view'; 
    this.selectedMarkerId = null;
    this.selectedTreeNodeId = null;
    this.selectedBranchId = null; // 显式记录选中的结构树分支

    // Utilize MockDataService to generate all markers
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
    this.markerData = MockDataService.generateMarkerData(this.spatialSites);

    // Instantiate Sub-views
    this.selectionView = new SelectionView(this);
    this.drillDownView = new DrillDownView(this);
    this.ataTreeViewInstance = new AtaTreeView(this);

    this.initGlobalEvents();
    this.render();
  }

  selectRecord(id) {
    this.selectedMarkerId = id || null;
    this.selectedTreeNodeId = id || null;
    this.selectedBranchId = null; // 选中具体记录时，标记已脱离“分支选中”状态
    this.render();
  }

  render() {
    const scrollContainer = this.container.querySelector('.table-container');
    const savedScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;

    if (this.view === 'selection') {
      this.selectionView.render();
    } else {
      this.drillDownView.render();
    }
    
    this.dispatchDataUpdate();
    this.initCommonEvents();

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

      setTimeout(() => {
        const item = this.container.querySelector(`.record-item[data-id="${id}"]`);
        if (item) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    });

    window.addEventListener('filter-change', (e) => {
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

    window.addEventListener('date-range-change', (e) => {
      this.dateRange = e.detail;
      this.render();
    });

    window.addEventListener('save-user-markup', (e) => {
      const detail = e.detail;
      const targetNodeId = this.selectedTreeNodeId;
      const editingId = detail.editingId;

      if (!targetNodeId && !editingId) {
        alert("请先在左侧选择一个ATA章节或分段");
        return;
      }

      let ataCode = '32';
      let ataLabel = 'ATA 32(起落架)'; 
      let subBranch = '通用分段';

      if (targetNodeId && targetNodeId.includes('-')) {
        const parts = targetNodeId.split('-');
        ataCode = parts[0];
        subBranch = parts[1];
      } else if (targetNodeId) {
        ataCode = targetNodeId;
      }

      if (editingId) {
        const existingMarker = this.markerData.find(m => m.id === editingId);
        if (existingMarker) {
          existingMarker.title = detail.title;
          existingMarker.coords = { x: detail.x, y: detail.y };
          this.editingId = null;
          this.selectedMarkerId = editingId;
          this.render();
          return;
        }
      }

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

    window.addEventListener('confirm-delete-action', (e) => {
      const id = e.detail.id;
      this.markerData = this.markerData.filter(m => m.id !== id);
      if (this.selectedMarkerId === id) {
        this.selectedMarkerId = null;
        if (window.app) window.app.toggleRightPanel(false);
      }
      this.render();
      this.dispatchDataUpdate(); 
    });

    window.addEventListener('refresh-timeline-data', () => {
      this.dispatchDataUpdate();
    });
  }

  initCommonEvents() {
    // Shared Dropdown logic
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

    // Delegate to AtaTreeView instance if in drilldown
    if (this.view === 'drilldown' && this.activeTab === 'ata-view') {
      this.ataTreeViewInstance.initEvents();
    }
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

  renderAtaGroups() {
    return this.ataTreeViewInstance.render();
  }

  getFilteredMarkers() {
    // Kept for backward compatibility with SpatialView integration
    const iconMap = this.ataTreeViewInstance.iconMap;
    const startTs = new Date(this.dateRange.start).getTime();
    const endTs = new Date(this.dateRange.end).getTime();

    const filteredItems = this.markerData.filter(item => {
      if (!item.has3D) return false;
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

      const isChecked = !this.uncheckedMarkerIds?.has(item.id);

      return matchesBreadcrumbType && matchesBreadcrumbAirline && matchesBreadcrumbAta && matchesBreadcrumbPartNo && (item.isUserMarkup || (matchesType && matchesManual && matchesDate)) && isChecked;
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

    return Object.values(siteGroups).map(site => ({
      ...site,
      isSelected: site.records.some(r => r.id === this.selectedMarkerId)
    }));
  }

  handleAtaExport() {
    const startTs = new Date(this.dateRange.start).getTime();
    const endTs = new Date(this.dateRange.end).getTime();

    const filteredItems = this.markerData.filter(item => {
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

      return matchesBreadcrumbType && matchesBreadcrumbAirline && matchesBreadcrumbAta && matchesBreadcrumbPartNo && (item.isUserMarkup || (matchesType && matchesManual && matchesDate));
    });

    if (filteredItems.length === 0) {
      alert('当前列表无数据可导出');
      return;
    }

    const columns = [
      { label: '损伤编号', field: 'id' },
      { label: '名称', field: 'title' },
      { label: '发现日期', field: 'date' },
      { label: 'ATA章节', field: 'ataLabel' },
      { label: '子分段', field: 'subBranch' },
      { label: '架次', field: 'aircraftType' },
      { label: '航司', field: 'airline' }
    ];

    const exportData = filteredItems.map(item => ({
      ...item,
      subBranch: item.subBranch || '通用分段',
      ataLabel: item.ataLabel || `ATA ${item.ataCode}`
    }));

    const timestamp = new Date().toISOString().split('T')[0];
    ExportUtils.exportToCSV(exportData, columns, `Damage_Records_${timestamp}.csv`);
  }
}
