/**
 * TruPanel Client-Side Router
 * Handles navigation and page rendering
 */

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.isInitialized = false;
        this.pageContainer = null;
    }

    /**
     * Initialize router
     */
    init() {
        this.pageContainer = document.getElementById('page-content');
        this.registerRoutes();
        this.bindEvents();
        this.handleRoute();
        this.isInitialized = true;
    }

    /**
     * Register all routes
     */
    registerRoutes() {
        // Main dashboard routes
        this.addRoute('dashboard', () => window.dashboardComponent.render());
        this.addRoute('users', () => window.usersComponent.render());
        this.addRoute('vhosts', () => window.vhostsComponent.render());
        this.addRoute('ssl', () => window.sslComponent.render());
        
        // Default route
        this.addRoute('', () => this.navigate('dashboard'));
    }

    /**
     * Add a route
     */
    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    /**
     * Bind router events
     */
    bindEvents() {
        // Handle hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Handle navigation links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const path = link.getAttribute('href').slice(1);
                this.navigate(path);
            }
        });

        // Update navigation active states
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                this.updateNavigation(navLink.getAttribute('href').slice(1));
            }
        });
    }

    /**
     * Navigate to a route
     */
    navigate(path) {
        if (!window.auth.isAuthenticated()) {
            window.auth.showLogin();
            return;
        }

        // Update URL hash
        window.location.hash = `#${path}`;
        this.handleRoute();
    }

    /**
     * Handle current route
     */
    async handleRoute() {
        if (!this.pageContainer) return;

        const path = window.location.hash.slice(1) || 'dashboard';
        const route = this.routes[path];

        if (route) {
            try {
                // Show loading state
                this.showLoading();
                
                // Execute route handler
                await route();
                
                // Update navigation
                this.updateNavigation(path);
                this.currentRoute = path;
                
            } catch (error) {
                console.error(`Error loading route ${path}:`, error);
                this.showError(`Failed to load page: ${path}`);
            }
        } else {
            // Route not found, redirect to dashboard
            this.navigate('dashboard');
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        if (this.pageContainer) {
            this.pageContainer.innerHTML = `
                <div class="flex items-center justify-center py-12">
                    <div class="loading loading-spinner loading-lg text-primary"></div>
                </div>
            `;
        }
    }

    /**
     * Show error state
     */
    showError(message) {
        if (this.pageContainer) {
            this.pageContainer.innerHTML = `
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>${message}</span>
                </div>
            `;
        }
    }

    /**
     * Update navigation active states
     */
    updateNavigation(activePath) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current nav link
        document.querySelectorAll(`a[href="#${activePath}"]`).forEach(link => {
            link.classList.add('active');
        });

        // Update page title
        this.updatePageTitle(activePath);
    }

    /**
     * Update page title
     */
    updatePageTitle(path) {
        const titles = {
            dashboard: 'Dashboard',
            users: 'System Users',
            vhosts: 'Virtual Hosts',
            ssl: 'SSL Certificates'
        };

        const title = titles[path] || 'TruPanel';
        document.title = `${title} - TruPanel`;
    }

    /**
     * Get current route
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Check if router is initialized
     */
    get isInitialized() {
        return this._isInitialized;
    }

    set isInitialized(value) {
        this._isInitialized = value;
    }

    /**
     * Refresh current page
     */
    refresh() {
        this.handleRoute();
    }

    /**
     * Go back in history
     */
    back() {
        window.history.back();
    }

    /**
     * Go forward in history
     */
    forward() {
        window.history.forward();
    }

    /**
     * Replace current route
     */
    replace(path) {
        window.location.replace(`#${path}`);
        this.handleRoute();
    }

    /**
     * Add route parameters support
     */
    getRouteParams() {
        const hash = window.location.hash.slice(1);
        const [path, queryString] = hash.split('?');
        const params = {};

        if (queryString) {
            queryString.split('&').forEach(param => {
                const [key, value] = param.split('=');
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            });
        }

        return { path, params };
    }

    /**
     * Set route parameters
     */
    setRouteParams(params) {
        const { path } = this.getRouteParams();
        const queryString = Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        
        const newHash = queryString ? `${path}?${queryString}` : path;
        window.location.hash = `#${newHash}`;
    }

    /**
     * Clear route parameters
     */
    clearRouteParams() {
        const { path } = this.getRouteParams();
        window.location.hash = `#${path}`;
    }
}

// Create global router instance
window.router = new Router();