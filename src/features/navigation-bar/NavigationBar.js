export class NavigationBar {
  constructor(container) {
    this.container = container;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="nav-content">
        <div class="nav-left">
          <div class="logo-area">
            <span class="logo-icon">LOGO</span>
            <span class="system-name">中国商飞 · 数字飞机</span>
          </div>
          <div class="module-selector">
            <span class="current-module">三维结构修理</span>
            <span class="dropdown-icon">▼</span>
          </div>
        </div>
        
        <div class="nav-right">
          <div class="status-items">
            <div class="utility-icons">
                <button class="back-btn" title="返回">
                  <span class="back-icon">↩</span>
                  <span>返回</span>
                </button>
            </div>
            <div class="realtime-clock" id="nav-clock">16:24:36 星期二 2026-03-17</div>
          </div>
        </div>
      </div>
    `;

    this.addStyles();
    this.startClock();
    this.initEvents();
  }

  initEvents() {
    const btnBack = this.container.querySelector('.back-btn');
    if (btnBack) {
      btnBack.addEventListener('click', (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('return-to-home'));
      });
    }
  }

  startClock() {
    const clockEl = this.container.querySelector('#nav-clock');
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

    const update = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });
      const dateStr = now.toLocaleDateString('zh-CN').replace(/\//g, '-');
      const dayStr = weekdays[now.getDay()];
      clockEl.textContent = `${timeStr} ${dayStr} ${dateStr}`;
    };

    update();
    setInterval(update, 1000);
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .nav-content {
        height: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 24px;
        color: white;
        background: var(--header-bg);
      }
      
      .nav-left {
        display: flex;
        align-items: center;
        gap: 40px;
      }
      
      .logo-area {
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 700;
        letter-spacing: 1px;
      }
      
      .logo-icon {
        background: white;
        color: var(--header-bg);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .system-name {
        font-size: 18px;
        white-space: nowrap;
      }
      
      .module-selector {
        background: rgba(255,255,255,0.1);
        padding: 6px 16px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
      }
      
      .nav-right .status-items {
        display: flex;
        align-items: center;
        gap: 32px;
        font-size: 14px;
        color: #e2e8f0;
      }
      
      .realtime-clock {
        font-family: 'Inter', monospace;
        letter-spacing: 0.5px;
      }
      
      .back-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        color: white;
        background: rgba(255, 255, 255, 0.1);
        padding: 6px 14px;
        border-radius: 4px;
        font-size: 14px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        cursor: pointer;
        transition: var(--transition-fast);
      }
      
      .back-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateX(-2px);
      }
      
      .back-icon {
        font-size: 18px;
        transform: rotate(0deg);
      }
    `;
    document.head.appendChild(style);
  }
}
