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
      partNo: '',
      markerQuery: '',
      srQuery: '',
      crsQuery: ''
    };

    this.ataHierarchy = [
      {
        code: '32', label: '32 起落架', children: [
          {
            code: '32-11', label: '32-11 主起落架', children: [
              { code: '32-11-01', label: '32-11-01 减震支柱' },
              { code: '32-11-05', label: '32-11-05 起落架车架' }
            ]
          },
          {
            code: '32-21', label: '32-21 前起落架', children: [
              { code: '32-21-01', label: '32-21-01 收放支柱' }
            ]
          }
        ]
      },
      {
        code: '52', label: '52 舱门', children: [
          {
            code: '52-11', label: '52-11 登机门', children: [
              { code: '52-11-01', label: '52-11-01 门体结构' },
              { code: '52-11-10', label: '52-11-10 锁逻辑机构' }
            ]
          },
          {
            code: '52-71', label: '52-71 起落架舱门', children: [
              { code: '52-71-01', label: '52-71-01 主起落架舱门' }
            ]
          }
        ]
      },
      {
        code: '53', label: '53 机身', children: [
          {
            code: '53-11', label: '53-11 前机身', children: [
              { code: '53-11-01', label: '53-11-01 下部蒙皮' },
              { code: '53-11-05', label: '53-11-05 站位隔框' }
            ]
          },
          {
            code: '53-21', label: '53-21 中机身', children: [
              { code: '53-21-01', label: '53-21-01 中央翼连接件' }
            ]
          }
        ]
      },
      {
        code: '55', label: '55 安定面', children: [
          {
            code: '55-11', label: '55-11 水平安定面', children: [
              { code: '55-11-01', label: '55-11-01 左侧蒙皮' }
            ]
          }
        ]
      },
      {
        code: '57', label: '57 机翼', children: [
          {
            code: '57-11', label: '57-11 中央翼', children: [
              { code: '57-11-01', label: '57-11-01 前梁' }
            ]
          }
        ]
      }
    ];

    this.activeTab = 'ata-view';
    this.selectedMarkerId = null;
    this.selectedTreeNodeId = null;
    this.selectedBranchId = null;
    this.collapsedAtaGroups = new Set();
    this.uncheckedMarkerIds = new Set();
    this.uncheckedAtaNodes = new Set(); // Track hidden ATA chapters/segments

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
    this.selectedBranchId = null;

    if (id) {
      const marker = this.markerData.find(m => m.id === id);
      if (marker && marker.ataCode) {
        const parts = marker.ataCode.split('-');
        // Auto-expand parents: Chapter (32), Section (32-11)
        if (parts.length >= 1) this.collapsedAtaGroups.delete(parts[0]);
        if (parts.length >= 2) this.collapsedAtaGroups.delete(`${parts[0]}-${parts[1]}`);
      }
    }

    this.render();

    // Focal Scroll to target record
    if (id) {
      setTimeout(() => {
        const el = this.container.querySelector(`.record-item[data-id="${id}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Subtle high-tech highlight
          el.style.backgroundColor = 'rgba(0, 82, 217, 0.1)';
          setTimeout(() => el.style.backgroundColor = '', 1500);
        }
      }, 50);
    }
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
      const { type: aircraftTypeFilter, airline, ata, partNo, markerQuery, srQuery, crsQuery } = this.activeFilters;

      const matchesBreadcrumbType = !aircraftTypeFilter || aircraftTypeFilter.includes('全部型别') || aircraftTypeFilter.includes(item.aircraftType);
      const matchesBreadcrumbAirline = !airline || airline.includes('全部航司') || airline.includes(item.airline);
      const matchesBreadcrumbAta = !ata || ata.includes('全部ATA') || ata.some(selectedAta => item.ataCode.startsWith(selectedAta));

      // Part Number Search: Check in all associated CRS records
      const matchesBreadcrumbPartNo = !partNo || (item.srRecords || []).some(sr =>
        (sr.crsRecords || []).some(crs =>
          (crs.partNos || []).some(p => p.toLowerCase().includes(partNo.toLowerCase()))
        )
      );

      // Marker ID/Title Search
      const matchesBreadcrumbMarker = !markerQuery ||
        item.id.toLowerCase().includes(markerQuery.toLowerCase()) ||
        (item.title && item.title.toLowerCase().includes(markerQuery.toLowerCase()));

      // SR Search
      const matchesSR = (() => {
        if (!srQuery) return true;
        const q = srQuery.toLowerCase();
        return item.srRecords && item.srRecords.some(sr => 
          sr.id.toLowerCase().includes(q) || (sr.title && sr.title.toLowerCase().includes(q))
        );
      })();

      // CRS Search
      const matchesCRS = (() => {
        if (!crsQuery) return true;
        const q = crsQuery.toLowerCase();
        return item.srRecords && item.srRecords.some(sr => 
          sr.crsRecords && sr.crsRecords.some(crs => 
            crs.id.toLowerCase().includes(q) || (crs.title && crs.title.toLowerCase().includes(q))
          )
        );
      })();

      const matchesType = this.selectedTypeLabels.length === 0 || item.typeLabels.some(l => this.selectedTypeLabels.includes(l));
      const manualStatus = item.srRecords && item.srRecords[0] ? item.srRecords[0].manualStatus : 'none';
      const matchesManual = this.selectedManualStatuses.includes(manualStatus);
      const itemTs = new Date(item.date).getTime();
      const matchesDate = itemTs >= startTs && itemTs <= endTs;

      const isEditing = this.editingId === item.id;

      return !isEditing && matchesSearch && matchesBreadcrumbType && matchesBreadcrumbAirline && matchesBreadcrumbAta && matchesBreadcrumbPartNo && matchesBreadcrumbMarker && matchesSR && matchesCRS && (item.isUserMarkup || (matchesType && matchesManual && matchesDate)) && (!this.filter3D || item.has3D);
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
          
          // Auto-expand tree when ATA filter changes
          if (key === 'ata' && Array.isArray(newData[key])) {
             newData[key].forEach(ataCode => {
                if (ataCode !== '全部ATA') {
                   const parts = ataCode.split('-');
                   if (parts.length >= 1) this.collapsedAtaGroups.delete(parts[0]);
                   if (parts.length >= 2) this.collapsedAtaGroups.delete(`${parts[0]}-${parts[1]}`);
                   if (parts.length >= 3) this.collapsedAtaGroups.delete(ataCode);
                }
             });
          }
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

      let ataCode = detail.ataCode || targetNodeId;
      let ataLabel = `ATA ${ataCode}`;

      // Better label lookup
      const findAtaLabel = (nodes, code) => {
        for (const n of nodes) {
          if (n.code === code) return n.label;
          if (n.children) {
            const found = findAtaLabel(n.children, code);
            if (found) return found;
          }
        }
        return null;
      };

      const matchedLabel = findAtaLabel(this.ataHierarchy, ataCode);
      if (matchedLabel) {
        ataLabel = `ATA ${ataCode} ${matchedLabel.split(' ').pop()}`;
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
      const aircraft = detail.associatedAircraft && detail.associatedAircraft.length > 0
        ? detail.associatedAircraft[0]
        : { msn: '10001', registration: 'B91901P' };

      const newMarker = {
        id: newId,
        title: detail.title || '自定义零部件标记',
        typeLabels: ['其他'],
        aircraftType: this.activeFilters.type[0] === '全部型别' ? '基本型' : this.activeFilters.type[0],
        airline: this.activeFilters.airline[0] === '全部航司' ? '中国东航' : this.activeFilters.airline[0],
        ataCode: ataCode,
        ataLabel: ataLabel,
        subBranch: '自定义分段',
        has3D: true,
        siteId: `site-user-${newId}`,
        coords: { x: detail.x, y: detail.y },
        date: new Date().toISOString().split('T')[0],
        msn: aircraft.msn,
        registration: aircraft.registration,
        srRecords: [],
        crsRecords: [],
        crRecords: [],
        isUserMarkup: true,
        associatedAircraft: detail.associatedAircraft // Store all selected aircraft
      };

      this.markerData.push(newMarker);
      this.selectedMarkerId = newId;
      this.render();
    });

    window.addEventListener('edit-spatial-marker', (e) => {
      const marker = e.detail;
      this.editingId = marker.id;
      window.dispatchEvent(new CustomEvent('enter-drawing-mode', {
        detail: {
          mode: 'local-component',
          editingId: marker.id,
          title: marker.title,
          x: marker.coords.x,
          y: marker.coords.y,
          ataCode: marker.ataCode
        }
      }));
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
        else if (dropdownId === 'ata' || dropdownId === 'drill-ata-filter') {
          // ATA Hierarchical Selection Logic (Internal to Dropdown)
          const allAtaCodes = [];
          const collectCodes = (nodes) => nodes.forEach(n => { allAtaCodes.push(n.code); if (n.children) collectCodes(n.children); });
          collectCodes(this.ataHierarchy);

          const getChildren = (code) => {
            const children = [];
            const find = (nodes) => {
              for (const n of nodes) {
                if (n.code === code) { if (n.children) collectCodes(n.children, children); return true; }
                if (n.children && find(n.children)) return true;
              }
              return false;
            };
            const col = (nodes, list) => nodes.forEach(n => { list.push(n.code); if (n.children) col(n.children, list); });
            const f = (nodes) => {
               for(const n of nodes) {
                  if(n.code === code) { if(n.children) col(n.children, children); return true; }
                  if(n.children && f(n.children)) return true;
               }
               return false;
            }
            f(this.ataHierarchy);
            return children;
          };

          const targetCodes = [val, ...getChildren(val)];
          let currentAta = [...this.activeFilters.ata].filter(v => v !== '全部ATA');

          if (isChecked) {
            targetCodes.forEach(c => { if (!currentAta.includes(c)) currentAta.push(c); });
          } else {
            currentAta = currentAta.filter(v => !targetCodes.includes(v));
          }
          
          if (currentAta.length === 0) currentAta = ['全部ATA'];
          this.activeFilters.ata = currentAta;
        }
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

    // Post-render: Set indeterminate state for ATA Filter Dropdown
    this.syncAtaIndeterminateState();
  }

  syncAtaIndeterminateState() {
    const ataCheckboxes = this.container.querySelectorAll('.multi-select-cb[data-dropdown*="ata"]');
    const selectedAtas = this.activeFilters.ata;

    const getStatus = (node) => {
      const isSelected = selectedAtas.includes(node.code);
      if (!node.children || node.children.length === 0) {
        return isSelected ? 'checked' : 'unchecked';
      }
      const childrenStatuses = node.children.map(getStatus);
      if (childrenStatuses.every(s => s === 'checked')) return 'checked';
      if (childrenStatuses.some(s => s === 'checked' || s === 'indeterminate')) return 'indeterminate';
      return isSelected ? 'checked' : 'unchecked';
    };

    const updateRecursive = (nodes) => {
      nodes.forEach(node => {
        const status = getStatus(node);
        const cb = this.container.querySelector(`.multi-select-cb[value="${node.code}"][data-dropdown*="ata"]`);
        if (cb) {
          cb.indeterminate = (status === 'indeterminate');
          cb.checked = (status === 'checked');
        }
        if (node.children) updateRecursive(node.children);
      });
    };

    updateRecursive(this.ataHierarchy);
  }

  renderDropdownField(id, label, options, selectedValues) {
    const selectedText = selectedValues.length === 0 || selectedValues.includes('all') || selectedValues.includes('全部ATA') || selectedValues.includes('全部类型') || selectedValues.includes('全部型别') || selectedValues.includes('全部航司') || selectedValues.includes('全部MSN') || selectedValues.includes('全部注册号')
      ? '全部'
      : selectedValues.length === 1 ? selectedValues[0] : `${selectedValues[0]} 等${selectedValues.length}项`;

    const isOpen = this.openDropdownId === id;

    if (id.includes('ata')) {
      return this.renderAtaCascadingSelect(id, label, selectedValues);
    }

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

  renderAtaCascadingSelect(id, label, selectedValues) {
    const isOpen = this.openDropdownId === id;
    const selectedText = selectedValues.includes('全部ATA') ? '全部ATA' : (selectedValues.length === 1 ? selectedValues[0] : `${selectedValues[0]}...`);

    const renderLayer = (nodes) => {
      return `
        <div class="ata-cascade-menu" style="min-width: 180px;">
          ${nodes.map(node => {
        const hasChildren = node.children && node.children.length > 0;
        const isSelected = selectedValues.includes(node.code);
        return `
              <div class="ata-cascade-item">
                <label style="display: flex; align-items: center; padding: 8px 12px; gap: 10px; cursor: pointer; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                    <input type="checkbox" class="multi-select-cb" data-dropdown="${id}" value="${node.code}" ${isSelected ? 'checked' : ''} style="margin: 0;">
                    <span class="ata-code-label" style="font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; ${isSelected ? 'color: var(--primary-blue); font-weight: 600;' : 'color: #334155;'}">${node.label}</span>
                  </div>
                  ${hasChildren ? '<span style="font-size: 10px; color: #94a3b8;">▶</span>' : ''}
                </label>
                ${hasChildren ? `
                  <div class="ata-cascade-layer">
                    ${renderLayer(node.children)}
                  </div>
                ` : ''}
              </div>
            `;
      }).join('')}
        </div>
      `;
    };

    return `
      <div class="filter-row cascading" style="position: relative; z-index: ${isOpen ? 2000 : 1};">
        <span class="label">${label}</span>
        <div class="custom-dropdown" data-id="${id}" style="width: 150px;">
          <div class="dropdown-header" style="width: 100%; padding: 4px 8px; border: 1px solid ${isOpen ? 'var(--primary-blue)' : '#e2e8f0'}; border-radius: 6px; background: white; font-size: 11px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #1e293b;">${selectedText}</span>
            <span style="font-size: 10px; color: #64748b;">${isOpen ? '▲' : '▼'}</span>
          </div>
          ${isOpen ? `
          <div class="dropdown-list ata-cascade-container" style="position: absolute; top: calc(100% + 4px); left: 0; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); z-index: 2000; padding: 4px 0;">
            <label style="display: flex; align-items: center; padding: 10px 14px; gap: 10px; cursor: pointer; font-size: 11.5px; border-bottom: 1px solid #f1f5f9; background: #f8fafc; color: #1e293b;">
              <input type="checkbox" class="multi-select-cb" data-dropdown="${id}" value="全部ATA" ${selectedValues.includes('全部ATA') ? 'checked' : ''} style="margin: 0;">
              <span style="font-weight: 600;">全部 ATA 章节</span>
            </label>
            <div class="ata-cascade-root">
              ${renderLayer(this.ataHierarchy)}
            </div>
          </div>` : ''}
        </div>
      </div>
    `;
  }

  renderAtaGroups() {
    return this.ataTreeViewInstance.render();
  }

  getFilteredAircraftList() {
    const { type: typeFilter, airline: airlineFilter } = this.activeFilters;
    const aircraftMap = new Map();

    this.markerData.forEach(item => {
      const matchesType = typeFilter.includes('全部型别') || typeFilter.includes(item.aircraftType);
      const matchesAirline = airlineFilter.includes('全部航司') || airlineFilter.includes(item.airline);

      if (matchesType && matchesAirline) {
        const key = `${item.msn}-${item.registration}`;
        if (!aircraftMap.has(key)) {
          aircraftMap.set(key, {
            type: item.aircraftType,
            airline: item.airline,
            msn: item.msn,
            registration: item.registration,
            label: `${item.msn} (${item.registration})`
          });
        }
      }
    });

    return Array.from(aircraftMap.values());
  }

  getFilteredMarkers() {
    // Kept for backward compatibility with SpatialView integration
    const iconMap = this.ataTreeViewInstance.iconMap;
    const startTs = new Date(this.dateRange.start).getTime();
    const endTs = new Date(this.dateRange.end).getTime();

    const filteredItems = this.markerData.filter(item => {
      if (!item.has3D) return false;
      const { type: aircraftTypeFilter, airline, ata, partNo, markerQuery } = this.activeFilters;
      const matchesBreadcrumbType = !aircraftTypeFilter || aircraftTypeFilter.includes('全部型别') || aircraftTypeFilter.includes(item.aircraftType);
      const matchesBreadcrumbAirline = !airline || airline.includes('全部航司') || airline.includes(item.airline);
      const matchesBreadcrumbAta = !ata || ata.includes('全部ATA') || ata.some(selectedAta => item.ataCode.startsWith(selectedAta));

      const matchesBreadcrumbPartNo = !partNo || (item.srRecords || []).some(sr =>
        (sr.crsRecords || []).some(crs =>
          (crs.partNos || []).some(p => p.toLowerCase().includes(partNo.toLowerCase()))
        )
      );

      const matchesBreadcrumbMarker = !markerQuery ||
        item.id.toLowerCase().includes(markerQuery.toLowerCase()) ||
        (item.title && item.title.toLowerCase().includes(markerQuery.toLowerCase()));

      const matchesType = this.selectedTypeLabels.length === 0 || item.typeLabels.some(l => this.selectedTypeLabels.includes(l));
      const manualStatus = item.srRecords && item.srRecords[0] ? item.srRecords[0].manualStatus : 'none';
      const matchesManual = this.selectedManualStatuses.includes(manualStatus);
      const itemTs = new Date(item.date).getTime();
      const matchesDate = itemTs >= startTs && itemTs <= endTs;

      const isChecked = !this.uncheckedMarkerIds?.has(item.id);

      return matchesBreadcrumbType && matchesBreadcrumbAirline && matchesBreadcrumbAta && matchesBreadcrumbPartNo && matchesBreadcrumbMarker && (item.isUserMarkup || (matchesType && matchesManual && matchesDate)) && isChecked;
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
      const { type: aircraftTypeFilter, airline, ata, partNo, markerQuery } = this.activeFilters;
      const matchesBreadcrumbType = !aircraftTypeFilter || aircraftTypeFilter.includes('全部型别') || aircraftTypeFilter.includes(item.aircraftType);
      const matchesBreadcrumbAirline = !airline || airline.includes('全部航司') || airline.includes(item.airline);
      const matchesBreadcrumbAta = !ata || ata.includes('全部ATA') || ata.some(selectedAta => item.ataCode.startsWith(selectedAta));

      const matchesBreadcrumbPartNo = !partNo || (item.srRecords || []).some(sr =>
        (sr.crsRecords || []).some(crs =>
          (crs.partNos || []).some(p => p.toLowerCase().includes(partNo.toLowerCase()))
        )
      );

      const matchesBreadcrumbMarker = !markerQuery ||
        item.id.toLowerCase().includes(markerQuery.toLowerCase()) ||
        (item.title && item.title.toLowerCase().includes(markerQuery.toLowerCase()));

      const matchesType = this.selectedTypeLabels.length === 0 || item.typeLabels.some(l => this.selectedTypeLabels.includes(l));
      const manualStatus = item.srRecords && item.srRecords[0] ? item.srRecords[0].manualStatus : 'none';
      const matchesManual = this.selectedManualStatuses.includes(manualStatus);
      const itemTs = new Date(item.date).getTime();
      const matchesDate = itemTs >= startTs && itemTs <= endTs;

      return matchesBreadcrumbType && matchesBreadcrumbAirline && matchesBreadcrumbAta && matchesBreadcrumbPartNo && matchesBreadcrumbMarker && (item.isUserMarkup || (matchesType && matchesManual && matchesDate));
    });

    if (filteredItems.length === 0) {
      alert('当前列表无数据可导出');
      return;
    }

    const columns = [
      { label: '序号', field: 'index' },
      { label: '损伤编号', field: 'id' },
      { label: '名称', field: 'title' },
      { label: '发现日期', field: 'date' },
      { label: 'ATA章节', field: 'ataLabel' },
      { label: '子分段', field: 'subBranch' },
      { label: '架次', field: 'aircraftType' },
      { label: '航司', field: 'airline' }
    ];

    const exportData = filteredItems.map((item, idx) => ({
      ...item,
      index: idx + 1,
      subBranch: item.subBranch || '通用分段',
      ataLabel: item.ataLabel || `ATA ${item.ataCode}`
    }));

    const timestamp = new Date().toISOString().split('T')[0];
    ExportUtils.exportToExcel(exportData, columns, `Damage_Records_${timestamp}.xlsx`);
  }
}
