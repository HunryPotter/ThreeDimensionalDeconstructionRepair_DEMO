/**
 * SelectionView (Level 1)
 * Handles the Aircraft Selection Dashboard
 */
export class SelectionView {
  constructor(sidebar) {
    this.sidebar = sidebar;
  }

  render() {
    const { sidebar } = this;
    const isSelected = (key, value) => {
      const current = sidebar.activeFilters[key];
      if (Array.isArray(current)) return current.includes(value);
      return current === value;
    };

    // Cascading logic for dropdown options
    const { type: selType, airline: selAirline, msn: selMSN, registration: selReg } = sidebar.activeFilters;
    
    const markersForAirline = sidebar.markerData.filter(m => !selType || selType.includes('全部型别') || selType.includes(m.aircraftType));
    const dynamicAirlines = Array.from(new Set(markersForAirline.map(m => m.airline))).sort();

    const markersForMSN = markersForAirline.filter(m => !selAirline || selAirline.includes('全部航司') || selAirline.includes(m.airline));
    const dynamicMSNs = Array.from(new Set(markersForMSN.map(m => m.msn))).sort();

    const markersForReg = markersForMSN.filter(m => !selMSN || selMSN.includes('全部MSN') || selMSN.includes(m.msn));
    const dynamicRegs = Array.from(new Set(markersForReg.map(m => m.registration))).sort();

    // Table List Filter
    const filteredMarkers = sidebar.markerData.filter(item => {
      const { type, airline, msn, registration } = sidebar.activeFilters;
      const matchesType = !type || type.includes('全部型别') || type.includes(item.aircraftType);
      const matchesAirline = !airline || airline.includes('全部航司') || airline.includes(item.airline);
      const matchesMSN = !msn || msn.includes('全部MSN') || msn.includes(item.msn);
      const matchesReg = !registration || registration.includes('全部注册号') || registration.includes(item.registration);
      return matchesType && matchesAirline && matchesMSN && matchesReg;
    });

    // Group by unique aircraft
    const aircraftMap = new Map();
    filteredMarkers.forEach(m => {
      const key = `${m.registration}-${m.msn}`;
      if (!aircraftMap.has(key)) {
        aircraftMap.set(key, {
          registration: m.registration,
          msn: m.msn,
          aircraftType: m.aircraftType,
          airline: m.airline
        });
      }
    });

    const aircraftList = Array.from(aircraftMap.values());

    sidebar.container.innerHTML = `
      <div class="sidebar-container">
        <div class="sidebar-header-title" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 2px solid rgba(0,0,0,0.04);">
          <strong style="font-size: 14px; color: #1e293b;">筛选看板</strong>
        </div>
        
        <div class="filter-section">
          ${sidebar.renderDropdownField('type', '型别选择', [
            { label: '全部型别', value: '全部型别' },
            { label: '基本型', value: '基本型' },
            { label: '高原型', value: '高原型' }
          ], sidebar.activeFilters.type)}

          ${sidebar.renderDropdownField('airline', '航司选择', [
            { label: '全部航司', value: '全部航司' },
            ...dynamicAirlines.map(a => ({ label: a, value: a }))
          ], sidebar.activeFilters.airline)}

          ${sidebar.renderDropdownField('msn', 'MSN号查询', [
            { label: '全部MSN', value: '全部MSN' },
            ...dynamicMSNs.map(msn => ({ label: msn, value: msn }))
          ], sidebar.activeFilters.msn)}

          ${sidebar.renderDropdownField('registration', '注册号查询', [
            { label: '全部注册号', value: '全部注册号' },
            ...dynamicRegs.map(reg => ({ label: reg, value: reg }))
          ], sidebar.activeFilters.registration)}

          ${sidebar.renderDropdownField('ata', 'ATA章节', [
            { label: '全部ATA', value: '全部ATA' },
            { label: '32', value: '32' },
            { label: '52', value: '52' },
            { label: '53', value: '53' },
            { label: '55', value: '55' },
            { label: '57', value: '57' }
          ], sidebar.activeFilters.ata)}

          <div class="filter-row">
            <span class="label">件号查询</span>
            <input type="text" id="part-no-input" placeholder="输入件号模糊搜索" value="${sidebar.activeFilters.partNo || ''}" class="sidebar-input">
          </div>
        </div>
        
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>型别</th>
                <th>航司</th>
                <th>MSN号</th>
                <th>注册号</th>
              </tr>
            </thead>
            <tbody>
              ${aircraftList.length > 0 ? aircraftList.map((ac, i) => `
                <tr class="${i === 0 ? 'selected' : ''}">
                  <td>${ac.aircraftType}</td>
                  <td>${ac.airline}</td>
                  <td style="font-weight: 500;">${ac.msn}</td>
                  <td style="color: var(--primary-blue); font-weight: 500;">${ac.registration}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="4" style="text-align: center; padding: 40px; color: #94a3b8;">暂无符合条件的飞机</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
        
        <div class="sidebar-footer">
          <div class="footer-stats">共 ${aircraftList.length} 条记录</div>
          <div class="footer-actions">
            <button class="btn-reset">重置</button>
            <button class="btn-confirm" id="btn-overview-confirm">确认</button>
          </div>
        </div>

        <button class="btn-toggle-handle" id="btn-left-sidebar-toggle" title="隐藏/显示面板">
          <span class="handle-icon">◀</span>
        </button>
      </div>
    `;

    this.initEvents();
  }

  initEvents() {
    const { sidebar } = this;
    const dispatchFilterChange = () => {
      window.dispatchEvent(new CustomEvent('filter-change', { detail: sidebar.activeFilters }));
    };

    // Confirm button
    const btnConfirm = sidebar.container.querySelector('#btn-overview-confirm');
    if (btnConfirm) {
      btnConfirm.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.view = 'drilldown';
        if (window.app) window.app.setViewLevel(2);
        sidebar.render();
        window.dispatchEvent(new CustomEvent('enter-drilldown'));
      });
    }

    // Reset button
    const resetBtn = sidebar.container.querySelector('.btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        sidebar.activeFilters = {
          type: ['全部型别'],
          airline: ['全部航司'],
          msn: ['全部MSN'],
          registration: ['全部注册号'],
          ata: ['全部ATA'],
          partNo: ''
        };
        dispatchFilterChange();
        window.dispatchEvent(new CustomEvent('filter-reset'));
        sidebar.render();
      });
    }

    // Search Input
    const partNoInput = sidebar.container.querySelector('#part-no-input');
    if (partNoInput) {
      partNoInput.addEventListener('input', (e) => {
        sidebar.activeFilters.partNo = e.target.value;
        dispatchFilterChange();
      });
    }

    // Row selection in table
    const tableRows = sidebar.container.querySelectorAll('.data-table tbody tr');
    tableRows.forEach(row => {
      row.addEventListener('click', () => {
        tableRows.forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
      });
    });

    // Toggle Sidebar
    const toggleHandle = sidebar.container.querySelector('#btn-left-sidebar-toggle');
    if (toggleHandle) {
      toggleHandle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.app) window.app.toggleLeftPanel();
      });
    }
  }
}
