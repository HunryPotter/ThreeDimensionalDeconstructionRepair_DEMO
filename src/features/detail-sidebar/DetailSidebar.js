export class DetailSidebar {
  constructor(container) {
    this.container = container;
    this.markerData = null;
    this.selectedSrId = null;
    this.activeInnerTab = 'SR';
    this.addStyles(); // Inject styles once during initialization
    this.render();
    this.initEvents();
  }

  initEvents() {
    window.addEventListener('damage-marker-select', (e) => {
      this.markerData = e.detail;
      // Default to the first SR in the list when marker changes
      if (this.markerData && this.markerData.srRecords && this.markerData.srRecords.length > 0) {
        this.selectedSrId = this.markerData.srRecords[0].id;
        this.activeInnerTab = 'SR';
      } else {
        this.selectedSrId = null;
      }
      this.render();
    });
  }

  render() {
    this.renderMarkerView();

    // Condition: Only show toggle handle if app is in Level 2
    const handle = this.container.querySelector('#btn-right-sidebar-toggle');
    if (handle) {
      const isLevel2 = window.app && window.app.viewLevel === 2;
      handle.style.display = isLevel2 ? 'flex' : 'none';
      if (!isLevel2) {
        // Ensure panel is collapsed visually if we're in Level 1
        if (window.app) window.app.toggleRightPanel(false);
      }
    }

    const closeBtn = this.container.querySelector('.btn-close-right');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (window.app) window.app.toggleRightPanel(false);
      });
    }
  }

  renderMarkerView() {
    const data = this.markerData || {
      id: 'N/A',
      title: '未选中记录',
      typeLabels: ['未知'],
      aircraftType: '--',
      airline: '--',
      srRecords: [],
      crRecords: []
    };

    // Find currently selected SR
    const selectedSr = data.srRecords.find(sr => sr.id === this.selectedSrId) || (data.srRecords.length > 0 ? data.srRecords[0] : null);
    
    // Tab availability rules:
    // 1. SR tab: Always available if SRs exist
    // 2. CRS tab: Only if selected SR has at least 1 CRS
    // 3. CR tab: Only if selected SR has at least 1 CRS (as per business feedback)
    const hasSr = !!selectedSr;
    const hasCrs = hasSr && selectedSr.crsRecords && selectedSr.crsRecords.length > 0;
    const hasCr = hasCrs && data.crRecords && data.crRecords.length > 0; // Shared CR data but gated by CRS presence

    // Validate active tab and force back to SR if current tab becomes invalid
    if (this.activeInnerTab === 'CRS' && !hasCrs) this.activeInnerTab = 'SR';
    if (this.activeInnerTab === 'CR' && !hasCr) this.activeInnerTab = 'SR';

    const damageTypeBadge = data.typeLabels ? data.typeLabels.join(' & ') : '未知损伤';

    // Tabs HTML
    const tabsHtml = `
      <div class="inner-tabs">
        <div class="inner-tab ${this.activeInnerTab === 'SR' ? 'active' : ''} ${!hasSr ? 'disabled' : ''}" data-tab="SR">SR</div>
        <div class="inner-tab ${this.activeInnerTab === 'CRS' ? 'active' : ''} ${!hasCrs ? 'disabled' : ''}" data-tab="CRS">CRS</div>
        <div class="inner-tab ${this.activeInnerTab === 'CR' ? 'active' : ''} ${!hasCr ? 'disabled' : ''}" data-tab="CR">CR</div>
      </div>
    `;

    let contentHtml = '';

    if (this.activeInnerTab === 'SR' && hasSr) {
      const srSelector = data.srRecords.length > 1 ? `
        <div class="sr-selector-box">
          <label>查看关联单据</label>
          <select id="sr-select-dropdown" class="tech-select">
            ${data.srRecords.map(sr => `<option value="${sr.id}" ${sr.id === this.selectedSrId ? 'selected' : ''}>${sr.id} (${sr.manualStatus === 'published' ? '已发布' : '处理中'})</option>`).join('')}
          </select>
        </div>
      ` : '';

      contentHtml = `
        <div class="tab-pane active" id="pane-sr">
          ${srSelector}
          <section class="info-section">
            <h4 class="section-title">SR 基础信息</h4>
            <div class="info-grid">
              <div class="info-row"><span class="label">SR 编号:</span><span class="value highlight">${selectedSr.id}</span></div>
              <div class="info-row"><span class="label">发布状态:</span><span class="value">${selectedSr.manualStatus === 'published' ? '已发布' : (selectedSr.manualStatus === 'unpublished' ? '未发布' : '无')}</span></div>
              <div class="info-row"><span class="label">机型:</span><span class="value">C919 (${data.aircraftType})</span></div>
              <div class="info-row"><span class="label">优先级:</span><span class="value status-red">Critical</span></div>
              <div class="info-row"><span class="label">客户:</span><span class="value">${data.airline}</span></div>
            </div>
          </section>
          
          <section class="info-section" style="margin-top: 24px;">
            <h4 class="section-title">问题信息</h4>
            <div class="problem-box">
              <div class="box-label">问题标题</div>
              <div class="box-title">${selectedSr.title}</div>
              <div class="box-label" style="margin-top: 12px;">问题详情</div>
              <div class="box-text">
                根据现场维护报告，在 ${data.ataLabel} 捕获到损伤。日期: ${selectedSr.date}。<br><br>
                请工程部门根据三维模型定位确认该损伤编号下的具体损伤参数，并评估其对气动外形及结构完整性的影响。
              </div>
            </div>
          </section>
        </div>
      `;
    } else if (this.activeInnerTab === 'CRS' && hasCrs) {
      contentHtml = `
        <div class="tab-pane active" id="pane-crs">
          ${selectedSr.crsRecords.map(crs => `
            <!-- CRS Basic Info -->
            <section class="info-section" style="margin-bottom: 24px;">
              <h4 class="section-title">CRS基本信息</h4>
              <div class="info-grid">
                <div class="info-row"><span class="label">CRS编号:</span><span class="value highlight">${crs.id}</span></div>
                <div class="info-row"><span class="label">状态:</span><span class="value status-green" style="font-weight: 600;">${crs.status}</span></div>
                <div class="info-row"><span class="label">版本:</span><span class="value">${crs.version || 'A'}</span></div>
                <div class="info-block">
                  <span class="label">CRS名称:</span>
                  <span class="value semi-bold multiline">${crs.title}</span>
                </div>
                <div class="info-row"><span class="label">关联SR:</span><span class="value highlight sm">${selectedSr.id}</span></div>
                <div class="info-row"><span class="label">ATA:</span><span class="value">${data.ataCode || '--'}</span></div>
              </div>
            </section>
            
            <!-- Damage Component Info -->
            <section class="info-section">
              <h4 class="section-title">损伤详情</h4>
              <div class="info-grid">
                <div class="info-row"><span class="label">SRM号:</span><span class="value">${crs.srmId || '--'}</span></div>
                <div class="info-row"><span class="label">损伤分类:</span><span class="value status-red bold">${crs.damageType || damageTypeBadge}</span></div>
                <div class="info-block" style="margin-top: 8px;">
                  <span class="label">关联零组件:</span>
                  <div class="part-list">
                    ${(crs.partNos || []).map(p => `
                      <div class="part-item">
                        <span class="part-no">${p}</span>
                        <button class="btn-outline-view">查看3D定位</button>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            </section>
          `).join('')}
        </div>
      `;
    } else if (this.activeInnerTab === 'CR' && hasCr) {
      contentHtml = `
        <div class="tab-pane active" id="pane-cr">
          <div style="background: rgba(22, 163, 74, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(22, 163, 74, 0.1);">
            <div style="font-size: 11px; color: #16a34a; font-weight: 600;">[共享资源] 该零部件关联的纠正性评估结论</div>
          </div>
          ${data.crRecords.map(cr => `
            <section class="info-section" style="margin-bottom: 24px;">
              <div class="info-grid">
                 <div class="info-row"><span class="label">CR 编号:</span><span class="value highlight">${cr.id}</span></div>
                 <div class="info-row"><span class="label">状态:</span><span class="value status-green" style="font-weight: 600;">${cr.status || '处理中'}</span></div>
                 <div class="info-row"><span class="label">评估结论:</span><span class="value semi-bold">${cr.title}</span></div>
              </div>
              <div class="problem-box sm" style="margin-top: 10px;">
                ${cr.customerImpact || '暂无描述信息'}
              </div>
            </section>
          `).join('')}
        </div>
      `;
    } else {
      contentHtml = '<div class="problem-box sm"><div class="box-text muted italic">暂无关联的单据信息 (或当前流程未进入评估阶段)</div></div>';
    }

    this.container.innerHTML = `
      <div class="sidebar-container">
        <div class="sidebar-header">
          <div class="header-left">
            <button class="btn-close-right">×</button>
            <strong class="header-title">${data.id && data.id !== 'N/A' ? data.id : '单据详细视图'}</strong>
          </div>
          <span class="case-tag clickable" onclick="window.dispatchEvent(new CustomEvent('initiate-technical-request'))" title="在流程系统中查看完整关联信息">CASE系统</span>
        </div>
        
        <div class="details-content" style="padding: 16px;">
          <!-- Damage Summary Info (Content Layer) -->
          <div class="damage-summary" style="margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px dashed rgba(0,0,0,0.08);">
            <div style="font-size: 11px; color: var(--text-color-secondary); margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
              <span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 6px; border-radius: 4px; font-weight: 600;">损伤类型：${damageTypeBadge}</span>
            </div>
            <div style="font-size: 13px; color: var(--text-color-main); font-weight: 600; line-height: 1.4;">${data.title || '无标题记录'}</div>
          </div>
          
          ${tabsHtml}

          <div class="tab-content" style="margin-top: 16px;">
            ${contentHtml}
          </div>
        </div>

        <!-- Panel Toggle Bookmark (Left Edge, Middle) -->
        <button class="btn-toggle-handle" id="btn-right-sidebar-toggle" title="隐藏/显示面板">
          <span class="handle-icon">▶</span>
        </button>
      </div>
    `;

    // Local event bindings for tabs
    const tabEls = this.container.querySelectorAll('.inner-tab:not(.disabled)');
    tabEls.forEach(el => {
      el.addEventListener('click', () => {
        this.activeInnerTab = el.dataset.tab;
        this.renderMarkerView();
      });
    });

    const srDropdown = this.container.querySelector('#sr-select-dropdown');
    if (srDropdown) {
      srDropdown.addEventListener('change', (e) => {
        this.selectedSrId = e.target.value;
        this.renderMarkerView();
      });
    }

    const closeBtn = this.container.querySelector('.btn-close-right');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (window.app) window.app.toggleRightPanel(false);
      });
    }

    const toggleHandle = this.container.querySelector('#btn-right-sidebar-toggle');
    if (toggleHandle) {
      toggleHandle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.app) window.app.toggleRightPanel(); // Toggle current state
      });
    }
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

      /* 核心修复：收起时平滑隐藏内部内容，并增加位移以同步面板回缩 */
      .right-panel-region .sidebar-container > *:not(.btn-toggle-handle) {
        transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                    visibility 0.4s;
        transform: translateX(0);
      }

      #app-container.right-collapsed .right-panel-region .sidebar-container > *:not(.btn-toggle-handle) {
        opacity: 0;
        pointer-events: none;
        visibility: hidden;
        transform: translateX(20px);
      }

      #app-container.right-collapsed .right-panel-region .sidebar-container {
        background: transparent;
        border: none;
        box-shadow: none;
        backdrop-filter: none;
      }

      /* 右侧手柄定位隔离 */
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
        background: var(--primary-blue);
        border-color: var(--primary-blue);
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

      #app-container.right-collapsed .right-panel-region .btn-toggle-handle .handle-icon {
        transform: scaleY(1.2) rotate(180deg);
        color: var(--primary-blue);
      }

      /* Original Inner Styles ... */
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
        color: var(--text-color-secondary);
        font-size: 20px;
        padding: 0 4px;
        line-height: 1;
        transition: color 0.2s;
      }

      .btn-close-right:hover {
        color: var(--primary-blue);
      }

      .header-title {
        font-size: 14px;
        color: var(--text-color-main);
        font-weight: 600;
        letter-spacing: 0.2px;
      }
      
      .case-tag {
        background: #e6f0ff;
        color: var(--primary-blue);
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
        background: var(--primary-blue);
        color: white;
        box-shadow: 0 2px 8px rgba(0, 82, 217, 0.2);
      }

      .tag-green {
        background: #f0fdf4;
        color: #16a34a;
      }
      
      .details-content {
        flex: 1;
        overflow-y: auto;
        padding: 18px 16px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      
      .info-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .section-title {
        margin: 0;
        font-size: 13px;
        color: var(--text-color-main);
        font-weight: 600;
        border-left: 3px solid var(--primary-blue);
        padding-left: 10px;
        letter-spacing: 0.3px;
      }
      
      .inner-tabs {
        display: flex;
        background: rgba(0, 0, 0, 0.04);
        border-radius: 6px;
        padding: 4px;
        margin-bottom: 8px;
        border: 1px solid rgba(0, 0, 0, 0.05);
      }
      
      .inner-tab {
        flex: 1;
        text-align: center;
        padding: 6px 0;
        font-size: 11px;
        font-weight: 600;
        color: var(--text-color-secondary);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        user-select: none;
      }
      
      .inner-tab:hover:not(.disabled):not(.active) {
        background: rgba(255, 255, 255, 0.5);
      }
      
      .inner-tab.active {
        background: #ffffff;
        color: var(--primary-blue);
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      
      .inner-tab.disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      
      .status-green {
        color: #16a34a;
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

      .info-block {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 12px;
      }

      .info-flex {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
      }

      .divider {
        border-bottom: 1px solid var(--border-color-light);
        padding-bottom: 12px;
        margin-bottom: 4px;
      }
      
      .label {
        color: var(--text-color-secondary);
        width: 100px;
        flex-shrink: 0;
        font-weight: 400;
      }

      .label.auto {
        width: auto;
        margin-right: 8px;
      }
      
      .value {
        color: var(--text-color-main);
        word-break: break-word;
      }

      .value.highlight {
        color: var(--primary-blue);
        font-weight: 600;
      }

      .value.muted {
        color: var(--text-color-secondary);
      }

      .value.sm {
        font-size: 11px;
      }

      .value.bold {
        font-weight: 600;
      }

      .value.semi-bold {
        font-weight: 500;
      }

      .value.multiline {
        line-height: 1.6;
      }
      
      .status-red {
        color: #ef4444;
      }
      
      .problem-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 12px;
        border-radius: 8px;
        line-height: 1.6;
        color: var(--text-color-main);
      }

      .problem-box.sm {
        font-size: 11.5px;
      }

      .box-label {
        font-size: 11px;
        color: var(--text-color-secondary);
        margin-bottom: 6px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .box-title {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--text-color-main);
      }

      .box-text {
        font-size: 12px;
        color: var(--text-color-secondary);
      }

      .box-text.italic {
        font-style: italic;
        opacity: 0.8;
      }

      .muted {
        color: var(--text-color-muted);
      }

      .part-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .part-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(0, 0, 0, 0.03);
        padding: 6px 10px;
        border-radius: 6px;
        transition: background 0.2s;
      }

      .part-item:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      .part-no {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 11px;
        color: var(--text-color-main);
        font-weight: 500;
      }

      .btn-outline-view {
        font-size: 10px;
        padding: 3px 10px;
        border: 1px solid var(--primary-blue);
        color: var(--primary-blue);
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .btn-outline-view:hover {
        background: var(--primary-blue);
        color: white;
      }

      .file-card {
        display: flex;
        align-items: center;
        gap: 14px;
        background: #f0f7ff;
        padding: 14px;
        border-radius: 10px;
        border: 1px dashed #bfdbfe;
        transition: transform 0.2s, background 0.2s;
        cursor: pointer;
      }

      .file-card:hover {
        background: #e6f0ff;
        transform: translateY(-1px);
      }

      .file-icon {
        font-size: 24px;
      }

      .file-info {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .file-name {
        font-size: 12.5px;
        color: var(--primary-blue);
        font-weight: 600;
        text-decoration: underline;
      }

      .file-meta {
        font-size: 11px;
        color: var(--text-color-muted);
      }

      /* SR Selector Styles */
      .sr-selector-box {
        background: rgba(0, 82, 217, 0.05);
        border: 1px solid rgba(0, 82, 217, 0.1);
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .sr-selector-box label {
        font-size: 11px;
        color: var(--text-color-secondary);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .tech-select {
        width: 100%;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 12px;
        color: var(--text-color-main);
        font-weight: 500;
        outline: none;
        cursor: pointer;
        transition: border-color 0.2s;
      }

      .tech-select:focus {
        border-color: var(--primary-blue);
        box-shadow: 0 0 0 2px rgba(0, 82, 217, 0.1);
      }
    `;
    document.head.appendChild(style);
  }
}
