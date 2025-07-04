/**
 * TruPanel Dashboard Component
 * Displays server overview and system statistics
 */

class DashboardComponent {
    constructor() {
        this.systemInfo = null;
        this.refreshInterval = null;
    }

    /**
     * Render dashboard page
     */
    async render() {
        const container = document.getElementById('page-content');
        if (!container) return;

        // Show loading state
        container.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="loading loading-spinner loading-lg text-primary"></div>
            </div>
        `;

        try {
            // Load system information
            await this.loadSystemInfo();
            
            // Render dashboard content
            container.innerHTML = this.getTemplate();
            
            // Bind events
            this.bindEvents();
            
            // Start auto-refresh
            this.startAutoRefresh();
            
        } catch (error) {
            console.error('Dashboard render error:', error);
            container.innerHTML = `
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Failed to load dashboard. Please try again.</span>
                    <button class="btn btn-sm btn-outline" onclick="window.router.refresh()">
                        <i class="fas fa-refresh mr-1"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Load system information
     */
    async loadSystemInfo() {
        try {
            const response = await window.api.getSystemInfo();
            if (response.success) {
                this.systemInfo = response.data;
            }
        } catch (error) {
            console.error('Failed to load system info:', error);
            throw error;
        }
    }

    /**
     * Get dashboard template
     */
    getTemplate() {
        if (!this.systemInfo) {
            return '<div class="alert alert-warning">No system information available</div>';
        }

        const { server, disk, memory } = this.systemInfo;
        const diskUsagePercent = ((disk.used / disk.total) * 100).toFixed(1);
        const memoryUsage = memory[0] || 0;

        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold text-base-content">Dashboard</h1>
                        <p class="text-base-content/70 mt-1">Server overview and system statistics</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-outline btn-sm" id="refresh-btn">
                            <i class="fas fa-sync-alt mr-1"></i> Refresh
                        </button>
                        <button class="btn btn-primary btn-sm" id="reload-nginx-btn">
                            <i class="fas fa-server mr-1"></i> Reload Nginx
                        </button>
                    </div>
                </div>

                <!-- System Overview Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <!-- Server Status -->
                    <div class="card bg-base-100 shadow-lg card-hover">
                        <div class="card-body">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-base-content/70 text-sm">Server Status</p>
                                    <p class="text-2xl font-bold text-success">Online</p>
                                </div>
                                <div class="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                                    <i class="fas fa-server text-success text-xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- PHP Version -->
                    <div class="card bg-base-100 shadow-lg card-hover">
                        <div class="card-body">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-base-content/70 text-sm">PHP Version</p>
                                    <p class="text-2xl font-bold text-primary">${server.php_version}</p>
                                </div>
                                <div class="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                                    <i class="fab fa-php text-primary text-xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Disk Usage -->
                    <div class="card bg-base-100 shadow-lg card-hover">
                        <div class="card-body">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-base-content/70 text-sm">Disk Usage</p>
                                    <p class="text-2xl font-bold text-warning">${diskUsagePercent}%</p>
                                </div>
                                <div class="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
                                    <i class="fas fa-hdd text-warning text-xl"></i>
                                </div>
                            </div>
                            <div class="w-full bg-base-300 rounded-full h-2 mt-2">
                                <div class="bg-warning h-2 rounded-full" style="width: ${diskUsagePercent}%"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Memory Usage -->
                    <div class="card bg-base-100 shadow-lg card-hover">
                        <div class="card-body">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-base-content/70 text-sm">Load Average</p>
                                    <p class="text-2xl font-bold text-info">${memoryUsage.toFixed(2)}</p>
                                </div>
                                <div class="w-12 h-12 bg-info/20 rounded-full flex items-center justify-center">
                                    <i class="fas fa-memory text-info text-xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions & System Info -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Quick Actions -->
                    <div class="card bg-base-100 shadow-lg">
                        <div class="card-header">
                            <h2 class="card-title">
                                <i class="fas fa-bolt text-primary mr-2"></i>
                                Quick Actions
                            </h2>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button class="btn btn-outline" onclick="window.router.navigate('users')">
                                    <i class="fas fa-user-plus mr-2"></i>
                                    Add User
                                </button>
                                <button class="btn btn-outline" onclick="window.router.navigate('vhosts')">
                                    <i class="fas fa-globe mr-2"></i>
                                    Add Vhost
                                </button>
                                <button class="btn btn-outline" onclick="window.router.navigate('ssl')">
                                    <i class="fas fa-shield-alt mr-2"></i>
                                    Manage SSL
                                </button>
                                <button class="btn btn-outline" id="system-info-btn">
                                    <i class="fas fa-info-circle mr-2"></i>
                                    System Info
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="card bg-base-100 shadow-lg">
                        <div class="card-header">
                            <h2 class="card-title">
                                <i class="fas fa-clock text-primary mr-2"></i>
                                System Information
                            </h2>
                        </div>
                        <div class="card-body">
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-base-content/70">Hostname:</span>
                                    <span class="font-medium">${server.hostname}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-base-content/70">Operating System:</span>
                                    <span class="font-medium">${server.os}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-base-content/70">Nginx Version:</span>
                                    <span class="font-medium">${server.nginx_version.trim()}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-base-content/70">Disk Free:</span>
                                    <span class="font-medium">${ApiUtils.formatFileSize(disk.free)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-base-content/70">Disk Total:</span>
                                    <span class="font-medium">${ApiUtils.formatFileSize(disk.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Uptime Info -->
                <div class="card bg-base-100 shadow-lg">
                    <div class="card-body">
                        <h2 class="card-title mb-4">
                            <i class="fas fa-clock text-primary mr-2"></i>
                            Server Uptime
                        </h2>
                        <div class="bg-base-200 rounded-lg p-4">
                            <pre class="text-sm text-base-content whitespace-pre-wrap">${server.uptime.trim()}</pre>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind dashboard events
     */
    bindEvents() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }

        // Reload nginx button
        const reloadNginxBtn = document.getElementById('reload-nginx-btn');
        if (reloadNginxBtn) {
            reloadNginxBtn.addEventListener('click', () => this.reloadNginx());
        }

        // System info modal
        const systemInfoBtn = document.getElementById('system-info-btn');
        if (systemInfoBtn) {
            systemInfoBtn.addEventListener('click', () => this.showSystemInfoModal());
        }
    }

    /**
     * Refresh dashboard data
     */
    async refresh() {
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Refreshing...';
        }

        try {
            await this.loadSystemInfo();
            await this.render();
            ApiUtils.showSuccess('Dashboard refreshed');
        } catch (error) {
            ApiUtils.handleError(error, 'refresh dashboard');
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt mr-1"></i> Refresh';
            }
        }
    }

    /**
     * Reload nginx
     */
    async reloadNginx() {
        const reloadBtn = document.getElementById('reload-nginx-btn');
        if (reloadBtn) {
            reloadBtn.disabled = true;
            reloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Reloading...';
        }

        try {
            const response = await window.api.reloadNginx();
            if (response.success) {
                ApiUtils.showSuccess('Nginx reloaded successfully');
            }
        } catch (error) {
            ApiUtils.handleError(error, 'reload nginx');
        } finally {
            if (reloadBtn) {
                reloadBtn.disabled = false;
                reloadBtn.innerHTML = '<i class="fas fa-server mr-1"></i> Reload Nginx';
            }
        }
    }

    /**
     * Show system info modal
     */
    showSystemInfoModal() {
        // This would open a modal with detailed system information
        ApiUtils.showInfo('System info modal - coming soon!');
    }

    /**
     * Start auto-refresh
     */
    startAutoRefresh() {
        // Refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadSystemInfo().catch(console.error);
        }, 5 * 60 * 1000);
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Cleanup when component is destroyed
     */
    destroy() {
        this.stopAutoRefresh();
    }
}

// Create global dashboard component instance
window.dashboardComponent = new DashboardComponent();