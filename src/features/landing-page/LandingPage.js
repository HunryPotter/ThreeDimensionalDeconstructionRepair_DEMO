/**
 * LandingPage (Home)
 * Navigation center for the COMAC 3D Structural Repair System
 */
export class LandingPage {
  constructor(container, onNav) {
    this.container = container;
    this.onNav = onNav;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="landing-overlay">
        <div class="landing-background">
          <div class="bg-grid"></div>
          <div class="bg-glow"></div>
        </div>
        
        <div class="landing-content">
          <header class="landing-header">
            <div class="header-logo">
              <span class="logo-icon">💠</span>
              <div class="logo-text">
                <h1>数字飞机三维结构修理小超人高保真原型交互演示</h1>
                <p>3D DIGITAL TWIN REPAIR NAVIGATION CENTER</p>
              </div>
            </div>
          </header>

          <main class="landing-main">
            <div class="nav-cards-container">
              <!-- Entrance 1: CASE System -->
              <div class="nav-card card-case" id="btn-nav-case">
                <div class="card-status">正向业务流程</div>
                <div class="card-icon">📋</div>
                <h2 class="card-title">CASE系统</h2>
                <p class="card-desc">适航管理、技术请求及维修记录全周期闭环管理平台。</p>
                <div class="card-action">立即进入 <span>→</span></div>
              </div>

              <!-- Entrance 2: Digital Twin -->
              <div class="nav-card card-twin" id="btn-nav-twin">
                <div class="card-status">高真实感漫游</div>
                <div class="card-icon">✈️</div>
                <h2 class="card-title">数字飞机</h2>
                <p class="card-desc">基于数字孪生的全机结构可视、损伤定位及宏观健康监测。</p>
                <div class="card-action">立即进入 <span>→</span></div>
              </div>
            </div>
          </main>

          <footer class="landing-footer">
            <div class="footer-info">
              <span>当前版本: v2.4.0 High-Fidelity Prototype</span>
              <span class="divider">|</span>
              <span>© 2026 COMAC Digital Aircraft Center</span>
            </div>
          </footer>
        </div>
      </div>
    `;

    this.addStyles();
    this.initEvents();
  }

  initEvents() {
    const btnCase = this.container.querySelector('#btn-nav-case');
    const btnTwin = this.container.querySelector('#btn-nav-twin');

    btnCase.addEventListener('click', () => {
      this.onNav('CASE');
    });

    btnTwin.addEventListener('click', () => {
      this.onNav('DIGITAL_TWIN');
    });
  }

  addStyles() {
    if (document.getElementById('landing-styles')) return;

    const style = document.createElement('style');
    style.id = 'landing-styles';
    style.textContent = `
      .landing-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: #f0f4f8;
        font-family: 'Inter', -apple-system, sans-serif;
        color: #1e293b;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .landing-background {
        position: absolute;
        inset: 0;
        z-index: 1;
      }

      .bg-grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(0, 82, 217, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 82, 217, 0.04) 1px, transparent 1px);
        background-size: 40px 40px;
        opacity: 1;
      }

      .bg-glow {
        position: absolute;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 900px;
        height: 600px;
        background: radial-gradient(ellipse, rgba(0, 82, 217, 0.06) 0%, transparent 70%);
        filter: blur(60px);
      }

      .landing-content {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        height: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 40px;
      }

      .landing-header {
        margin-bottom: 60px;
        padding-bottom: 24px;
        border-bottom: 1px solid rgba(0, 82, 217, 0.1);
      }

      .header-logo {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .logo-icon {
        font-size: 40px;
        background: linear-gradient(135deg, #e8f0fe, #c7d7fb);
        padding: 12px;
        border-radius: 14px;
        border: 1px solid rgba(0, 82, 217, 0.15);
      }

      .logo-text h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 800;
        color: #0f2554;
        letter-spacing: -0.5px;
        line-height: 1.2;
      }

      .logo-text p {
        margin: 6px 0 0;
        font-size: 13px;
        color: #5c7cbc;
        font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
        letter-spacing: 2.5px;
        font-weight: 500;
      }

      .landing-main {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .nav-cards-container {
        display: flex;
        gap: 32px;
        width: 100%;
        max-width: 960px;
      }

      .nav-card {
        flex: 1;
        background: #ffffff;
        border: 1px solid #dce8ff;
        border-radius: 20px;
        padding: 40px;
        cursor: pointer;
        transition: all 0.35s cubic-bezier(0.19, 1, 0.22, 1);
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0, 82, 217, 0.06);
        min-height: 600px;
      }

      .nav-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #0052d9, #38bdf8);
        opacity: 0;
        transition: opacity 0.3s;
      }

      .nav-card:hover {
        transform: translateY(-8px);
        border-color: #a8c4f8;
        box-shadow: 0 20px 48px rgba(0, 82, 217, 0.12), 0 4px 16px rgba(0, 82, 217, 0.08);
      }

      .nav-card:hover::before {
        opacity: 1;
      }

      .card-status {
        font-size: 14px;
        font-weight: 800;
        color: #0052d9;
        background: rgba(0, 82, 217, 0.07);
        padding: 8px 18px;
        border-radius: 24px;
        width: fit-content;
        margin-bottom: 36px;
        text-transform: none;
        letter-spacing: 0.3px;
        border: 1.5px solid rgba(0, 82, 217, 0.15);
      }

      .card-icon {
        font-size: 72px;
        margin-bottom: 28px;
      }

      .card-title {
        font-size: 38px;
        font-weight: 800;
        margin: 0 0 16px 0;
        color: #0f2554;
        letter-spacing: -0.8px;
        line-height: 1.1;
      }

      .card-desc {
        font-size: 16px;
        color: #64748b;
        line-height: 1.8;
        margin: 0;
        margin-bottom: auto;
        padding-bottom: 32px;
      }

      .card-action {
        margin-top: auto;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #0052d9;
        font-size: 16px;
        padding-top: 24px;
        border-top: 1px solid rgba(0, 82, 217, 0.08);
      }

      .card-action span {
        transition: transform 0.3s;
        font-size: 16px;
      }

      .nav-card:hover .card-action span {
        transform: translateX(6px);
      }

      .landing-footer {
        padding: 24px 0 0;
        border-top: 1px solid rgba(0, 82, 217, 0.08);
      }

      .footer-info {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        font-size: 12px;
        color: #94a3b8;
      }

      .divider {
        opacity: 0.4;
      }

      @media (max-width: 900px) {
        .nav-cards-container {
          flex-direction: column;
        }
        .landing-header { margin-bottom: 32px; }
      }
    `;
    document.head.appendChild(style);
  }
}
