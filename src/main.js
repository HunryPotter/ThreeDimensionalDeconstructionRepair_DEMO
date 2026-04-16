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
import { LandingPage } from './features/landing-page/LandingPage.js';

class App {
    constructor() {
        this.container = document.getElementById('app-container');
        window.app = this; // Expose for global access

        // 0. External Site View (Background)
        this.externalView = new ExternalCaseView(document.body);

        // 1. Start with Landing Page (View Level 0)
        this.viewLevel = 0;
        this.initCoreListeners();
        this.initLandingPage();
    }

    initLandingPage() {
        // Hide main container during landing
        this.container.style.display = 'none';

        const landingContainer = document.createElement('div');
        landingContainer.id = 'landing-mount';
        document.body.appendChild(landingContainer);

        this.landingPage = new LandingPage(landingContainer, (choice) => {
            if (choice === 'CASE') {
                this.enterCaseSystem();
            } else if (choice === 'DIGITAL_TWIN') {
                this.enterDigitalTwin();
            }
        });
    }

    enterCaseSystem() {
        console.log('Navigating to: 正向业务流程—CASE系统');
        const landingMount = document.getElementById('landing-mount');
        if (landingMount) landingMount.style.display = 'none';

        // Unified Entry: Trigger the same logic as the "Initiate Technical Request" button
        window.dispatchEvent(new CustomEvent('initiate-technical-request'));
    }

    enterDigitalTwin() {
        console.log('Navigating to: 数字飞机');
        const landingMount = document.getElementById('landing-mount');
        if (landingMount) landingMount.style.display = 'none';

        this.container.style.display = 'grid'; // Restore main grid
        this.container.classList.remove('left-collapsed'); // Ensure it's not hidden

        this.viewLevel = 1;
        this.init(); // Initialize main components
        this.updateViewLevelClass();
    }

    returnToHome() {
        console.log('Returning to Home...');
        
        // 1. Hide CASE if visible
        this.externalView.hide();
        
        // 2. Hide Main Container
        this.container.style.display = 'none';
        
        // 3. Show Landing Page
        const landingMount = document.getElementById('landing-mount');
        if (landingMount) {
            landingMount.style.display = 'block';
        } else {
            this.initLandingPage();
        }
        
        this.viewLevel = 0;
    }

    updateViewLevelClass() {
        this.container.classList.remove('view-level-1', 'view-level-2');
        this.container.classList.add(`view-level-${this.viewLevel}`);
    }

    setViewLevel(level) {
        this.viewLevel = level;
        this.updateViewLevelClass();

        // Default to collapsed in Level 2 entry unless a marker is explicitly selected
        if (level === 2) {
            this.toggleRightPanel(false);
        }

        // Force refresh components that care about level
        if (this.rightSidebar) this.rightSidebar.render();
    }

    initCoreListeners() {
        // External Navigation Logic (Always active from startup)
        window.addEventListener('initiate-technical-request', () => {
            console.log('Jumping to External CASE System...');
            this.container.style.display = 'none';
            this.externalView.show();
        });

        window.addEventListener('return-from-external', () => {
            console.log('Returning from External Case...');
            this.returnToHome();
        });

        window.addEventListener('return-to-home', () => {
            this.returnToHome();
        });

        // Global bridge from Digital Twin -> CASE
        window.addEventListener('confirm-technical-request', () => {
            // Restore the popup manager with current record before jumping
            if (this.popupManager && this.popupManager.records) {
                this.popupManager.show(this.popupManager.records, this.popupManager.data.id, 'SR');
            }
            // Trigger jump
            window.dispatchEvent(new CustomEvent('initiate-technical-request'));
        });
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;

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
