export class PopupManager {
  constructor(parentContainer) {
    this.parent = parentContainer;
    this.container = null;
    this.data = null;
    this.isVisible = false;
    this.init();
  }

  init() {
    this.container = document.createElement('div');
    this.container.className = 'component-popup';
    this.container.style.display = 'none';
    this.parent.appendChild(this.container);
    this.addStyles();
    this.initGlobalEvents(); // Initialize global listeners once
  }

  initGlobalEvents() {
    window.addEventListener('confirm-delete-action', (e) => {
      const id = e.detail.id;
      if (!this.records) return;

      // Check if the deleted record is in our current list
      const index = this.records.findIndex(r => r.id === id);
      if (index !== -1) {
        // Remove from list
        this.records = this.records.filter(r => r.id !== id);

        if (this.records.length === 0) {
          this.hide();
        } else if (this.data && this.data.id === id) {
          // If we were showing the deleted record, switch to the first remaining one
          this.selectRecord(this.records[0].id);
        } else {
          // Just re-render the list
          this.render();
          this.initEvents();
        }
      }
    });
  }

  show(records, selectedId, nodeContext = null) {
    this.records = records;
    this.nodeContext = nodeContext;
    this.selectRecord(selectedId, false);
    this.isVisible = true;
    this.render();
    this.container.style.display = 'block';
    this.initEvents();

    // Draw leader line after a short delay to ensure DOM is ready
    setTimeout(() => this.updateLeaderLine(), 50);
  }

  selectRecord(selectedId, shouldRender = true) {
    const currentRecord = this.records.find(r => r.id === selectedId);
    if (currentRecord) {
      this.data = currentRecord;
      if (shouldRender) {
        this.render();
        this.initEvents();
        setTimeout(() => this.updateLeaderLine(), 20);
      }
    }
  }

  hide() {
    this.isVisible = false;
    this.container.style.display = 'none';
    this.updateLeaderLine(true); // Clear line
  }

  updateLeaderLine(clear = false) {
    // 引出线效果由于影响视距并且交互复杂已取消
    return;
  }

  clearLeaderLine() {
    this.updateLeaderLine(true);
  }

  render() {
    const title = '零部件损伤标记信息';
    const mainRecord = this.data;

    let name = '结构损伤区域';
    if (this.nodeContext && this.nodeContext.ataCode) {
      name = `ATA ${this.nodeContext.ataCode} ${this.nodeContext.label || ''}`.trim();
    } else if (mainRecord.ataCode) {
      name = `ATA ${mainRecord.ataCode} ${mainRecord.ataLabel || ''}`.trim();
    } else {
      name = mainRecord.title || name;
    }

    const coords = mainRecord.coords ? `( ${mainRecord.coords.x.toFixed(1)}, ${mainRecord.coords.y.toFixed(1)}, 0.0 )` : '( 234.5, 120.3, 45.1 )';

    this.container.innerHTML = `
      <div class="popup-header">
        <span class="popup-title">零部件损伤标记信息</span>
        <button class="btn-close-popup">×</button>
      </div>
      <div class="popup-body">
        <div class="info-group">
          <div class="info-item">
            <span class="label">零部件名称:</span>
            <span class="value">${name}</span>
          </div>
          <div class="info-item">
            <span class="label">三维坐标:</span>
            <span class="value muted">${coords}</span>
          </div>
        </div>

        <button class="btn-popup-action primary" id="btn-view-component-cr" style="width: 100%; margin-bottom: 12px; height: 32px; font-weight: 600;">查看该零部件关联 CR 信息</button>

        <div class="records-section">
          <div class="section-label">已有损伤记录</div>
          <div class="table-scroll-container">
            <table class="popup-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>报告编号</th>
                  <th>损伤类型</th>
                </tr>
              </thead>
              <tbody>
                ${this.records.map((rec, index) => {
      const hasMulti = rec.typeLabels && rec.typeLabels.length > 1;
      const typeDesc = hasMulti ? `混合损伤: ${rec.typeLabels.join(', ')}` : (rec.typeLabels ? rec.typeLabels[0] : (rec.typeLabel || '未知'));

      let docBadge = '';
      if (!rec.isUserMarkup) {
        let hasSr = false;
        let hasCrs = false;
        if (rec.srRecords && rec.srRecords.length > 0) {
          hasSr = true;
          hasCrs = rec.srRecords.some(sr => sr.crsRecords && sr.crsRecords.length > 0);
        }

        if (hasSr && hasCrs) {
          docBadge = '<span class="badge-doc" style="background: #8b5cf6; color: white; padding: 0 4px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-right: 4px;">SR/CRS</span>';
        } else if (hasSr) {
          docBadge = '<span class="badge-doc" style="background: #10b981; color: white; padding: 0 4px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-right: 4px;">SR</span>';
        } else if (hasCrs) {
          docBadge = '<span class="badge-doc" style="background: #f59e0b; color: white; padding: 0 4px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-right: 4px;">CRS</span>';
        }
      }

      return `
                    <tr class="selectable-row ${rec.id === mainRecord.id ? 'current' : ''}" data-id="${rec.id}">
                      <td>${index + 1}</td>
                      <td class="id-cell">
                        ${rec.isUserMarkup ? '<span class="badge-new" style="background: var(--primary-blue); color: white; padding: 0 4px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-right: 4px;">NEW</span>' : docBadge}
                        ${rec.id}
                      </td>
                      <td title="${typeDesc}">${typeDesc}</td>
                    </tr>`;
    }).join('')}
              </tbody>
            </table>
          </div>
          <div class="pagination">
            <span class="page-prev">＜</span>
            <span class="page-info">1 / 1</span>
            <span class="page-next">＞</span>
          </div>
        </div>

        <div class="popup-footer" style="display: none;">
        </div>
      </div>
    `;
  }

