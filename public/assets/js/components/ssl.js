/**
 * TruPanel SSL Certificates Component
 * Manages SSL certificates and Let's Encrypt
 */

class SslComponent {
    constructor() {
        this.certificates = [];
        this.isLoading = false;
    }

    /**
     * Render SSL certificates page
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
            // Load certificates data
            await this.loadCertificates();
            
            // Render content
            container.innerHTML = this.getTemplate();
            
            // Bind events
            this.bindEvents();
            
        } catch (error) {
            console.error('SSL render error:', error);
            container.innerHTML = `
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Failed to load SSL certificates. Please try again.</span>
                    <button class="btn btn-sm btn-outline" onclick="window.router.refresh()">
                        <i class="fas fa-refresh mr-1"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Load certificates data
     */
    async loadCertificates() {
        try {
            const response = await window.api.getSslCertificates();
            if (response.success) {
                this.certificates = response.data;
            }
        } catch (error) {
            console.error('Failed to load certificates:', error);
            throw error;
        }
    }

    /**
     * Get template
     */
    getTemplate() {
        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold text-base-content">SSL Certificates</h1>
                        <p class="text-base-content/70 mt-1">Manage SSL certificates and Let's Encrypt</p>
                    </div>
                    <button class="btn btn-outline" id="refresh-certs-btn">
                        <i class="fas fa-sync-alt mr-2"></i>
                        Refresh
                    </button>
                </div>

                <!-- SSL Info Card -->
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    <div>
                        <div class="font-bold">SSL Certificate Management</div>
                        <div class="text-sm">SSL certificates are automatically managed through Let's Encrypt when enabled for virtual hosts.</div>
                    </div>
                </div>

                <!-- Certificates List -->
                <div class="card bg-base-100 shadow-lg">
                    <div class="card-body">
                        ${this.certificates.length === 0 ? this.getEmptyState() : this.getCertificatesList()}
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="card bg-base-100 shadow-lg">
                        <div class="card-body">
                            <h2 class="card-title text-primary">
                                <i class="fas fa-plus-circle mr-2"></i>
                                Enable SSL
                            </h2>
                            <p class="text-base-content/70 mb-4">
                                Enable SSL certificates for your virtual hosts to secure your websites with HTTPS.
                            </p>
                            <button class="btn btn-primary" onclick="window.router.navigate('vhosts')">
                                <i class="fas fa-globe mr-2"></i>
                                Manage Virtual Hosts
                            </button>
                        </div>
                    </div>

                    <div class="card bg-base-100 shadow-lg">
                        <div class="card-body">
                            <h2 class="card-title text-success">
                                <i class="fas fa-shield-alt mr-2"></i>
                                Auto-Renewal
                            </h2>
                            <p class="text-base-content/70 mb-4">
                                Let's Encrypt certificates are automatically renewed before expiration to keep your sites secure.
                            </p>
                            <div class="badge badge-success">
                                <i class="fas fa-check mr-1"></i>
                                Enabled
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get empty state
     */
    getEmptyState() {
        return `
            <div class="text-center py-12">
                <div class="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-shield-alt text-4xl text-base-content/30"></i>
                </div>
                <h3 class="text-xl font-semibold text-base-content mb-2">No SSL Certificates</h3>
                <p class="text-base-content/70 mb-6">SSL certificates will appear here when enabled for virtual hosts</p>
                <button class="btn btn-primary" onclick="window.router.navigate('vhosts')">
                    <i class="fas fa-globe mr-2"></i>
                    Manage Virtual Hosts
                </button>
            </div>
        `;
    }

    /**
     * Get certificates list
     */
    getCertificatesList() {
        return `
            <div class="overflow-x-auto">
                <table class="table table-zebra w-full">
                    <thead>
                        <tr>
                            <th>Domain</th>
                            <th>Issued</th>
                            <th>Expires</th>
                            <th>Auto-Renew</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.certificates.map(cert => this.getCertRow(cert)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Get certificate row
     */
    getCertRow(cert) {
        const expiresAt = new Date(cert.expires_at);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
        
        let statusBadge = 'badge-success';
        let statusText = 'Valid';
        
        if (daysUntilExpiry <= 0) {
            statusBadge = 'badge-error';
            statusText = 'Expired';
        } else if (daysUntilExpiry <= 30) {
            statusBadge = 'badge-warning';
            statusText = 'Expiring Soon';
        }

        return `
            <tr>
                <td>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-certificate text-success"></i>
                        <span class="font-bold">${cert.vhost?.domain || 'Unknown'}</span>
                    </div>
                </td>
                <td>
                    <span class="text-sm">
                        ${ApiUtils.formatDate(cert.created_at)}
                    </span>
                </td>
                <td>
                    <span class="text-sm">
                        ${ApiUtils.formatDate(cert.expires_at)}
                        <div class="text-xs text-base-content/70">
                            ${daysUntilExpiry > 0 ? `${daysUntilExpiry} days remaining` : 'Expired'}
                        </div>
                    </span>
                </td>
                <td>
                    <div class="badge ${cert.auto_renew ? 'badge-success' : 'badge-ghost'}">
                        ${cert.auto_renew ? 'Enabled' : 'Disabled'}
                    </div>
                </td>
                <td>
                    <div class="badge ${statusBadge}">
                        ${statusText}
                    </div>
                </td>
                <td>
                    <div class="flex gap-2">
                        <button class="btn btn-ghost btn-xs" 
                                onclick="window.sslComponent.viewCertificate(${cert.id})"
                                title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-ghost btn-xs text-error" 
                                onclick="window.sslComponent.deleteCertificate(${cert.id})"
                                title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Bind events
     */
    bindEvents() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-certs-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }
    }

    /**
     * View certificate details
     */
    viewCertificate(certId) {
        ApiUtils.showInfo('Certificate details modal - coming soon!');
    }

    /**
     * Delete certificate
     */
    async deleteCertificate(certId) {
        const confirmed = confirm('Are you sure you want to delete this SSL certificate?\n\nThis will disable HTTPS for the associated domain.');
        
        if (!confirmed) return;

        try {
            const response = await window.api.deleteSslCertificate(certId);
            
            if (response.success) {
                ApiUtils.showSuccess('SSL certificate deleted successfully');
                await this.render(); // Refresh the page
            }
        } catch (error) {
            ApiUtils.handleError(error, 'delete SSL certificate');
        }
    }

    /**
     * Refresh certificates list
     */
    async refresh() {
        await this.render();
    }
}

// Create global SSL component instance
window.sslComponent = new SslComponent();