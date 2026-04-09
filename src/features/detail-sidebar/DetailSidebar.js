export class DetailSidebar {
  constructor(container) {
    this.container = container;
    this.srData = null;
    this.crsData = null;
    this.activeInnerTab = 'SR';
    this.addStyles(); // Inject styles once during initialization
    this.render();
    this.initEvents();
  }

  initEvents() {
    window.addEventListener('damage-marker-select', (e) => {
      this.markerData = e.detail;
      this.render();
    });
  }

  render() {
    this.renderMarkerView();

    const closeBtn = this.container.querySelector('.btn-close-right');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (window.app) window.app.toggleRightPanel(false);
      });
    }
  }

  renderMarkerView() {
    const data = this.markerData || {
      title: '未选中记录',
      typeLabels: ['未知'],
      aircraftType: '--',
      airline: '--',
      srRecord: null,
      crsRecords: [],
      crRecords: []
    };

    const hasSr = !!data.srRecord;
    const hasCrs = data.crsRecords && data.crsRecords.length > 0;
    const hasCr = data.crRecords && data.crRecords.length > 0;

    // Validate active tab
    if (this.activeInnerTab === 'SR' && !hasSr) {
      this.activeInnerTab = hasCrs ? 'CRS' : (hasCr ? 'CR' : 'SR');
    }
    if (this.activeInnerTab === 'CRS' && !hasCrs) {
      this.activeInnerTab = hasSr ? 'SR' : (hasCr ? 'CR' : 'CRS');
    }
    if (this.activeInnerTab === 'CR' && !hasCr) {
      this.activeInnerTab = hasSr ? 'SR' : (hasCrs ? 'CRS' : 'CR');
    }

    const damageTypeBadge = data.typeLabels ? data.typeLabels.join(' & ') : '未知损伤';

    // Tabs HTML
    const tabsHtml = `
      <div class="inner-tabs">
        <div class="inner-tab ${this.activeInnerTab === 'SR' ? 'active' : ''} ${!hasSr ? 'disabled' : ''}" data-tab="SR">SR请求</div>
        <div class="inner-tab ${this.activeInnerTab === 'CRS' ? 'active' : ''} ${!hasCrs ? 'disabled' : ''}" data-tab="CRS">CRS方案</div>
        <div class="inner-tab ${this.activeInnerTab === 'CR' ? 'active' : ''} ${!hasCr ? 'disabled' : ''}" data-tab="CR">CR评估</div>
      </div>
    `;

    let contentHtml = '';

    if (this.activeInnerTab === 'SR' && hasSr) {
      const sr = data.srRecord;
      contentHtml = `
        <div class="tab-pane active" id="pane-sr">
          <section class="info-section">
            <h4 class="section-title">SR 基础信息</h4>
            <div class="info-grid">
              <div class="info-row"><span class="label">SR 编号:</span><span class="value highlight">${sr.id}</span></div>
              <div class="info-row"><span class="label">发布状态:</span><span class="value">${sr.manualStatus === 'published' ? '已发布' : (sr.manualStatus === 'unpublished' ? '未发布' : '无')}</span></div>
              <div class="info-row"><span class="label">机型:</span><span class="value">C919 (${data.aircraftType})</span></div>
              <div class="info-row"><span class="label">优先级:</span><span class="value status-red">Critical</span></div>
              <div class="info-row"><span class="label">客户:</span><span class="value">${data.airline}</span></div>
            </div>
          </section>
          
          <section class="info-section" style="margin-top: 24px;">
            <h4 class="section-title">问题信息</h4>
            <div class="problem-box">
              <div class="box-label">问题标题</div>
              <div class="box-title">${sr.title}</div>
              <div class="box-label" style="margin-top: 12px;">问题详情</div>
              <div class="box-text">
                根据现场维护报告，在 ${data.ataLabel} 捕获到损伤。日期: ${sr.date}。<br><br>
                请工程部门根据三维模型定位确认该损伤编号下的具体损伤参数，并评估其对气动外形及结构完整性的影响。
              </div>
            </div>
          </section>

          <section class="info-section" style="margin-top: 24px;">
            <h4 class="section-title">时间信息</h4>
            <div class="problem-box sm">
              <div class="box-text muted italic">暂无时间跟踪数据</div>
            </div>
          </section>

          <section class="info-section" style="margin-top: 24px;">
             <h4 class="section-title">飞机信息</h4>
             <div class="problem-box sm">
               <div class="box-text muted italic">暂无详细飞机规格数据</div>
             </div>
          </section>
        </div>
      `;
    } else if (this.activeInnerTab === 'CRS' && hasCrs) {
      contentHtml = `
        <div class="tab-pane active" id="pane-crs">
          ${data.crsRecords.map(crs => `
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
                <div class="info-block divider">
                  <span class="label">说明:</span>
                  <span class="value muted sm">${crs.description || '无'}</span>
                </div>
                <div class="info-row"><span class="label">SR编号:</span><span class="value highlight muted sm">${data.srRecord ? data.srRecord.id : '--'}</span></div>
                <div class="info-row"><span class="label">ATA:</span><span class="value">${data.ataCode || '--'}</span></div>
                <div class="info-row"><span class="label">架次号:</span><span class="value">${crs.sortieNo || '--'}</span></div>
                <div class="info-block">
                  <span class="label">适航性能评估:</span>
                  <span class="value highlight sm">${crs.assessmentReport || '--'}</span>
                </div>
              </div>
            </section>
            
            <!-- Damage Component Info -->
            <section class="info-section" style="margin-bottom: 24px;">
              <h4 class="section-title">损伤构件</h4>
              <div class="info-grid">
                <div class="info-row"><span class="label">构建类型:</span><span class="value">${crs.compType || '--'}</span></div>
                <div class="info-row"><span class="label">SRM/CMM号:</span><span class="value">${crs.srmId || '--'}</span></div>
                <div class="info-flex">
                  <div class="info-row"><span class="label auto">主要结构:</span><span class="value">${crs.isMainStruct || '否'}</span></div>
                  <div class="info-row"><span class="label auto">关键结构:</span><span class="value">${crs.isKeyStruct || '否'}</span></div>
                </div>
                <div class="info-row"><span class="label">损伤构件材料:</span><span class="value">${crs.compMaterial || '--'}</span></div>
                <div class="info-row"><span class="label">损伤类型:</span><span class="value status-red bold">${crs.damageType || (data.typeLabels ? data.typeLabels.join(',') : '--')}</span></div>
                
                <div class="info-block" style="margin-top: 4px;">
                  <span class="label">损伤简述:</span>
                  <div class="problem-box sm">${crs.damageDesc || '暂无描述'}</div>
                </div>

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

            <!-- CRS Source File -->
            <section class="info-section">
              <h4 class="section-title">CRS源文件</h4>
              <div class="file-card">
                <span class="file-icon">📄</span>
                <div class="file-info">
                  <span class="file-name">${crs.sourceFile || 'CRS_Report.pdf'}</span>
                  <span class="file-meta">1.2MB | PDF Document</span>
                </div>
              </div>
            </section>
            ${data.crsRecords.length > 1 ? '<div style="height: 1px; background: #e2e8f0; margin: 24px 0;"></div>' : ''}
          `).join('')}
        </div>
      `;
    } else if (this.activeInnerTab === 'CR' && hasCr) {
      contentHtml = `
        <div class="tab-pane active" id="pane-cr">
          ${data.crRecords.map(cr => `
            <section class="info-section" style="margin-bottom: 24px;">
              <h4 class="section-title">基础信息</h4>
              <div class="info-grid">
                 <div class="info-row"><span class="label">CR 编号:</span><span class="value highlight">${cr.id}</span></div>
                 <div class="info-row"><span class="label">状态:</span><span class="value status-green" style="font-weight: 600;">${cr.status || '处理中'}</span></div>
                 <div class="info-row"><span class="label">评估结论:</span><span class="value semi-bold">${cr.title}</span></div>
              </div>
            </section>

            <section class="info-section" style="margin-bottom: 24px;">
              <h4 class="section-title">客户影响描述</h4>
              <div class="problem-box sm">
                ${cr.customerImpact || '暂无描述信息'}
              </div>
            </section>

            <section class="info-section">
              <h4 class="section-title">受影响的手册或服务文件</h4>
              <div class="info-block" style="background: rgba(0, 82, 217, 0.04); padding: 12px; border-radius: 8px; border: 1px solid rgba(0, 82, 217, 0.1);">
                <span class="value semi-bold" style="color: var(--primary-blue); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px;">
                  ${cr.affectedDocs || '无受影响文件'}
                </span>
              </div>
            </section>
            ${data.crRecords.length > 1 ? '<div style="height: 1px; background: #e2e8f0; margin: 24px 0;"></div>' : ''}
          `).join('')}
        </div>
      `;
    } else {
      contentHtml = '<div class="problem-box sm"><div class="box-text muted italic">暂无关联的表单数据</div></div>';
    }

    this.container.innerHTML = `
      <div class="sidebar-container">
        <div class="sidebar-header">
          <div class="header-left">
            <button class="btn-close-right">×</button>
            <strong class="header-title">单据详细视图</strong>
          </div>
          <span class="case-tag clickable" onclick="window.dispatchEvent(new CustomEvent('initiate-technical-request'))" title="在流程系统中查看完整关联信息">CASE系统</span>
        </div>
        
        <div class="details-content" style="padding: 16px;">
          <!-- Marker Headline -->
          <div style="display: flex; flex-direction: column; gap: 8px; padding-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <h3 style="margin: 0; font-size: 16px; color: var(--text-color-main);">${data.id || 'N/A'}</h3>
              <span style="background: #fee2e2; color: #ef4444; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${damageTypeBadge}</span>
            </div>
            <div style="font-size: 13px; color: var(--text-color-secondary); font-weight: 500;">${data.title}</div>
          </div>
          
          ${tabsHtml}

          <div class="tab-content" style="margin-top: 16px;">
            ${contentHtml}
          </div>
        </div>
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

    const closeBtn = this.container.querySelector('.btn-close-right');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (window.app) window.app.toggleRightPanel(false);
      });
    }
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --text-color-main: #1e293b;
        --text-color-secondary: #64748b;
        --text-color-muted: #94a3b8;
        --primary-blue: #0052d9;
        --border-color-light: rgba(0, 0, 0, 0.05);
        --bg-glass-sidebar: rgba(245, 245, 245, 0.72);
      }

      .sidebar-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--bg-glass-sidebar);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.3);
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }

      .sidebar-header {
        padding: 14px 16px;
        border-bottom: 1px solid var(--border-color-light);
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
    `;
    document.head.appendChild(style);
  }
}
