/**
 * TruPanel Authentication Manager
 * Handles user authentication and session management
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
    }

    /**
     * Initialize authentication system
     */
    async init() {
        if (this.isInitialized) return;

        try {
            // Check if user has a valid token
            if (window.api.isAuthenticated()) {
                const response = await window.api.getUser();
                if (response.success) {
                    this.currentUser = response.data;
                    this.showDashboard();
                } else {
                    this.showLogin();
                }
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            this.showLogin();
        }

        this.isInitialized = true;
        this.bindEvents();
    }

    /**
     * Bind authentication events
     */
    bindEvents() {
        // Login form submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }
    }

    /**
     * Handle login form submission
     */
    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('login-btn');
        const loginSpinner = document.getElementById('login-spinner');
        const loginIcon = document.getElementById('login-icon');
        const errorDiv = document.getElementById('auth-error');
        const errorMessage = document.getElementById('auth-error-message');

        // Show loading state
        loginBtn.disabled = true;
        loginSpinner.classList.remove('hidden');
        loginIcon.classList.add('hidden');
        errorDiv.classList.add('hidden');

        try {
            const response = await window.api.login(email, password);
            
            if (response.success) {
                this.currentUser = response.data.user;
                ApiUtils.showSuccess('Login successful!');
                this.showDashboard();
            } else {
                throw new Error(response.data?.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            
            let message = 'Login failed. Please try again.';
            if (error instanceof ApiError) {
                if (error.status === 422) {
                    message = 'Invalid email or password.';
                } else if (error.isNetworkError()) {
                    message = 'Cannot connect to server. Please check your connection.';
                } else {
                    message = error.message;
                }
            }
            
            errorMessage.textContent = message;
            errorDiv.classList.remove('hidden');
        } finally {
            // Reset loading state
            loginBtn.disabled = false;
            loginSpinner.classList.add('hidden');
            loginIcon.classList.remove('hidden');
        }
    }

    /**
     * Handle logout
     */
    async handleLogout(event) {
        event.preventDefault();
        
        try {
            await window.api.logout();
            ApiUtils.showSuccess('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.logout();
        }
    }

    /**
     * Perform logout operations
     */
    logout() {
        this.currentUser = null;
        window.api.setToken(null);
        this.showLogin();
        
        // Clear any cached data
        if (window.router) {
            window.router.navigate('login');
        }
    }

    /**
     * Show login interface
     */
    showLogin() {
        const authLayout = document.getElementById('auth-layout');
        const dashboardLayout = document.getElementById('dashboard-layout');
        
        if (authLayout) authLayout.classList.remove('hidden');
        if (dashboardLayout) dashboardLayout.classList.add('hidden');
        
        // Clear form
        const form = document.getElementById('login-form');
        if (form) form.reset();
        
        // Hide any errors
        const errorDiv = document.getElementById('auth-error');
        if (errorDiv) errorDiv.classList.add('hidden');
    }

    /**
     * Show dashboard interface
     */
    showDashboard() {
        const authLayout = document.getElementById('auth-layout');
        const dashboardLayout = document.getElementById('dashboard-layout');
        
        if (authLayout) authLayout.classList.add('hidden');
        if (dashboardLayout) dashboardLayout.classList.remove('hidden');
        
        // Initialize router if not already done
        if (window.router && !window.router.isInitialized) {
            window.router.init();
        } else if (window.router) {
            // Navigate to dashboard if no route is set
            const currentPath = window.location.hash.slice(1) || 'dashboard';
            window.router.navigate(currentPath);
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.currentUser && window.api.isAuthenticated();
    }

    /**
     * Require authentication for a function
     */
    requireAuth(callback) {
        if (this.isAuthenticated()) {
            return callback();
        } else {
            this.showLogin();
            return false;
        }
    }

    /**
     * Get user display name
     */
    getUserDisplayName() {
        if (!this.currentUser) return 'Guest';
        return this.currentUser.name || this.currentUser.email || 'User';
    }

    /**
     * Check if current user has specific permission
     */
    hasPermission(permission) {
        // For now, all authenticated users have all permissions
        // This can be extended later with role-based access control
        return this.isAuthenticated();
    }

    /**
     * Update user profile
     */
    async updateProfile(userData) {
        try {
            const response = await window.api.put('/auth/user', userData);
            if (response.success) {
                this.currentUser = { ...this.currentUser, ...response.data };
                ApiUtils.showSuccess('Profile updated successfully');
                return response;
            }
        } catch (error) {
            ApiUtils.handleError(error, 'update profile');
            throw error;
        }
    }

    /**
     * Change password
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await window.api.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: newPassword
            });
            
            if (response.success) {
                ApiUtils.showSuccess('Password changed successfully');
                return response;
            }
        } catch (error) {
            ApiUtils.handleError(error, 'change password');
            throw error;
        }
    }

    /**
     * Refresh authentication token
     */
    async refreshToken() {
        try {
            const response = await window.api.refreshToken();
            if (response.success && response.data.token) {
                window.api.setToken(response.data.token);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
            return false;
        }
    }
}

// Create global auth manager instance
window.auth = new AuthManager();