/**
 * AtaTreeView
 * Logic for rendering and handling the ATA structure tree (Level 2)
 * Supporting 6-digit Chapter-Section-Subject hierarchy
 */
export class AtaTreeView {
  constructor(sidebar) {
    this.sidebar = sidebar;
    this.iconMap = {
      '凹坑': '◯', '裂纹': '⚡', '腐蚀': '░', '划伤': '≡', '磨损': '≈',
      '紧固件松动': '◩', '雷击': '↯', '分层': '☰', '其他': '⧉'
    };
  }

  render() {
    const { sidebar, iconMap } = this;
    const { ataHierarchy } = sidebar;
    const startTs = new Date(sidebar.dateRange.start).getTime();
    const endTs = new Date(sidebar.dateRange.end).getTime();

    // 1. Filter all markers based on current global search & breadcrumb filters
    const allFilteredItems = sidebar.markerData.filter(item => {
      const matchesSearch = item.id.toLowerCase().includes(sidebar.searchQuery.toLowerCase()) || (item.title && item.title.toLowerCase().includes(sidebar.searchQuery.toLowerCase()));
      const { type: aircraftTypeFilter, airline, ata, partNo, markerQuery } = sidebar.activeFilters;

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

      const { srQuery, crsQuery } = sidebar.activeFilters;
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

      const matchesType = sidebar.selectedTypeLabels.length === 0 || item.typeLabels.some(l => sidebar.selectedTypeLabels.includes(l));
      const manualStatus = item.srRecords && item.srRecords[0] ? item.srRecords[0].manualStatus : 'none';
      const matchesManual = sidebar.selectedManualStatuses.includes(manualStatus);
      const itemTs = new Date(item.date).getTime();
      const matchesDate = itemTs >= startTs && itemTs <= endTs;

      const isEditing = sidebar.editingId === item.id;
      return matchesSearch && matchesBreadcrumbType && matchesBreadcrumbAirline && matchesBreadcrumbAta && matchesBreadcrumbPartNo && matchesBreadcrumbMarker && matchesSR && matchesCRS && (item.isUserMarkup || (matchesType && matchesManual && matchesDate)) && (!sidebar.filter3D || item.has3D);
    });

    // 2. Recursive rendering function for ATA nodes
    const renderNode = (node, level = 0) => {
      const { ata: selectedAtas } = sidebar.activeFilters;
      const isAtaFiltered = selectedAtas && selectedAtas.length > 0 && !selectedAtas.includes('全部ATA');
      
      const manualCollapsed = sidebar.collapsedAtaGroups?.has(node.code);
      const isExpanded = manualCollapsed ? false : true;
      const isSelected = sidebar.selectedTreeNodeId === node.code;
      const isChecked = !sidebar.uncheckedAtaNodes.has(node.code);
      
      // Highlight if this specific node is targeted by the global filter
      const isFilteredMatch = isAtaFiltered && selectedAtas.includes(node.code);

      // Strong Isolation Logic:
      // If a filter is active, only show nodes that are on the path or are children of the target
      if (isAtaFiltered) {
        const isOnPath = selectedAtas.some(filterAta => 
           filterAta.startsWith(node.code) || node.code.startsWith(filterAta)
        );
        if (!isOnPath) return '';
      }

      // Get items belonging to this node (specifically or via prefix)
      const directItems = allFilteredItems.filter(item => item.ataCode === node.code);
      const recursiveItems = allFilteredItems.filter(item => item.ataCode.startsWith(node.code));
      
      // In isolation mode, we might want to show empty chapters if they are part of the filtered path
      if (!isAtaFiltered && recursiveItems.length === 0 && level > 0) return ''; 

      const hasChildren = node.children && node.children.length > 0;
      const paddingLeft = level * 8; 

      return `
        <div class="ata-node-container ${hasChildren ? 'has-children' : ''} ${isExpanded ? 'expanded' : 'collapsed'} ${isFilteredMatch ? 'filtered-match' : ''}" style="margin-left: ${level > 0 ? 4 : 0}px;">
          <div class="ata-header ${isSelected ? 'selected' : ''}" 
               data-node-id="${node.code}" 
               data-node-label="${node.label}"
               style="padding-left: ${paddingLeft}px;">
            <div class="header-left">
              <input type="checkbox" class="ata-visibility-cb" data-node-id="${node.code}" ${isChecked ? 'checked' : ''} style="margin: 0 6px 0 2px; cursor: pointer;">
              <span class="chevron" style="visibility: ${hasChildren ? 'visible' : 'hidden'}">${isExpanded ? '▼' : '▶'}</span>
              <span class="ata-code-label" title="${node.label}">${level === 0 ? node.label : node.label.split(' ').pop()}</span>
            </div>
            <span class="record-count">${recursiveItems.length}</span>
          </div>
          
          <div class="ata-content" style="display: ${isExpanded ? 'block' : 'none'};">
            ${hasChildren ? node.children.map(child => renderNode(child, level + 1)).join('') : ''}
            
            <div class="record-list">
              ${directItems.map(item => {
                const isItemActive = sidebar.selectedMarkerId === item.id;
                const isItemEditing = sidebar.editingId === item.id;
                
                let hasSr = false;
                let hasCrs = false;
                if (item.srRecords && item.srRecords.length > 0) {
                  hasSr = true;
                  hasCrs = item.srRecords.some(sr => sr.crsRecords && sr.crsRecords.length > 0);
                }

                return `
                  <div class="record-item ${isItemActive ? 'selected' : ''} ${isItemEditing ? 'editing' : ''}" data-id="${item.id}">
                    <div class="record-info">
                      ${item.isUserMarkup ? 
                        `<span class="record-id" style="color: var(--primary-blue); font-weight: 600;">${item.title || '未命名损伤'}</span>` : 
                        `<span class="record-id">${item.id}</span>`
                      }
                    </div>
                    <div class="record-actions">
                      <span class="status-icon sr ${hasSr ? 'active' : ''}" title="${hasSr ? '已开启维修申请 (SR)' : '未开启 SR'}">SR</span>
                      <span class="status-icon crs ${hasCrs ? 'active' : ''}" title="${hasCrs ? '已发布修理方案 (CRS)' : '未发布 CRS'}">CRS</span>

                      ${item.isUserMarkup ? `
                        <span class="action-btn icon-edit" title="再编辑">🖌️</span>
                        <span class="action-btn icon-delete" title="删除">🗑️</span>
                      ` : `
                        <span class="icon-type" title="类型: ${item.typeLabels[0]}">${iconMap[item.typeLabels[0]] || '⊞'}</span>
                        <span class="icon-pin ${sidebar.filter3D && item.has3D ? 'active' : ''}" title="定位标记" style="opacity: ${sidebar.filter3D && item.has3D ? 1 : 0.4};">📍</span>
                      `}
                    </div>
                  </div>
                `;

              }).join('')}
            </div>
          </div>
        </div>
      `;
    };

    const isRootChecked = !sidebar.uncheckedAtaNodes.has('C919');
    const isRootCollapsed = sidebar.collapsedAtaGroups.has('C919');
    const treeHtml = ataHierarchy.map(chapter => renderNode(chapter, 1)).join('');

    return `
      <div class="tree-view-wrapper">
        <div class="ata-node-container root-node ${isRootCollapsed ? 'collapsed' : 'expanded'}" style="margin-bottom: 4px;">
          <div class="ata-header root-header" data-node-id="C919" data-node-label="全机" style="background: rgba(0,0,0,0.02); border-left: 3px solid var(--primary-blue);">
            <div class="header-left">
              <input type="checkbox" class="ata-visibility-cb" data-node-id="C919" ${isRootChecked ? 'checked' : ''} style="margin: 0 6px 0 2px; cursor: pointer;">
              <span class="chevron">${isRootCollapsed ? '▶' : '▼'}</span>
              <span class="ata-code-label" style="font-weight: 700; color: var(--primary-blue);">C919</span>
            </div>
            <span class="record-count" style="background: var(--primary-blue); color: white;">${allFilteredItems.length}</span>
          </div>
          <div class="ata-content" style="display: ${isRootCollapsed ? 'none' : 'block'};">
            ${treeHtml || '<div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">当前筛选条件下无可用 ATA 记录</div>'}
          </div>
        </div>
      </div>
    `;
  }