  initEvents() {
    const closeBtn = this.container.querySelector('.btn-close-popup');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    const btnCr = this.container.querySelector('#btn-view-component-cr');
    if (btnCr) {
      btnCr.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('show-sidebar-detail', {
          detail: {
            type: 'CR',
            markerData: this.data // Use current marker context
          }
        }));
      });
    }

    // Handle reverse selection from table
    const rows = this.container.querySelectorAll('.selectable-row');
    rows.forEach(row => {
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = row.dataset.id;
        const selectedMarker = this.records.find(r => r.id === id);

        if (selectedMarker) {
          // 1. Hide the summary popup first
          this.hide();

          // 2. Dispatch event that main.js will use to open MarkerPopup
          // This will also update the internal state of sidebars WITHOUT forcing them open
          window.dispatchEvent(new CustomEvent('damage-marker-select', {
            detail: selectedMarker
          }));
        }
      });
    });

    // Resize listener for leader line
    window.addEventListener('resize', () => {
      if (this.isVisible) this.updateLeaderLine();
    });
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .component-popup {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 360px;
        background: #ffffff;
        border-radius: 4px;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        overflow: hidden;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
      }

      .popup-header {
        background: #475569;
        color: white;
        padding: 6px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .popup-title {
        font-size: 12px;
        font-weight: 500;
      }

      .btn-close-popup {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }

      .popup-body {
        padding: 12px;
      }

      .info-group {
        margin-bottom: 12px;
      }

      .info-item {
        margin-bottom: 4px;
        font-size: 11px;
      }

      .info-item .label {
        color: #64748b;
        margin-right: 4px;
      }

      .info-item .value {
        color: #1e293b;
        font-weight: 500;
      }

      .info-item .value.muted {
        color: #94a3b8;
        font-weight: normal;
      }

      .records-section {
        margin-top: 12px;
      }

      .section-label {
        font-size: 11px;
        font-weight: 600;
        color: #475569;
        margin-bottom: 6px;
      }

      .table-scroll-container {
        max-height: 180px;
        overflow-y: auto;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        background: white;
      }

      /* Custom Scrollbar for High-Tech Feel */
      .table-scroll-container::-webkit-scrollbar {
        width: 4px;
      }
      .table-scroll-container::-webkit-scrollbar-track {
        background: transparent;
      }
      .table-scroll-container::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;
      }

      .popup-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
        border: none;
      }

      .popup-table th {
        position: sticky;
        top: 0;
        background: #f8fafc;
        text-align: left;
        padding: 6px;
        color: #64748b;
        border-bottom: 1px solid #e2e8f0;
        z-index: 10;
        box-shadow: 0 1px 0 #e2e8f0;
      }

      .popup-table td {
        padding: 8px 6px;
        color: #1e293b;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }

      .popup-table th:nth-child(1), .popup-table td:nth-child(1) { width: 40px; text-align: center; }
      .popup-table th:nth-child(2), .popup-table td:nth-child(2) { width: 180px; font-family: 'JetBrains Mono', monospace; }
      .popup-table th:nth-child(3), .popup-table td:nth-child(3) { width: auto; }

      .id-cell {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .selectable-row {
        cursor: pointer;
        transition: background 0.2s;
      }

      .selectable-row:hover {
        background: #f1f5f9;
      }

      .selectable-row.current {
        background: rgba(0, 82, 217, 0.05);
        font-weight: 600;
      }

      .selectable-row.current td {
        color: var(--primary-blue, #0052d9);
      }

      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        margin-top: 8px;
        font-size: 10px;
        color: #64748b;
      }

      .page-prev, .page-next {
        cursor: pointer;
        user-select: none;
      }

      .popup-footer {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }

      .btn-popup-action {
        flex: 1;
        padding: 6px 0;
        font-size: 11px;
        border: 1px solid #cbd5e1;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        color: #475569;
      }

      .btn-popup-action.primary {
        background: #475569;
        border-color: #475569;
        color: white;
      }

      .btn-popup-action:hover {
        background: #f8fafc;
      }

      .btn-popup-action.primary:hover {
        background: #334155;
      }
    `;
    document.head.appendChild(style);
  }
}
