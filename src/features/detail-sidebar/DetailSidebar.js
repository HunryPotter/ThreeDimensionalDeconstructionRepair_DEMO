export class DetailSidebar {
  constructor(container) {
    this.container = container;
    this.markerData = null;
    this.viewMode = 'DAMAGE'; // DAMAGE, SR, CRS, CR
    this.selectedId = null;   // SR/CRS ID
    this.targetSrId = null;
    this.addStyles();
    this.render();
    this.initEvents();
  }

  initEvents() {
    window.addEventListener('damage-marker-select', (e) => {
      this.markerData = e.detail;
      this.viewMode = 'DAMAGE';
      this.selectedId = null;
      
      this.expandSidebar();
      this.render();
    });

    window.addEventListener('show-sr-detail', (e) => {
      if (e.detail.markerData) this.markerData = e.detail.markerData;
      this.viewMode = 'SR';
      this.selectedId = e.detail.id;
      
      this.expandSidebar();
      this.render();
    });

    window.addEventListener('show-crs-detail', (e) => {
      if (e.detail.markerData) this.markerData = e.detail.markerData;
      this.viewMode = 'CRS';
      this.selectedId = e.detail.id;
      this.targetSrId = e.detail.parentSrId;
      
      this.expandSidebar();
      this.render();
    });

    window.addEventListener('show-cr-detail', (e) => {
      if (e.detail.markerData) this.markerData = e.detail.markerData;
      this.viewMode = 'CR';
      
      this.expandSidebar();
      this.render();
    });

    window.addEventListener('sync-sidebar-context', (e) => {
      if (e.detail.markerData) {
        this.markerData = e.detail.markerData;
        this.render();
      }
    });

    window.addEventListener('show-sidebar-detail', (e) => {
      if (e.detail.type === 'CR') {
        if (e.detail.markerData) this.markerData = e.detail.markerData;
        this.viewMode = 'CR';
        this.expandSidebar();
        this.render();
      }
    });
  }

  expandSidebar() {
    if (window.app) {
      window.app.toggleRightPanel(true);
    } else if (this.container.closest('.external-view')) {
      const entryView = this.container.closest('#marker-entry-view');
      if (entryView) entryView.classList.remove('right-collapsed');
    }
  }

  render() {
    this.renderMarkerView();

    const handle = this.container.querySelector('#btn-right-sidebar-toggle');
    if (handle) {
      const isLevel2 = window.app && window.app.viewLevel === 2;
      handle.style.display = isLevel2 ? 'flex' : 'none';
      if (!isLevel2 && window.app) window.app.toggleRightPanel(false);
    }
  }

  renderMarkerView() {
    const data = this.markerData || {
      id: 'N/A',
      title: '未选中记录',
      typeLabels: ['未知'],
      srRecords: [],
      crRecords: []
    };

    let boardContent = '';
    let headerLabel = '单据详情';
    let headerId = data.id;

    switch (this.viewMode) {
      case 'DAMAGE':
        headerLabel = '损伤记录详情';
        boardContent = this.renderTechnicalDetailBoard(data);
        break;
      
      case 'SR':
        headerLabel = 'SR 维修申请';
        const sr = data.srRecords.find(s => s.id === this.selectedId) || (data.srRecords[0]);
        headerId = sr?.id || 'N/A';
        boardContent = this.renderSrBoard(sr, data);
        break;

      case 'CRS':
        headerLabel = 'CRS 修理方案';
        const parentSr = data.srRecords.find(s => s.id === this.targetSrId) || (data.srRecords && data.srRecords[0]);
        const crs = parentSr?.crsRecords?.find(c => c.id === this.selectedId) || (parentSr?.crsRecords && parentSr?.crsRecords[0]);
        headerId = crs?.id || 'N/A';
        boardContent = this.renderCrsBoard(crs, parentSr);
        break;

      case 'CR':
        headerLabel = 'CR 让步评估';
        headerId = '综合结论';
        boardContent = this.renderCrBoard(data);
        break;
    }

    this.container.innerHTML = `
      <div class="sidebar-container">
        <div class="sidebar-header">
          <div class="header-left">
            <button class="btn-close-right">×</button>
            <strong class="header-title"><span class="header-type-tag">[${headerLabel}]</span> ${headerId}</strong>
          </div>
          <div class="header-actions">
            <span class="case-tag clickable" onclick="window.dispatchEvent(new CustomEvent('initiate-technical-request'))">CASE系统</span>
          </div>
        </div>
        
        <div class="details-content">
          ${(this.viewMode !== 'DAMAGE' && this.viewMode !== 'CR') ? `
            <div class="back-nav-area">
              <button class="btn-back-to-damage">
                <span class="arrow">←</span> 损伤记录详情
              </button>
            </div>
          ` : ''}
          ${boardContent}
        </div>

        <button class="btn-toggle-handle" id="btn-right-sidebar-toggle">
          <span class="handle-icon">▶</span>
        </button>
      </div>
    `;

    this.attachInternalEvents();
  }

  attachInternalEvents() {
    const closeBtn = this.container.querySelector('.btn-close-right');
    if (closeBtn) closeBtn.addEventListener('click', () => window.app && window.app.toggleRightPanel(false));

    const toggleBtn = this.container.querySelector('#btn-right-sidebar-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', (e) => { e.stopPropagation(); window.app && window.app.toggleRightPanel(); });

    const backBtn = this.container.querySelector('.btn-back-to-damage');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.viewMode = 'DAMAGE';
        this.selectedId = null;
        
        // Notify MarkerPopup to clear its selection state
        window.dispatchEvent(new CustomEvent('clear-marker-popup-selection'));
        
        this.render();
      });
    }
  }

  renderSrBoard(sr, markerData) {
    if (!sr) return `<div class="problem-box sm italic">未找到关联 SR</div>`;
    return `
      <div class="board-wrapper fadeIn">
        <section class="info-section">
          <h4 class="section-title">SR 基础信息</h4>
          <div class="info-grid">
            <div class="info-row"><span class="label">SR 编号:</span><span class="value highlight">${sr.id}</span></div>
            <div class="info-row"><span class="label">当前优先级:</span><span class="value status-red">Critical</span></div>
            <div class="info-row"><span class="label">报告日期:</span><span class="value">${sr.date}</span></div>
          </div>
        </section>
        
        <section class="info-section">
          <h4 class="section-title">问题描述</h4>
          <div class="problem-box">
            <div class="box-title">${sr.title}</div>
            <div class="box-text" style="margin-top:10px;">
              针对在 ${markerData.ataLabel || '指定位置'} 发现的损伤，现场维护人员已提交初始报告。
              请工程部门结合 3D 模型确认损伤几何参数并出具修理方案。
            </div>
          </div>
        </section>
      </div>
    `;
  }

  renderCrsBoard(crs, sr) {
    if (!crs) return `<div class="problem-box sm italic">未找到关联 CRS</div>`;
    return `
      <div class="board-wrapper fadeIn">
        <section class="info-section">
          <h4 class="section-title">CRS 方案详情</h4>
          <div class="info-grid">
            <div class="info-row"><span class="label">CRS 编号:</span><span class="value highlight">${crs.id}</span></div>
            <div class="info-row"><span class="label">审批状态:</span><span class="value status-green">${crs.status}</span></div>
            <div class="info-row"><span class="label">版本:</span><span class="value">${crs.version || 'Rev. A'}</span></div>
          </div>
        </section>

        <section class="info-section">
          <h4 class="section-title">工程评估</h4>
          <div class="problem-box">
             <div class="box-title">${crs.title}</div>
             <div class="box-text" style="margin-top:10px;">
               ${crs.damageType ? `损伤分类已被核实为: <b>${crs.damageType}</b><br><br>` : ''}
               修理措施涉及在受影响区域加装补丁块或进行打磨处理。具体操作步骤已载入 PDF 手册并关联至本系统。
             </div>
          </div>
        </section>

        <section class="info-section">
          <h4 class="section-title">关联文档</h4>
          <div class="file-card">
            <div class="file-icon">📄</div>
            <div class="file-info">
              <span class="file-name">Repair_Scheme_${crs.id}.pdf</span>
              <span class="file-meta">5.4 MB | 工程发布版</span>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  renderCrBoard(data) {
    if (!data.crRecords || data.crRecords.length === 0) return `<div class="problem-box sm italic">暂无 CR 让步评估信息</div>`;
    return `
      <div class="board-wrapper fadeIn">
        <div style="background: rgba(22, 163, 74, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(22, 163, 74, 0.1);">
          <div style="font-size: 11px; color: #16a34a; font-weight: 600;">[共享资源] 该零部件关联的纠正性评估结论</div>
        </div>
        ${data.crRecords.map(cr => `
          <section class="info-section">
            <div class="info-grid">
              <div class="info-row"><span class="label">CR 编号:</span><span class="value highlight">${cr.id}</span></div>
              <div class="info-row"><span class="label">状态:</span><span class="value status-green">${cr.status}</span></div>
              <div class="info-row"><span class="label">结论:</span><span class="value semi-bold">${cr.title}</span></div>
            </div>
            <div class="problem-box sm" style="margin-top:10px;">${cr.customerImpact}</div>
          </section>
        `).join('')}
      </div>
    `;
  }

  renderTechnicalDetailBoard(data) {
    if (!data || data.id === 'N/A') {
      return `
        <div class="tech-detail-board empty">
          <div class="empty-msg">请选择一条损伤记录以查看详细技术参数</div>
        </div>
      `;
    }

    const tech = data.techDetail || {};
    const damageType = data.typeLabels ? data.typeLabels[0] : '--';

    const fields = [
      { label: 'ATA', value: tech.ata || data.ataCode || '--' },
      { label: '件号', value: tech.partNo || '--', highlight: true },
      { label: '飞机型号', value: tech.aircraftModel || data.aircraftType || '--' },
      { label: '飞机注册号', value: tech.registration || data.registration || '--' },
      { label: '序列号MSN', value: tech.msn || data.msn || '--' },
      { label: 'FH', value: tech.fh || '--' },
      { label: 'FC', value: tech.fc || '--' },
      { label: '主要结构', value: tech.isMainStruct || '--' },
      { label: '关键结构', value: tech.isKeyStruct || '--' },
      { label: '构件材料', value: tech.material || '--' },
      { label: '损伤类型', value: damageType, status: true },
      { label: '损伤报告日期', value: tech.reportDate || data.date || '--' }
    ];

    return `
      <section class="tech-detail-board fadeIn">
        <div class="board-header">
          <div class="board-title">损伤记录详细信息</div>
          <div class="board-badge">LIVE DATA</div>
        </div>
        <div class="tech-grid">
          ${fields.map(f => `
            <div class="tech-item">
              <div class="tech-label">${f.label}</div>
              <div class="tech-value ${f.highlight ? 'highlight' : ''} ${f.label === '损伤类型' ? 'type-badge' : ''}">${f.value}</div>
            </div>
          `).join('')}
          <div class="tech-item full-width">
            <div class="tech-label">损伤简述</div>
            <div class="tech-value desc-text">${tech.damageDesc || '暂无详细描述'}</div>
          </div>
        </div>
      </section>
    `;
  }

  addStyles() {
    const styleId = 'detail-sidebar-styles';
    if (document.getElementById(styleId)) {
      document.getElementById(styleId).remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .right-panel-region .sidebar-container {
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background: rgba(255, 255, 255, 0.75);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.4);
        padding: 0;
        transition: background 0.4s, border 0.4s, box-shadow 0.4s;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }

      .right-panel-region .sidebar-container > *:not(.btn-toggle-handle) {
        transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                    visibility 0.4s;
        transform: translateX(0);
      }

      .right-collapsed .right-panel-region .sidebar-container > *:not(.btn-toggle-handle) {
        opacity: 0;
        pointer-events: none;
        visibility: hidden;
        transform: translateX(20px);
      }

      .right-collapsed .right-panel-region .sidebar-container {
        background: transparent;
        border: none;
        box-shadow: none;
        backdrop-filter: none;
      }

      .right-panel-region .btn-toggle-handle {
        position: absolute;
        left: -20px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 80px;
        background: white;
        border: 1px solid #e2e8f0;
        border-right: none;
        box-shadow: -6px 0 15px rgba(0,0,0,0.08);
        border-radius: 12px 0 0 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        z-index: 2000;
        transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
        pointer-events: auto !important;
      }

      .right-panel-region .btn-toggle-handle:hover {
        width: 28px;
        left: -28px;
        background: #0052d9;
        border-color: #0052d9;
        box-shadow: -8px 0 20px rgba(0, 82, 217, 0.3);
      }

      .right-panel-region .handle-icon {
        font-size: 10px;
        color: #94a3b8;
        transform: scaleY(1.2);
        transition: all 0.2s;
      }

      .right-panel-region .btn-toggle-handle:hover .handle-icon {
        color: white;
      }

      .right-collapsed .right-panel-region .btn-toggle-handle .handle-icon {
        transform: scaleY(1.2) rotate(180deg);
        color: #0052d9;
      }

      .sidebar-header {
        padding: 16px;
        border-bottom: 1px solid rgba(0,0,0,0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(240, 242, 245, 0.4);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .btn-close-right {
        background: none;
        border: none;
        cursor: pointer;
        color: #64748b;
        font-size: 20px;
        padding: 0 4px;
        line-height: 1;
        transition: color 0.2s;
      }

      .btn-close-right:hover {
        color: #0052d9;
      }

      .header-title {
        font-size: 14px;
        color: #1e293b;
        font-weight: 600;
        letter-spacing: 0.2px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .header-type-tag {
        font-size: 11px;
        color: #0052d9;
        font-weight: 800;
        background: rgba(0, 82, 217, 0.05);
        padding: 2px 6px;
        border-radius: 4px;
      }
      
      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn-back-to-damage {
        background: transparent;
        border: none;
        color: #64748b;
        padding: 4px 0;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .btn-back-to-damage:hover {
        color: #0052d9;
        transform: translateX(-2px);
      }

      .btn-back-to-damage .arrow {
        font-size: 13px;
        line-height: 1;
      }

      .back-nav-area {
        padding-bottom: 12px;
        border-bottom: 1px dashed rgba(0,0,0,0.05);
        margin-bottom: 4px;
      }

      .case-tag {
        background: #e6f0ff;
        color: #0052d9;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .case-tag.clickable {
        cursor: pointer;
      }

      .case-tag.clickable:hover {
        background: #0052d9;
        color: white;
        box-shadow: 0 2px 8px rgba(0, 82, 217, 0.2);
      }

      .details-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .board-wrapper {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .fadeIn {
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .info-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .section-title {
        margin: 0;
        font-size: 13px;
        color: #1e293b;
        font-weight: 600;
        border-left: 3px solid #0052d9;
        padding-left: 10px;
        letter-spacing: 0.3px;
      }

      .info-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .info-row {
        display: flex;
        align-items: center;
        font-size: 12px;
        line-height: 1.4;
      }

      .label {
        color: #64748b;
        width: 100px;
        flex-shrink: 0;
      }
      
      .value {
        color: #1e293b;
        word-break: break-all;
      }

      .value.highlight {
        color: #0052d9;
        font-weight: 600;
      }

      .status-red { color: #ef4444; }
      .status-green { color: #16a34a; }

      .problem-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 12px;
        border-radius: 8px;
        line-height: 1.6;
        color: #1e293b;
        font-size: 12.5px;
      }

      .problem-box.sm { font-size: 11.5px; }

      .box-title {
        font-size: 13px;
        font-weight: 700;
        color: #1e293b;
      }

      .box-text {
        font-size: 12px;
        color: #475569;
      }

      .file-card {
        display: flex;
        align-items: center;
        gap: 14px;
        background: #f0f7ff;
        padding: 14px;
        border-radius: 10px;
        border: 1px dashed #bfdbfe;
        cursor: pointer;
      }

      .tech-detail-board {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      }

      .board-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f1f5f9;
      }

      .board-title {
        font-size: 12px;
        font-weight: 700;
        color: #1e293b;
        text-transform: uppercase;
      }

      .board-badge {
        font-size: 9px;
        background: #f0f9ff;
        color: #0369a1;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 800;
        border: 1px solid #e0f2fe;
      }

      .tech-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px 16px;
      }

      .tech-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .tech-item.full-width {
        grid-column: span 2;
        border-top: 1px dashed #f1f5f9;
        padding-top: 8px;
        margin-top: 4px;
      }

      .tech-label {
        font-size: 11px;
        color: #64748b;
      }

      .tech-value {
        font-size: 12.5px;
        color: #1e293b;
        font-weight: 600;
      }

      .tech-value.highlight {
        color: #0052d9;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }

      .tech-value.type-badge { color: #ef4444; }
      .desc-text { color: #475569; font-size: 12px; line-height: 1.5; }
    `;
    document.head.appendChild(style);
  }
}