  initEvents() {
    const { sidebar } = this;

    // Visibility Checkboxes
    const checkboxes = sidebar.container.querySelectorAll('.ata-visibility-cb');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const nodeId = cb.dataset.nodeId;
        const isChecked = cb.checked;

        const updateRecursive = (id, checked) => {
          if (checked) {
            sidebar.uncheckedAtaNodes.delete(id);
          } else {
            sidebar.uncheckedAtaNodes.add(id);
          }

          // Find the node in hierarchy to get children
          const findAndSync = (nodes) => {
            for (const n of nodes) {
              if (n.code === id) {
                if (n.children) {
                  n.children.forEach(c => updateRecursive(c.code, checked));
                }
                return true;
              }
              if (n.children && findAndSync(n.children)) return true;
            }
            return false;
          };

          if (id === 'C919') {
            sidebar.ataHierarchy.forEach(c => updateRecursive(c.code, checked));
          } else {
            findAndSync(sidebar.ataHierarchy);
          }
        };

        updateRecursive(nodeId, isChecked);

        // Dispatch event for SpatialView or other components
        window.dispatchEvent(new CustomEvent('ata-visibility-changed', {
          detail: {
            nodeId,
            isChecked,
            uncheckedNodes: Array.from(sidebar.uncheckedAtaNodes)
          }
        }));

        sidebar.render();
      });

      // Prevent parent click
      cb.addEventListener('click', e => e.stopPropagation());
    });

    // ATA Headers (Chapters/Sections/Subjects)
    const headers = sidebar.container.querySelectorAll('.ata-header');
    headers.forEach(header => {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        const nodeId = header.dataset.nodeId;

        // Handle collapse/expand if clicking chevron specifically
        if (e.target.classList.contains('chevron') || e.target.closest('.chevron')) {
          if (sidebar.collapsedAtaGroups.has(nodeId)) {
            sidebar.collapsedAtaGroups.delete(nodeId);
          } else {
            sidebar.collapsedAtaGroups.add(nodeId);
          }
        } else {
          // Select the whole branch
          sidebar.selectedTreeNodeId = nodeId;
          sidebar.selectedBranchId = nodeId;
          sidebar.selectedMarkerId = null; // Clear individual selection
          window.dispatchEvent(new CustomEvent('ata-branch-select', { 
            detail: { ataCode: nodeId, label: header.dataset.nodeLabel || '未知' } 
          }));
        }

        sidebar.render();
      });
    });

    // Individual Record Items
    const records = sidebar.container.querySelectorAll('.record-item');
    records.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = item.dataset.id;
        const marker = sidebar.markerData.find(m => m.id === id);
        if (!marker) return;

        sidebar.selectedMarkerId = id;
        sidebar.selectedTreeNodeId = null; // Clear branch selection
        sidebar.selectedBranchId = null;

        window.dispatchEvent(new CustomEvent('damage-marker-select', { detail: marker }));

        const target = e.target;
        if (target.closest('.icon-pin')) {
          window.dispatchEvent(new CustomEvent('locate-spatial-marker', { detail: marker }));
        } else if (target.closest('.icon-edit')) {
          // Start edit mode for this marker
          window.dispatchEvent(new CustomEvent('edit-spatial-marker', { detail: marker }));
        } else if (target.closest('.icon-delete')) {
          const displayName = marker.title || id;
          window.dispatchEvent(new CustomEvent('request-confirm-dialog', {
            detail: {
              title: '确认删除标记',
              message: `您确定要删除标记 “${displayName}” 吗？此操作不可撤销。`,
              confirmAction: 'confirm-delete-action',
              confirmDetail: { id }
            }
          }));
        }

        sidebar.render();
      });
    });
  }
}
