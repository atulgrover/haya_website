/**
 * HAYAGRIVA Universal IDE Docking & Split-Pane Resizing Engine
 * Enables desktop-class draggable splitters, collapsible panels, maximize modes, and workspace state persistence.
 */

'use strict';

window.HayaIdeDocking = (function () {
    const DEFAULT_CONFIG = {
        containerId: 'ideContainer',
        leftPanelId: 'panelLeft',
        rightPanelId: 'panelRight',
        leftResizerId: 'leftResizer',
        rightResizerId: 'rightResizer',
        restoreLeftBtnId: 'btnRestoreLeft',
        minLeftWidth: 180,
        maxLeftWidth: 460,
        defaultLeftWidth: 260,
        minRightWidth: 320,
        maxRightWidth: 780,
        defaultRightWidth: 420,
        storagePrefix: 'haya_ide_'
    };

    let activeConfig = null;
    let container = null;
    let leftPanel = null;
    let rightPanel = null;
    let leftResizer = null;
    let rightResizer = null;
    let restoreLeftBtn = null;

    let isDraggingLeft = false;
    let isDraggingRight = false;
    let startX = 0;
    let startWidth = 0;

    /**
     * Initialize IDE docking manager for current page
     */
    function init(userConfig = {}) {
        activeConfig = { ...DEFAULT_CONFIG, ...userConfig };

        container = document.getElementById(activeConfig.containerId) || document.querySelector('.ide-container');
        leftPanel = document.getElementById(activeConfig.leftPanelId) || document.querySelector('.panel-left') || document.querySelector('.ide-panel-left');
        rightPanel = document.getElementById(activeConfig.rightPanelId) || document.querySelector('.panel-right') || document.querySelector('.ide-panel-right');
        leftResizer = document.getElementById(activeConfig.leftResizerId);
        rightResizer = document.getElementById(activeConfig.rightResizerId);
        restoreLeftBtn = document.getElementById(activeConfig.restoreLeftBtnId);

        if (!container) {
            console.warn('[HAYA IDE] No .ide-container found on page.');
            return;
        }

        // 1. Ensure resizer elements exist; dynamically inject if missing
        ensureResizers();

        // 2. Restore saved workspace dimensions from localStorage
        restoreWorkspaceState();

        // 3. Bind drag-to-resize mouse and touch events
        bindDragEvents();

        // 4. Bind global keyboard shortcuts (Cmd+B, Esc)
        bindKeyboardShortcuts();

        // 5. Wire up restore floating button
        if (restoreLeftBtn) {
            restoreLeftBtn.addEventListener('click', () => toggleLeftPanel(true));
        }

        console.log('[HAYA IDE] ✅ Docking & Resizing Engine initialized.');
    }

    /**
     * Ensure left and right resizer splitter DOM elements exist
     */
    function ensureResizers() {
        if (!leftResizer && leftPanel && container) {
            leftResizer = document.createElement('div');
            leftResizer.id = activeConfig.leftResizerId;
            leftResizer.className = 'ide-resizer ide-resizer-left';
            leftResizer.title = 'Drag to resize sidebar • Double click to reset';
            leftPanel.after(leftResizer);
        }

        if (!rightResizer && rightPanel && container) {
            rightResizer = document.createElement('div');
            rightResizer.id = activeConfig.rightResizerId;
            rightResizer.className = 'ide-resizer ide-resizer-right';
            rightResizer.title = 'Drag to resize inspector • Double click to reset';
            rightPanel.before(rightResizer);
        }

        // Double-click resizer to reset to default width
        if (leftResizer) {
            leftResizer.addEventListener('dblclick', () => {
                setLeftWidth(activeConfig.defaultLeftWidth);
            });
        }
        if (rightResizer) {
            rightResizer.addEventListener('dblclick', () => {
                setRightWidth(activeConfig.defaultRightWidth);
            });
        }
    }

    /**
     * Restore saved widths and collapsed states from localStorage
     */
    function restoreWorkspaceState() {
        try {
            const savedLeftWidth = localStorage.getItem(`${activeConfig.storagePrefix}left_width`);
            const savedLeftCollapsed = localStorage.getItem(`${activeConfig.storagePrefix}left_collapsed`);
            const savedRightWidth = localStorage.getItem(`${activeConfig.storagePrefix}right_width`);

            if (leftPanel) {
                if (savedLeftCollapsed === 'true') {
                    collapseLeftPanel();
                } else if (savedLeftWidth) {
                    setLeftWidth(parseInt(savedLeftWidth, 10));
                } else {
                    setLeftWidth(activeConfig.defaultLeftWidth);
                }
            }

            if (rightPanel && savedRightWidth) {
                setRightWidth(parseInt(savedRightWidth, 10));
            }
        } catch (err) {
            console.warn('[HAYA IDE] Could not read localStorage:', err.message);
        }
    }

    /**
     * Bind drag-and-drop mouse/touch events for resizers
     */
    function bindDragEvents() {
        // Left Resizer Drag Start
        if (leftResizer) {
            leftResizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                isDraggingLeft = true;
                startX = e.clientX;
                startWidth = leftPanel ? leftPanel.getBoundingClientRect().width : activeConfig.defaultLeftWidth;
                document.body.classList.add('ide-dragging');
                leftResizer.classList.add('active');
            });
        }

        // Right Resizer Drag Start
        if (rightResizer) {
            rightResizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                isDraggingRight = true;
                startX = e.clientX;
                startWidth = rightPanel ? rightPanel.getBoundingClientRect().width : activeConfig.defaultRightWidth;
                document.body.classList.add('ide-dragging');
                rightResizer.classList.add('active');
            });
        }

        // Window MouseMove
        window.addEventListener('mousemove', (e) => {
            if (isDraggingLeft && leftPanel) {
                const delta = e.clientX - startX;
                const newWidth = Math.min(Math.max(startWidth + delta, activeConfig.minLeftWidth), activeConfig.maxLeftWidth);
                setLeftWidth(newWidth);
            } else if (isDraggingRight && rightPanel) {
                const delta = startX - e.clientX; // Inverted because dragging left increases right panel width
                const newWidth = Math.min(Math.max(startWidth + delta, activeConfig.minRightWidth), activeConfig.maxRightWidth);
                setRightWidth(newWidth);
            }
        });

        // Window MouseUp
        window.addEventListener('mouseup', () => {
            if (isDraggingLeft || isDraggingRight) {
                isDraggingLeft = false;
                isDraggingRight = false;
                document.body.classList.remove('ide-dragging');
                if (leftResizer) leftResizer.classList.remove('active');
                if (rightResizer) rightResizer.classList.remove('active');
                persistState();
                dispatchResizeEvent();
            }
        });
    }

    /**
     * Set Left Panel width with constraints
     */
    function setLeftWidth(widthPx) {
        if (!leftPanel) return;
        const bounded = Math.min(Math.max(widthPx, activeConfig.minLeftWidth), activeConfig.maxLeftWidth);
        leftPanel.style.width = `${bounded}px`;
        leftPanel.style.minWidth = `${bounded}px`;
        leftPanel.classList.remove('collapsed');
        if (leftResizer) leftResizer.classList.remove('hidden');
        if (restoreLeftBtn) restoreLeftBtn.classList.remove('visible');
    }

    /**
     * Set Right Panel width with constraints
     */
    function setRightWidth(widthPx) {
        if (!rightPanel) return;
        const bounded = Math.min(Math.max(widthPx, activeConfig.minRightWidth), activeConfig.maxRightWidth);
        rightPanel.style.width = `${bounded}px`;
        rightPanel.style.minWidth = `${bounded}px`;
        rightPanel.classList.remove('collapsed');
        if (rightResizer) rightResizer.classList.remove('hidden');
    }

    /**
     * Toggle Left Panel Collapse / Expand
     */
    function toggleLeftPanel(forceExpand = null) {
        if (!leftPanel) return;
        const isCurrentlyCollapsed = leftPanel.classList.contains('collapsed');
        const shouldExpand = forceExpand !== null ? forceExpand : isCurrentlyCollapsed;

        if (shouldExpand) {
            const savedWidth = parseInt(localStorage.getItem(`${activeConfig.storagePrefix}left_width`), 10) || activeConfig.defaultLeftWidth;
            setLeftWidth(savedWidth);
            localStorage.setItem(`${activeConfig.storagePrefix}left_collapsed`, 'false');
        } else {
            collapseLeftPanel();
        }
        dispatchResizeEvent();
    }

    /**
     * Collapse Left Panel to 0px
     */
    function collapseLeftPanel() {
        if (!leftPanel) return;
        leftPanel.classList.add('collapsed');
        if (leftResizer) leftResizer.classList.add('hidden');
        if (restoreLeftBtn) restoreLeftBtn.classList.add('visible');
        localStorage.setItem(`${activeConfig.storagePrefix}left_collapsed`, 'true');
    }

    /**
     * Toggle Right Inspector Panel
     */
    function toggleRightPanel(forceOpen = null) {
        if (!rightPanel) return;
        const isCurrentlyOpen = rightPanel.classList.contains('active') && !rightPanel.classList.contains('collapsed');
        const shouldOpen = forceOpen !== null ? forceOpen : !isCurrentlyOpen;

        if (shouldOpen) {
            openRightPanel();
        } else {
            closeRightPanel();
        }
        dispatchResizeEvent();
    }

    /**
     * Open Right Inspector Panel
     */
    function openRightPanel() {
        if (!rightPanel) return;
        rightPanel.classList.add('active');
        rightPanel.classList.remove('collapsed');
        if (rightResizer) rightResizer.classList.remove('hidden');
        const savedWidth = parseInt(localStorage.getItem(`${activeConfig.storagePrefix}right_width`), 10) || activeConfig.defaultRightWidth;
        setRightWidth(savedWidth);
    }

    /**
     * Close Right Inspector Panel
     */
    function closeRightPanel() {
        if (!rightPanel) return;
        rightPanel.classList.remove('active');
        rightPanel.classList.remove('maximized');
        rightPanel.classList.add('collapsed');
        if (rightResizer) rightResizer.classList.add('hidden');
    }

    /**
     * Toggle Maximize / Normal Docked View for Right Inspector
     */
    function maximizeRightPanel(forceMax = null) {
        if (!rightPanel) return;
        const isMaximized = rightPanel.classList.contains('maximized');
        const shouldMaximize = forceMax !== null ? forceMax : !isMaximized;

        if (shouldMaximize) {
            rightPanel.classList.add('maximized');
            if (rightResizer) rightResizer.classList.add('hidden');
        } else {
            rightPanel.classList.remove('maximized');
            if (rightResizer) rightResizer.classList.remove('hidden');
        }
        dispatchResizeEvent();
    }

    /**
     * Reset IDE Layout to factory defaults
     */
    function resetIdeLayout() {
        setLeftWidth(activeConfig.defaultLeftWidth);
        setRightWidth(activeConfig.defaultRightWidth);
        if (rightPanel) rightPanel.classList.remove('maximized');
        localStorage.removeItem(`${activeConfig.storagePrefix}left_width`);
        localStorage.removeItem(`${activeConfig.storagePrefix}left_collapsed`);
        localStorage.removeItem(`${activeConfig.storagePrefix}right_width`);
        dispatchResizeEvent();
    }

    /**
     * Persist current panel widths to localStorage
     */
    function persistState() {
        try {
            if (leftPanel && !leftPanel.classList.contains('collapsed')) {
                localStorage.setItem(`${activeConfig.storagePrefix}left_width`, parseInt(leftPanel.style.width, 10) || activeConfig.defaultLeftWidth);
            }
            if (rightPanel && !rightPanel.classList.contains('collapsed') && !rightPanel.classList.contains('maximized')) {
                localStorage.setItem(`${activeConfig.storagePrefix}right_width`, parseInt(rightPanel.style.width, 10) || activeConfig.defaultRightWidth);
            }
        } catch (e) {
            // Ignore quota errors
        }
    }

    /**
     * Dispatch custom resize event for child components (charts, players, grids)
     */
    function dispatchResizeEvent() {
        window.dispatchEvent(new CustomEvent('haya-ide-resize', {
            detail: {
                leftWidth: leftPanel ? leftPanel.getBoundingClientRect().width : 0,
                rightWidth: rightPanel ? rightPanel.getBoundingClientRect().width : 0
            }
        }));
    }

    /**
     * Bind global IDE keyboard shortcuts: Cmd+B (Toggle Sidebar), Escape (Close/Unmaximize)
     */
    function bindKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            // Cmd+B / Ctrl+B: Toggle Left Explorer
            if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
                e.preventDefault();
                toggleLeftPanel();
            }

            // Escape: Exit maximize or close right inspector
            if (e.key === 'Escape') {
                if (rightPanel && rightPanel.classList.contains('maximized')) {
                    maximizeRightPanel(false);
                } else if (rightPanel && rightPanel.classList.contains('active')) {
                    closeRightPanel();
                }
            }
        });
    }

    return {
        init,
        toggleLeftPanel,
        toggleRightPanel,
        openRightPanel,
        closeRightPanel,
        maximizeRightPanel,
        resetIdeLayout
    };
})();
