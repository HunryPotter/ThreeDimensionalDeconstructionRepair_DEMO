import './styles/global.css';
import './styles/layout.css';

// Feature Imports
// Note: We will implement these classes shortly
import { NavigationBar } from './features/navigation-bar/NavigationBar.js';
import { RecordSidebar } from './features/record-sidebar/RecordSidebar.js';
import { DetailSidebar } from './features/detail-sidebar/DetailSidebar.js';
import { SpatialView } from './features/spatial-view/SpatialView.js';
import { PopupManager } from './components/PopupManager.js';
import { MarkerPopup } from './components/MarkerPopup.js';
import { ExternalCaseView } from './features/external-case/ExternalCaseView.js';

class App {
    constructor() {
        this.container = document.getElementById('app-container');
        window.app = this; // Expose for global access

        // 0. External Site View (Background)
        this.externalView = new ExternalCaseView(document.body);

        this.viewLevel = 1; // Default to layer 1
        this.init();
        this.updateViewLevelClass();
    }

    updateViewLevelClass() {
        this.container.classList.remove('view-level-1', 'view-level-2');
        this.container.classList.add(`view-level-${this.viewLevel}`);
    }

    setViewLevel(level) {
        this.viewLevel = level;
        this.updateViewLevelClass();
        // Force refresh components that care about level
        if (this.rightSidebar) this.rightSidebar.render();
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
        this.markerPopup = new MarkerPopup(mainEl);

        // 5. Global Event Listeners
        window.addEventListener('damage-marker-reverse-select', (e) => {
            const { id } = e.detail;
            this.leftSidebar.selectRecord(id);
            this.toggleRightPanel(true);

            // Sync MarkerPopup if in Level 2
            if (this.viewLevel === 2) {
                const marker = this.leftSidebar.markerData.find(m => m.id === id);
                if (marker) {
                    this.markerPopup.show(marker);
                    this.popupManager.hide();
                }
            }
        });

        window.addEventListener('damage-marker-select', (e) => {
            if (window.app.viewLevel !== 2) return;
            
            const selectedMarker = e.detail;
            this.leftSidebar.selectRecord(selectedMarker.id);

            // Show individual marker popup
            this.markerPopup.show(selectedMarker);

            // Close component-level summary if it was open
            this.popupManager.hide();
        });

        window.addEventListener('ata-branch-select', (e) => {
            const { ataCode, label } = e.detail;
            
            // Strictly ATA-Twig Association: Fetch all markers sharing the same ATA code (inclusive of sub-branches)
            const related = this.leftSidebar.markerData.filter(m => 
                m.ataCode.startsWith(ataCode)
            );
            
            if (related.length > 0) {
                this.popupManager.show(related, related[0].id, { ataCode, label });
                // Hide specific popup if it was showing a different marker
                this.markerPopup.hide();
                
                // SYNC: Tell the right sidebar to update its context if it's currently focused on CR
                window.dispatchEvent(new CustomEvent('sync-sidebar-context', {
                    detail: { markerData: related[0] }
                }));
            } else {
                this.popupManager.hide();
            }
        });

        window.addEventListener('exit-drilldown', () => {
            this.popupManager.hide();
            this.markerPopup.hide();
        });

        // 3D Marking Flow Coordination: Cleanup ONLY popups to prevent occlusion
        window.addEventListener('enter-drawing-mode', () => {
            this.popupManager.hide();
            this.markerPopup.hide();
            // Sidebars remain visible as per user request
        });

        window.addEventListener('exit-interaction-modes', () => {
            // Restore detail popups if a marker is selected
            const selectedId = this.leftSidebar.selectedMarkerId;
            if (selectedId) {
                const marker = this.leftSidebar.markerData.find(m => m.id === selectedId);
                if (marker) {
                    this.toggleRightPanel(true);
                    this.markerPopup.show(marker);
                }
            } else if (this.leftSidebar.selectedBranchId) {
                // If it was a branch-level focus, restore the summary popup based on containment
                const related = this.leftSidebar.markerData.filter(m => 
                    m.ataCode.startsWith(this.leftSidebar.selectedBranchId)
                );
                if (related.length > 0) {
                    this.popupManager.show(related, related[0].id);
                }
            }
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
    }

    toggleRightPanel(show) {
        if (this.externalView && this.externalView.markerEntryActive) {
            this.externalView.toggleRightPanel(show);
            // Even if external view is active, we might want to keep the underlying structure synced to avoid glitches when returning
            if (show === undefined) {
                this.container.classList.toggle('right-collapsed');
            } else if (show) {
                this.container.classList.remove('right-collapsed');
            } else {
                this.container.classList.add('right-collapsed');
            }
            return;
        }

        if (show === undefined) {
            this.container.classList.toggle('right-collapsed');
        } else if (show) {
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
