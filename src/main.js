import './styles/global.css';
import './styles/layout.css';

// Feature Imports
// Note: We will implement these classes shortly
import { NavigationBar } from './features/navigation-bar/NavigationBar.js';
import { RecordSidebar } from './features/record-sidebar/RecordSidebar.js';
import { DetailSidebar } from './features/detail-sidebar/DetailSidebar.js';
import { SpatialView } from './features/spatial-view/SpatialView.js';
import { PopupManager } from './components/PopupManager.js';
import { ExternalCaseView } from './features/external-case/ExternalCaseView.js';

class App {
    constructor() {
        this.container = document.getElementById('app-container');
        window.app = this; // Expose for global access

        // 0. External Site View (Background)
        this.externalView = new ExternalCaseView(document.body);

        this.initExpandButton();
        this.init();
    }

    init() {
        // 1. Create Region Containers
        const headerEl = document.createElement('header');
        headerEl.className = 'header-region';

        const leftEl = document.createElement('aside');
        leftEl.className = 'left-panel-region';

        const mainEl = document.createElement('main');
        mainEl.className = 'main-view-region';

        const rightEl = document.createElement('aside');
        rightEl.className = 'right-panel-region';

        this.container.appendChild(headerEl);
        this.container.appendChild(leftEl);
        this.container.appendChild(mainEl);
        this.container.appendChild(rightEl);

        // 3. Initial state: hide right sidebar
        this.container.classList.add('right-collapsed');

        // 4. Instantiate Components
        this.navBar = new NavigationBar(headerEl);
        this.spatialView = new SpatialView(mainEl);
        this.leftSidebar = new RecordSidebar(leftEl);
        this.rightSidebar = new DetailSidebar(rightEl);
        this.popupManager = new PopupManager(mainEl);

        // 5. Global Event Listeners
        window.addEventListener('damage-marker-reverse-select', (e) => {
            const { id, allIds } = e.detail;
            this.leftSidebar.selectRecord(id);

            if (allIds && allIds.length > 0) {
                const siteRecords = this.leftSidebar.markerData.filter(m => allIds.includes(m.id));
                this.popupManager.show(siteRecords, id);
            } else {
                if (this.popupManager.isVisible && this.popupManager.records.some(r => r.id === id)) {
                    this.popupManager.selectRecord(id);
                } else {
                    const record = this.leftSidebar.markerData.find(m => m.id === id);
                    if (record) this.popupManager.show([record], id);
                }
            }
        });

        window.addEventListener('damage-marker-select', (e) => {
            this.toggleRightPanel(true);
            const selectedMarker = e.detail;
            
            if (this.leftSidebar.view === 'drilldown') {
                if (this.popupManager.isVisible && this.popupManager.records.some(r => r.id === selectedMarker.id)) {
                    this.popupManager.show(this.popupManager.records, selectedMarker.id);
                } else {
                    // Find 2-3 related markers from the same fleet context
                    const related = this.leftSidebar.markerData
                        .filter(m => m.airline === selectedMarker.airline && m.aircraftType === selectedMarker.aircraftType && m.id !== selectedMarker.id)
                        .sort(() => 0.5 - Math.random())
                        .slice(0, 3);

                    this.popupManager.show([selectedMarker, ...related], selectedMarker.id);
                }
            }
        });

        window.addEventListener('exit-drilldown', () => {
            this.popupManager.hide();
        });

        // 3D Marking Flow Coordination
        window.addEventListener('enter-drawing-mode', () => {
            this.popupManager.hide();
            // SpatialView already listens to this to enable drawing
        });

        window.addEventListener('confirm-technical-request', () => {
            // Restore the popup manager with current record before jumping
            if (this.popupManager.records) {
                this.popupManager.show(this.popupManager.records, this.popupManager.data.id, 'SR');
            }
            // Trigger jump
            window.dispatchEvent(new CustomEvent('initiate-technical-request'));
        });

        // External Navigation Logic
        window.addEventListener('initiate-technical-request', () => {
            console.log('Jumping to External CASE System...');
            this.container.style.display = 'none';
            this.externalView.show();
        });

        window.addEventListener('return-from-external', () => {
            console.log('Returning from External Case...');
            this.externalView.hide();
            this.container.style.display = ''; // Restore to CSS default (grid)
        });

        console.log('COMAC 3D Structural Repair System - Standardized Load Complete');

        // Global Left Panel Toggle Listener
        window.addEventListener('toggle-left-panel', (e) => {
            this.toggleLeftPanel(e.detail);
        });
    }

    toggleLeftPanel(show) {
        if (show === undefined) {
            this.container.classList.toggle('left-collapsed');
        } else if (show) {
            this.container.classList.remove('left-collapsed');
        } else {
            this.container.classList.add('left-collapsed');
        }

        // Update expand button visibility
        if (this.expandLeftBtn) {
            this.expandLeftBtn.style.display = this.container.classList.contains('left-collapsed') ? 'flex' : 'none';
        }
    }

    initExpandButton() {
        this.expandLeftBtn = document.createElement('button');
        this.expandLeftBtn.className = 'btn-expand-left';
        this.expandLeftBtn.innerHTML = '▶';
        this.expandLeftBtn.title = '展开面板';
        this.expandLeftBtn.style.display = 'none'; // Hidden by default

        // CSS for expand button
        const style = document.createElement('style');
        style.textContent = `
            .btn-expand-left {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                z-index: 1001;
                background: white;
                border: 1px solid #e2e8f0;
                border-left: none;
                border-radius: 0 4px 4px 0;
                padding: 12px 4px;
                cursor: pointer;
                color: #64748b;
                box-shadow: 2px 0 8px rgba(0,0,0,0.05);
                display: none;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                transition: all 0.2s;
            }
            .btn-expand-left:hover {
                background: #f8fafc;
                color: var(--primary-blue);
                padding-right: 8px;
            }
        `;
        document.head.appendChild(style);

        this.expandLeftBtn.addEventListener('click', () => {
            this.toggleLeftPanel(true);
        });

        document.body.appendChild(this.expandLeftBtn);
    }

    toggleRightPanel(show) {
        if (show) {
            this.container.classList.remove('right-collapsed');
        } else {
            this.container.classList.add('right-collapsed');
        }
    }
}

// Start the app
window.addEventListener('DOMContentLoaded', () => {
    new App();
});
