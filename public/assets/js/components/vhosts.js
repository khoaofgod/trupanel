/**
 * TruPanel Virtual Hosts Component
 * Manages nginx virtual hosts
 */

class VhostsComponent {
    constructor() {
        this.vhosts = [];
        this.systemUsers = [];
        this.isLoading = false;
    }

    /**
     * Render virtual hosts page
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
            // Load data
            await Promise.all([
                this.loadVhosts(),
                this.loadSystemUsers()
            ]);
            
            // Render content
            container.innerHTML = this.getTemplate();
            
            // Bind events
            this.bindEvents();
            
        } catch (error) {
            console.error('Vhosts render error:', error);
            container.innerHTML = `
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Failed to load virtual hosts. Please try again.</span>
                    <button class="btn btn-sm btn-outline" onclick="window.router.refresh()">
                        <i class="fas fa-refresh mr-1"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Load virtual hosts data
     */
    async loadVhosts() {
        try {
            const response = await window.api.getVhosts();
            if (response.success) {
                this.vhosts = response.data;
            }
        } catch (error) {
            console.error('Failed to load vhosts:', error);
            throw error;
        }
    }

    /**
     * Load system users data
     */
    async loadSystemUsers() {
        try {
            const response = await window.api.getSystemUsers();
            if (response.success) {
                this.systemUsers = response.data;
            }
        } catch (error) {
            console.error('Failed to load system users:', error);
            // Don't throw - this is not critical for display
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
                        <h1 class="text-3xl font-bold text-base-content">Virtual Hosts</h1>
                        <p class="text-base-content/70 mt-1">Manage nginx virtual hosts and domains</p>
                    </div>
                    <button class="btn btn-primary" id="add-vhost-btn" ${this.systemUsers.length === 0 ? 'disabled' : ''}>
                        <i class="fas fa-globe mr-2"></i>
                        Add Virtual Host
                    </button>
                </div>

                ${this.systemUsers.length === 0 ? this.getNoUsersWarning() : ''}

                <!-- Virtual Hosts List -->
                <div class="card bg-base-100 shadow-lg">
                    <div class="card-body">
                        ${this.vhosts.length === 0 ? this.getEmptyState() : this.getVhostsList()}
                    </div>
                </div>
            </div>

            <!-- Add Vhost Modal -->
            <dialog id="add-vhost-modal" class="modal">
                <div class="modal-box w-11/12 max-w-2xl">
                    <h3 class="font-bold text-lg mb-4">Add New Virtual Host</h3>
                    <form id="add-vhost-form" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Domain Name *</span>
                                </label>
                                <input type="text" name="domain" class="input input-bordered" 
                                       placeholder="example.com" required
                                       pattern="^[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
                                       title="Please enter a valid domain name">
                            </div>
                            
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">System User *</span>
                                </label>
                                <select name="system_user_id" class="select select-bordered" required>
                                    <option value="">Select user...</option>
                                    ${this.systemUsers.map(user => 
                                        `<option value="${user.id}">${user.username}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">Document Root</span>
                            </label>
                            <input type="text" name="document_root" class="input input-bordered" 
                                   placeholder="Leave empty for default (/home/user/public_html)">
                            <div class="label">
                                <span class="label-text-alt text-base-content/70">
                                    Default: /home/username/public_html
                                </span>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">PHP Version</span>
                                </label>
                                <select name="php_version" class="select select-bordered">
                                    <option value="8.3">PHP 8.3</option>
                                    <option value="8.2">PHP 8.2</option>
                                    <option value="8.1">PHP 8.1</option>
                                </select>
                            </div>
                            
                            <div class="form-control">
                                <label class="label cursor-pointer">
                                    <span class="label-text">Enable SSL (Let's Encrypt)</span>
                                    <input type="checkbox" name="ssl_enabled" class="checkbox checkbox-primary">
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">Custom Nginx Configuration</span>
                            </label>
                            <textarea name="custom_config" class="textarea textarea-bordered h-24" 
                                      placeholder="Additional nginx directives (optional)"></textarea>
                        </div>
                        
                        <div class="modal-action">
                            <button type="button" class="btn btn-ghost" onclick="document.getElementById('add-vhost-modal').close()">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary" id="submit-vhost-btn">
                                <i class="fas fa-globe mr-2"></i>
                                Create Virtual Host
                            </button>
                        </div>
                    </form>
                </div>
                <form method="dialog" class="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        `;
    }

    /**
     * Get no users warning
     */
    getNoUsersWarning() {
        return `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <span>You need to create at least one system user before adding virtual hosts.</span>
                <button class="btn btn-sm btn-outline" onclick="window.router.navigate('users')">
                    Create User
                </button>
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
                    <i class="fas fa-globe text-4xl text-base-content/30"></i>
                </div>
                <h3 class="text-xl font-semibold text-base-content mb-2">No Virtual Hosts</h3>
                <p class="text-base-content/70 mb-6">Create your first virtual host to get started</p>
                ${this.systemUsers.length > 0 ? `
                    <button class="btn btn-primary" onclick="document.getElementById('add-vhost-modal').showModal()">
                        <i class="fas fa-globe mr-2"></i>
                        Add First Virtual Host
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Get virtual hosts list
     */
    getVhostsList() {
        return `
            <div class="overflow-x-auto">
                <table class="table table-zebra w-full">
                    <thead>
                        <tr>
                            <th>Domain</th>
                            <th>User</th>
                            <th>PHP Version</th>
                            <th>SSL</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.vhosts.map(vhost => this.getVhostRow(vhost)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Get virtual host row
     */
    getVhostRow(vhost) {
        const statusColors = {
            active: 'badge-success',
            inactive: 'badge-error', 
            maintenance: 'badge-warning'
        };

        return `
            <tr>
                <td>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-globe text-primary"></i>
                        <div>
                            <div class="font-bold">${vhost.domain}</div>
                            <div class="text-xs text-base-content/70">
                                ${vhost.document_root}
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="badge badge-outline">
                        ${vhost.system_user?.username || 'Unknown'}
                    </div>
                </td>
                <td>
                    <div class="badge badge-ghost">
                        PHP ${vhost.php_version}
                    </div>
                </td>
                <td>
                    ${vhost.ssl_enabled ? `
                        <div class="badge badge-success gap-1">
                            <i class="fas fa-shield-alt"></i>
                            SSL
                        </div>
                    ` : `
                        <div class="badge badge-ghost gap-1">
                            <i class="fas fa-shield-alt"></i>
                            No SSL
                        </div>
                    `}
                </td>
                <td>
                    <div class="badge ${statusColors[vhost.status] || 'badge-ghost'}">
                        ${vhost.status}
                    </div>
                </td>
                <td>
                    <span class="text-sm text-base-content/70">
                        ${ApiUtils.formatRelativeTime(vhost.created_at)}
                    </span>
                </td>
                <td>
                    <div class="flex gap-2">
                        ${!vhost.ssl_enabled ? `
                            <button class="btn btn-ghost btn-xs text-success" 
                                    onclick="window.vhostsComponent.enableSsl(${vhost.id}, '${vhost.domain}')"
                                    title="Enable SSL">
                                <i class="fas fa-shield-alt"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-ghost btn-xs" 
                                onclick="window.vhostsComponent.editVhost(${vhost.id})"
                                title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-ghost btn-xs text-error" 
                                onclick="window.vhostsComponent.deleteVhost(${vhost.id}, '${vhost.domain}')"
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
        // Add vhost button
        const addVhostBtn = document.getElementById('add-vhost-btn');
        if (addVhostBtn) {
            addVhostBtn.addEventListener('click', () => {
                document.getElementById('add-vhost-modal').showModal();
            });
        }

        // Add vhost form
        const addVhostForm = document.getElementById('add-vhost-form');
        if (addVhostForm) {
            addVhostForm.addEventListener('submit', (e) => this.handleAddVhost(e));
        }
    }

    /**
     * Handle add vhost form submission
     */
    async handleAddVhost(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = document.getElementById('submit-vhost-btn');
        
        // Prepare vhost data
        const vhostData = {
            domain: formData.get('domain'),
            system_user_id: parseInt(formData.get('system_user_id')),
            document_root: formData.get('document_root') || null,
            php_version: formData.get('php_version'),
            ssl_enabled: formData.has('ssl_enabled'),
            custom_config: formData.get('custom_config') || null
        };

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating...';

        try {
            const response = await window.api.createVhost(vhostData);
            
            if (response.success) {
                ApiUtils.showSuccess('Virtual host created successfully');
                document.getElementById('add-vhost-modal').close();
                form.reset();
                await this.render(); // Refresh the page
            }
        } catch (error) {
            ApiUtils.handleError(error, 'create virtual host');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-globe mr-2"></i> Create Virtual Host';
        }
    }

    /**
     * Enable SSL for virtual host
     */
    async enableSsl(vhostId, domain) {
        const email = prompt(`Enter email address for Let's Encrypt certificate for ${domain}:`);
        if (!email) return;

        try {
            const response = await window.api.enableSsl(vhostId, email);
            
            if (response.success) {
                ApiUtils.showSuccess('SSL certificate enabled successfully');
                await this.render(); // Refresh the page
            }
        } catch (error) {
            ApiUtils.handleError(error, 'enable SSL');
        }
    }

    /**
     * Edit virtual host
     */
    editVhost(vhostId) {
        ApiUtils.showInfo('Edit virtual host functionality - coming soon!');
    }

    /**
     * Delete virtual host
     */
    async deleteVhost(vhostId, domain) {
        const confirmed = confirm(`Are you sure you want to delete virtual host "${domain}"?\n\nThis will:\n- Remove the nginx configuration\n- Disable the site\n- NOT delete the document root files\n\nThis action cannot be undone.`);
        
        if (!confirmed) return;

        try {
            const response = await window.api.deleteVhost(vhostId);
            
            if (response.success) {
                ApiUtils.showSuccess('Virtual host deleted successfully');
                await this.render(); // Refresh the page
            }
        } catch (error) {
            ApiUtils.handleError(error, 'delete virtual host');
        }
    }
}

// Create global vhosts component instance
window.vhostsComponent = new VhostsComponent();