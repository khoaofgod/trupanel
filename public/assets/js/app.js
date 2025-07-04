/**
 * TruPanel Main Application
 * Initializes and manages the entire frontend application
 */

class TruPanelApp {
    constructor() {
        this.isInitialized = false;
        this.components = {};
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.isInitialized) return;

        try {
            // Show loading screen
            this.showLoadingScreen();

            // Wait for DOM to be fully loaded
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize core systems
            await this.initializeCore();

            // Initialize authentication
            await this.initializeAuth();

            // Hide loading screen and show app
            this.hideLoadingScreen();

            this.isInitialized = true;
            console.log('TruPanel initialized successfully');

        } catch (error) {
            console.error('Failed to initialize TruPanel:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Initialize core systems
     */
    async initializeCore() {
        // Test API connectivity
        try {
            await window.api.healthCheck();
            console.log('API connection successful');
        } catch (error) {
            console.warn('API health check failed:', error);
            // Don't throw - app can still work
        }

        // Initialize router (but don't start it yet - auth will do that)
        // Router will be initialized by auth manager when user is authenticated
    }

    /**
     * Initialize authentication system
     */
    async initializeAuth() {
        if (!window.auth) {
            throw new Error('Authentication manager not found');
        }

        await window.auth.init();
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }

    /**
     * Hide loading screen and show app
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 500); // Small delay for smooth transition
        }
        
        if (app) {
            app.classList.remove('hidden');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="text-center">
                    <div class="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-exclamation-triangle text-error text-2xl"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-error mb-2">Application Error</h2>
                    <p class="text-base-content/70 mb-4">${message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        <i class="fas fa-refresh mr-2"></i>
                        Reload Page
                    </button>
                </div>
            `;
        }
    }

    /**
     * Get application info
     */
    getInfo() {
        return {
            name: 'TruPanel',
            version: '1.0.0',
            description: 'Open Source Server Control Panel',
            author: 'khoaofgod',
            initialized: this.isInitialized,
            components: Object.keys(this.components)
        };
    }

    /**
     * Handle global errors
     */
    handleGlobalError(error) {
        console.error('Global error:', error);
        
        // Show user-friendly error message
        ApiUtils.showError('An unexpected error occurred. Please try again.');
        
        // In development, you might want to show more details
        if (window.location.hostname === 'localhost') {
            console.error('Error details:', error);
        }
    }

    /**
     * Handle unhandled promise rejections
     */
    handleUnhandledRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        
        // Prevent the default browser behavior
        event.preventDefault();
        
        // Show user-friendly error message
        ApiUtils.showError('An error occurred while processing your request.');
    }

    /**
     * Setup global error handlers
     */
    setupErrorHandlers() {
        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error);
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleUnhandledRejection(event);
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + K for search (future feature)
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                // TODO: Open search modal
                ApiUtils.showInfo('Search functionality - coming soon!');
            }

            // Ctrl/Cmd + / for help (future feature)
            if ((event.ctrlKey || event.metaKey) && event.key === '/') {
                event.preventDefault();
                // TODO: Open help modal
                ApiUtils.showInfo('Help system - coming soon!');
            }

            // Escape to close modals
            if (event.key === 'Escape') {
                // Close any open modals
                const openModals = document.querySelectorAll('dialog[open]');
                openModals.forEach(modal => modal.close());
            }
        });
    }

    /**
     * Setup theme management
     */
    setupThemeManagement() {
        // Check for saved theme
        const savedTheme = localStorage.getItem('trupanel-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        // Theme toggle functionality (future feature)
        // This can be called from a theme toggle button
        window.toggleTheme = () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('trupanel-theme', newTheme);
        };
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Log page load time
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            console.log(`TruPanel loaded in ${loadTime.toFixed(2)}ms`);
        });

        // Monitor long tasks (if supported)
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach((entry) => {
                        if (entry.duration > 100) {
                            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
                        }
                    });
                });
                observer.observe({ entryTypes: ['longtask'] });
            } catch (error) {
                // PerformanceObserver might not be supported
                console.log('Performance monitoring not supported');
            }
        }
    }

    /**
     * Cleanup application
     */
    cleanup() {
        // Stop any running intervals
        if (window.dashboardComponent) {
            window.dashboardComponent.destroy();
        }

        // Clear any cached data
        // Future: Clear component caches

        console.log('TruPanel cleaned up');
    }
}

// Initialize application when DOM is ready
const app = new TruPanelApp();

// Setup error handlers early
app.setupErrorHandlers();

// Setup keyboard shortcuts
app.setupKeyboardShortcuts();

// Setup theme management
app.setupThemeManagement();

// Setup performance monitoring
app.setupPerformanceMonitoring();

// Initialize app
app.init().catch(error => {
    console.error('Failed to initialize TruPanel:', error);
    app.showError('Failed to initialize application. Please refresh the page.');
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    app.cleanup();
});

// Make app available globally for debugging
window.truPanel = app;

// Add some useful global utilities
window.utils = {
    // Format bytes to human readable
    formatBytes: (bytes) => ApiUtils.formatFileSize(bytes),
    
    // Format date
    formatDate: (date) => ApiUtils.formatDate(date),
    
    // Format relative time
    formatRelativeTime: (date) => ApiUtils.formatRelativeTime(date),
    
    // Copy to clipboard
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            ApiUtils.showSuccess('Copied to clipboard');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            ApiUtils.showError('Failed to copy to clipboard');
        }
    },
    
    // Download text as file
    downloadAsFile: (content, filename, mimeType = 'text/plain') => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

console.log('TruPanel frontend loaded successfully');