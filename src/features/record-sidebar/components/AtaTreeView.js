/**
 * AtaTreeView
 * Logic for rendering and handling the ATA structure tree
 */
export class AtaTreeView {
  constructor(sidebar) {
    this.sidebar = sidebar;
    this.iconMap = {
      '凹坑': '◯', '裂纹': '⚡', '腐蚀': '░', '划伤': '≡', '磨损': '≈',
      '紧固件松动或缺损': '◩', '脱胶': '▚', '剥离': '◪', '穿孔': '◎',
      '缺损': '⊝', '雷击': '↯', '金属腐蚀': '▣', '复合材料/分层': '☰', '其他': '⧉'
    };
  }

  render() {
    const { sidebar, iconMap } = this;
    const startTs = new Date(sidebar.dateRange.start).getTime();
    const endTs = new Date(sidebar.dateRange.end).getTime();

    const filteredItems = sidebar.markerData.filter(item => {
      const matchesSearch = item.id.toLowerCase().includes(sidebar.searchQuery.toLowerCase()) || (item.title && item.title.toLowerCase().includes(sidebar.searchQuery.toLowerCase()));
      const { type: aircraftTypeFilter, airline, ata, partNo } = sidebar.activeFilters;
      const matchesBreadcrumbType = !aircraftTypeFilter || aircraftTypeFilter.includes('全部型别') || aircraftTypeFilter.includes(item.aircraftType);
      const matchesBreadcrumbAirline = !airline || airline.includes('全部航司') || airline.includes(item.airline);
      const matchesBreadcrumbAta = !ata || ata.includes('全部ATA') || ata.includes(item.ataCode);
      const matchesBreadcrumbPartNo = !partNo || item.id.toLowerCase().includes(partNo.toLowerCase()) || item.title.toLowerCase().includes(partNo.toLowerCase());

      const matchesType = sidebar.selectedTypeLabels.length === 0 || item.typeLabels.some(l => sidebar.selectedTypeLabels.includes(l));
      const manualStatus = item.srRecord ? item.srRecord.manualStatus : 'none';
      const matchesManual = sidebar.selectedManualStatuses.includes(manualStatus);
      const itemTs = new Date(item.date).getTime();
      const matchesDate = itemTs >= startTs && itemTs <= endTs;

      const isEditing = sidebar.editingId === item.id;
      return !isEditing && matchesSearch && matchesBreadcrumbType && matchesBreadcrumbAirline && matchesBreadcrumbAta && matchesBreadcrumbPartNo && (item.isUserMarkup || (matchesType && matchesManual && matchesDate)) && (!sidebar.filter3D || item.has3D);
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

    sidebar.uncheckedMarkerIds = sidebar.uncheckedMarkerIds || new Set();
    sidebar.collapsedAtaGroups = sidebar.collapsedAtaGroups || new Set();
    sidebar.selectedTreeNodeId = sidebar.selectedTreeNodeId || null;

    const html = Object.entries(ataGroups).sort((a, b) => a[0].localeCompare(b[0])).map(([code, group]) => {
      const isExpanded = !sidebar.collapsedAtaGroups.has(code);
      const branchesArr = Object.values(group.branches);
      const totalItems = branchesArr.reduce((sum, b) => sum + b.items.length, 0);
      const groupHasChecked = totalItems > 0 && branchesArr.some(b => b.items.some(item => !sidebar.uncheckedMarkerIds.has(item.id)));

      return `
      <div class="ata-group ${isExpanded ? 'expanded' : ''}">
        <div class="ata-header ${sidebar.selectedTreeNodeId === code ? 'selected' : ''}" data-node-id="${code}">
          <input type="checkbox" class="ata-branch-checkbox" style="margin-right: 6px; cursor: pointer;" ${groupHasChecked ? 'checked' : ''} />
          <span class="chevron" style="margin-right: 4px;">${isExpanded ? '▼' : '▶'}</span>
          <span class="ata-code">${group.label}</span>
          <span class="record-count">${totalItems}</span>
        </div>
        <div class="ata-content">
          ${Object.entries(group.branches).sort((a, b) => a[0].localeCompare(b[0])).map(([branchName, branch]) => {
            const branchId = `${code}-${branchName}`;
            const isBranchExpanded = !sidebar.collapsedAtaGroups.has(branchId);
            const branchHasChecked = branch.items.length > 0 && branch.items.some(item => !sidebar.uncheckedMarkerIds.has(item.id));

            return `
              <div class="ata-sub-branch ${isBranchExpanded ? 'expanded' : ''}">
                <div class="ata-sub-header ${sidebar.selectedTreeNodeId === branchId ? 'selected' : ''}" data-node-id="${branchId}">
                  <input type="checkbox" class="ata-branch-checkbox" style="margin-right: 6px; cursor: pointer;" ${branchHasChecked ? 'checked' : ''} />
                  <span class="chevron" style="margin-right: 4px;">${isBranchExpanded ? '▼' : '▶'}</span>
                  <span class="branch-name">${branch.label}</span>
                  <span class="record-count" style="margin-left: auto; font-size: 10px; color: #94a3b8;">${branch.items.length}</span>
                </div>
                <div class="ata-sub-content">
                  ${branch.items.map(item => {
                    const isSelected = item.id === sidebar.selectedMarkerId;
                    const isTreeSelected = item.id === sidebar.selectedTreeNodeId;
                    const isUserMarkup = item.isUserMarkup;

                    let actionsHtml = '';
                    if (isUserMarkup) {
                      actionsHtml = `
                         <span class="icon-delete" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; font-size: 11px; cursor: pointer;" title="删除标记">🗑️</span>
                         <span class="icon-edit" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; font-size: 11px; cursor: pointer;" title="重新标点">📝</span>
                         <span class="icon-pin ${sidebar.filter3D ? 'active' : ''}" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; font-size: 11px;" title="自定义零部件标记">✏️</span>
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
                        ${item.has3D ? `<span class="icon-pin ${sidebar.filter3D ? 'active' : ''}" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; font-size: 11px;" title="三维标记">📍</span>` : '<span class="icon-placeholder" style="display: inline-block; width: 16px; height: 16px;"></span>'}
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

    return html;
  }

  initEvents() {
    const { sidebar } = this;
    const ataHeaders = sidebar.container.querySelectorAll('.ata-header, .ata-sub-header');
    ataHeaders.forEach(header => {
      header.addEventListener('click', (e) => {
        if (e.target.type === 'checkbox') {
          const isChecked = e.target.checked;
          const items = header.parentElement.querySelectorAll('.record-item');
          items.forEach(item => {
            const id = item.dataset.id;
            if (isChecked) sidebar.uncheckedMarkerIds.delete(id);
            else sidebar.uncheckedMarkerIds.add(id);
          });
          sidebar.render();
          return;
        }

        const nodeId = header.dataset.nodeId;
        if (nodeId) {
          sidebar.selectedTreeNodeId = nodeId;
          sidebar.selectedBranchId = nodeId; // 显式记录当前选中的是结构树枝
        }

        if (e.target.classList.contains('chevron')) {
          const group = header.parentElement;
          const isExpanded = group.classList.toggle('expanded');
          if (isExpanded) sidebar.collapsedAtaGroups.delete(nodeId);
          else sidebar.collapsedAtaGroups.add(nodeId);
        }
        sidebar.render();
      });
    });

    // Record items inside ATA tree
    const recordItems = sidebar.container.querySelectorAll('.record-item');
    recordItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const id = item.dataset.id;
        const marker = sidebar.markerData.find(m => m.id === id);
        if (!marker) return;

        const target = e.target;
        if (target.closest('.icon-delete')) {
          e.stopPropagation();
          // 改用 request-delete-markup 以触发系统内部自定义样式的确认弹窗 (由 SpatialView 处理)
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
          sidebar.selectedMarkerId = id;
          window.dispatchEvent(new CustomEvent('damage-marker-select', { detail: marker }));
          window.dispatchEvent(new CustomEvent('locate-spatial-marker', { detail: marker }));
          sidebar.render();
          return;
        }

        // Default selection
        sidebar.selectedMarkerId = id;
        sidebar.selectedBranchId = null; // 选中任务记录条目时，清除“纯树枝”选中态
        window.dispatchEvent(new CustomEvent('damage-marker-select', { detail: marker }));
        sidebar.render();
      });
    });
  }
}
