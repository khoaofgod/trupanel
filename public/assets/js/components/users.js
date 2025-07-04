/**
 * TruPanel System Users Component
 * Manages Linux system users
 */

class UsersComponent {
    constructor() {
        this.users = [];
        this.isLoading = false;
    }

    /**
     * Render users page
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
            // Load users data
            await this.loadUsers();
            
            // Render users content
            container.innerHTML = this.getTemplate();
            
            // Bind events
            this.bindEvents();
            
        } catch (error) {
            console.error('Users render error:', error);
            container.innerHTML = `
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Failed to load users. Please try again.</span>
                    <button class="btn btn-sm btn-outline" onclick="window.router.refresh()">
                        <i class="fas fa-refresh mr-1"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Load users data
     */
    async loadUsers() {
        try {
            this.isLoading = true;
            const response = await window.api.getSystemUsers();
            if (response.success) {
                this.users = response.data;
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Get users template
     */
    getTemplate() {
        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold text-base-content">System Users</h1>
                        <p class="text-base-content/70 mt-1">Manage Linux system users and their permissions</p>
                    </div>
                    <button class="btn btn-primary" id="add-user-btn">
                        <i class="fas fa-user-plus mr-2"></i>
                        Add User
                    </button>
                </div>

                <!-- Users List -->
                <div class="card bg-base-100 shadow-lg">
                    <div class="card-body">
                        ${this.users.length === 0 ? this.getEmptyState() : this.getUsersList()}
                    </div>
                </div>
            </div>

            <!-- Add User Modal -->
            <dialog id="add-user-modal" class="modal">
                <div class="modal-box">
                    <h3 class="font-bold text-lg mb-4">Add New System User</h3>
                    <form id="add-user-form" class="space-y-4">
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">Username *</span>
                            </label>
                            <input type="text" name="username" class="input input-bordered" 
                                   placeholder="Enter username" required pattern="[a-zA-Z0-9_-]+" 
                                   title="Only letters, numbers, underscores and hyphens allowed">
                            <div class="label">
                                <span class="label-text-alt text-base-content/70">
                                    Only letters, numbers, underscores and hyphens allowed
                                </span>
                            </div>
                        </div>
                        
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">Description</span>
                            </label>
                            <textarea name="description" class="textarea textarea-bordered" 
                                      placeholder="Optional description"></textarea>
                        </div>
                        
                        <div class="form-control">
                            <label class="label cursor-pointer">
                                <span class="label-text">Enable SSH Access</span>
                                <input type="checkbox" name="ssh_enabled" class="checkbox checkbox-primary">
                            </label>
                        </div>
                        
                        <div class="form-control">
                            <label class="label cursor-pointer">
                                <span class="label-text">Enable FTP Access</span>
                                <input type="checkbox" name="ftp_enabled" class="checkbox checkbox-primary">
                            </label>
                        </div>
                        
                        <div class="modal-action">
                            <button type="button" class="btn btn-ghost" onclick="document.getElementById('add-user-modal').close()">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary" id="submit-user-btn">
                                <i class="fas fa-user-plus mr-2"></i>
                                Create User
                            </button>
                        </div>
                    </form>
                </div>
                <form method="dialog" class="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

            <!-- Edit User Modal -->
            <dialog id="edit-user-modal" class="modal">
                <div class="modal-box">
                    <h3 class="font-bold text-lg mb-4">Edit System User</h3>
                    <form id="edit-user-form" class="space-y-4">
                        <input type="hidden" name="user_id">
                        
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">Username</span>
                            </label>
                            <input type="text" name="username" class="input input-bordered" readonly>
                            <div class="label">
                                <span class="label-text-alt text-base-content/70">
                                    Username cannot be changed after creation
                                </span>
                            </div>
                        </div>
                        
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">Description</span>
                            </label>
                            <textarea name="description" class="textarea textarea-bordered" 
                                      placeholder="Optional description"></textarea>
                        </div>
                        
                        <div class="form-control">
                            <label class="label cursor-pointer">
                                <span class="label-text">Enable SSH Access</span>
                                <input type="checkbox" name="ssh_enabled" class="checkbox checkbox-primary">
                            </label>
                        </div>
                        
                        <div class="form-control">
                            <label class="label cursor-pointer">
                                <span class="label-text">Enable FTP Access</span>
                                <input type="checkbox" name="ftp_enabled" class="checkbox checkbox-primary">
                            </label>
                        </div>
                        
                        <div class="modal-action">
                            <button type="button" class="btn btn-ghost" onclick="document.getElementById('edit-user-modal').close()">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary" id="update-user-btn">
                                <i class="fas fa-save mr-2"></i>
                                Update User
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
     * Get empty state template
     */
    getEmptyState() {
        return `
            <div class="text-center py-12">
                <div class="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-users text-4xl text-base-content/30"></i>
                </div>
                <h3 class="text-xl font-semibold text-base-content mb-2">No System Users</h3>
                <p class="text-base-content/70 mb-6">Create your first system user to get started</p>
                <button class="btn btn-primary" onclick="document.getElementById('add-user-modal').showModal()">
                    <i class="fas fa-user-plus mr-2"></i>
                    Add First User
                </button>
            </div>
        `;
    }

    /**
     * Get users list template
     */
    getUsersList() {
        return `
            <div class="overflow-x-auto">
                <table class="table table-zebra w-full">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Home Directory</th>
                            <th>SSH</th>
                            <th>FTP</th>
                            <th>Description</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.users.map(user => this.getUserRow(user)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Get user row template
     */
    getUserRow(user) {
        return `
            <tr>
                <td>
                    <div class="flex items-center gap-3">
                        <div class="avatar placeholder">
                            <div class="w-8 h-8 bg-primary text-primary-content rounded-full">
                                <span class="text-xs">${user.username.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="font-bold">${user.username}</div>
                    </div>
                </td>
                <td>
                    <code class="text-xs bg-base-200 px-2 py-1 rounded">${user.home_directory}</code>
                </td>
                <td>
                    <div class="badge ${user.ssh_enabled ? 'badge-success' : 'badge-ghost'}">
                        ${user.ssh_enabled ? 'Enabled' : 'Disabled'}
                    </div>
                </td>
                <td>
                    <div class="badge ${user.ftp_enabled ? 'badge-success' : 'badge-ghost'}">
                        ${user.ftp_enabled ? 'Enabled' : 'Disabled'}
                    </div>
                </td>
                <td>
                    <span class="text-sm text-base-content/70">
                        ${user.description || 'No description'}
                    </span>
                </td>
                <td>
                    <span class="text-sm text-base-content/70">
                        ${ApiUtils.formatRelativeTime(user.created_at)}
                    </span>
                </td>
                <td>
                    <div class="flex gap-2">
                        <button class="btn btn-ghost btn-xs" onclick="window.usersComponent.editUser(${user.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-ghost btn-xs text-error" onclick="window.usersComponent.deleteUser(${user.id}, '${user.username}')">
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
        // Add user button
        const addUserBtn = document.getElementById('add-user-btn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                document.getElementById('add-user-modal').showModal();
            });
        }

        // Add user form
        const addUserForm = document.getElementById('add-user-form');
        if (addUserForm) {
            addUserForm.addEventListener('submit', (e) => this.handleAddUser(e));
        }

        // Edit user form
        const editUserForm = document.getElementById('edit-user-form');
        if (editUserForm) {
            editUserForm.addEventListener('submit', (e) => this.handleEditUser(e));
        }
    }

    /**
     * Handle add user form submission
     */
    async handleAddUser(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = document.getElementById('submit-user-btn');
        
        // Prepare user data
        const userData = {
            username: formData.get('username'),
            description: formData.get('description') || null,
            ssh_enabled: formData.has('ssh_enabled'),
            ftp_enabled: formData.has('ftp_enabled')
        };

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating...';

        try {
            const response = await window.api.createSystemUser(userData);
            
            if (response.success) {
                ApiUtils.showSuccess('System user created successfully');
                document.getElementById('add-user-modal').close();
                form.reset();
                await this.render(); // Refresh the page
            }
        } catch (error) {
            ApiUtils.handleError(error, 'create user');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i> Create User';
        }
    }

    /**
     * Edit user
     */
    async editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const form = document.getElementById('edit-user-form');
        const modal = document.getElementById('edit-user-modal');

        // Populate form
        form.user_id.value = user.id;
        form.username.value = user.username;
        form.description.value = user.description || '';
        form.ssh_enabled.checked = user.ssh_enabled;
        form.ftp_enabled.checked = user.ftp_enabled;

        modal.showModal();
    }

    /**
     * Handle edit user form submission
     */
    async handleEditUser(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = document.getElementById('update-user-btn');
        const userId = formData.get('user_id');
        
        // Prepare user data
        const userData = {
            description: formData.get('description') || null,
            ssh_enabled: formData.has('ssh_enabled'),
            ftp_enabled: formData.has('ftp_enabled')
        };

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Updating...';

        try {
            const response = await window.api.updateSystemUser(userId, userData);
            
            if (response.success) {
                ApiUtils.showSuccess('System user updated successfully');
                document.getElementById('edit-user-modal').close();
                await this.render(); // Refresh the page
            }
        } catch (error) {
            ApiUtils.handleError(error, 'update user');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Update User';
        }
    }

    /**
     * Delete user
     */
    async deleteUser(userId, username) {
        // Show confirmation dialog
        const confirmed = confirm(`Are you sure you want to delete user "${username}"?\n\nThis will:\n- Remove the Linux system user\n- Delete the user's home directory\n- Remove all associated files\n\nThis action cannot be undone.`);
        
        if (!confirmed) return;

        try {
            const response = await window.api.deleteSystemUser(userId);
            
            if (response.success) {
                ApiUtils.showSuccess('System user deleted successfully');
                await this.render(); // Refresh the page
            }
        } catch (error) {
            ApiUtils.handleError(error, 'delete user');
        }
    }

    /**
     * Refresh users list
     */
    async refresh() {
        await this.render();
    }
}

// Create global users component instance
window.usersComponent = new UsersComponent();