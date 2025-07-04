/**
 * TruPanel Universal API Client
 * Handles all API communication with the Laravel backend
 */

class ApiClient {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('auth_token');
        this.refreshPromise = null;
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    /**
     * Get authentication token
     */
    getToken() {
        return this.token || localStorage.getItem('auth_token');
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Universal request method
     */
    async request(method, endpoint, data = null, options = {}) {
        const config = {
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...options.headers
            }
        };

        // Add authentication token
        const token = this.getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Add request body for non-GET requests
        if (data && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method)) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
            // Handle different response types
            let responseData;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            // Handle successful responses
            if (response.ok) {
                return {
                    success: true,
                    data: responseData,
                    status: response.status,
                    headers: response.headers
                };
            }

            // Handle authentication errors
            if (response.status === 401) {
                this.handleAuthError();
                throw new ApiError(401, { message: 'Authentication required' });
            }

            // Handle other errors
            throw new ApiError(response.status, responseData);

        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            
            // Handle network errors
            throw new ApiError(0, { 
                message: 'Network error or server unreachable',
                error: error.message 
            });
        }
    }

    /**
     * Handle authentication errors
     */
    handleAuthError() {
        this.setToken(null);
        if (window.auth) {
            window.auth.logout();
        }
    }

    /**
     * Convenience methods
     */
    async get(endpoint, options = {}) {
        return this.request('GET', endpoint, null, options);
    }

    async post(endpoint, data, options = {}) {
        return this.request('POST', endpoint, data, options);
    }

    async put(endpoint, data, options = {}) {
        return this.request('PUT', endpoint, data, options);
    }

    async patch(endpoint, data, options = {}) {
        return this.request('PATCH', endpoint, data, options);
    }

    async delete(endpoint, options = {}) {
        return this.request('DELETE', endpoint, null, options);
    }

    /**
     * Authentication specific methods
     */
    async login(email, password) {
        const response = await this.post('/auth/login', { email, password });
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    async logout() {
        try {
            await this.post('/auth/logout');
        } catch (error) {
            // Ignore logout errors - token might already be invalid
        } finally {
            this.setToken(null);
        }
    }

    async getUser() {
        return this.get('/auth/user');
    }

    async refreshToken() {
        return this.post('/auth/refresh');
    }

    /**
     * System Users API
     */
    async getSystemUsers() {
        return this.get('/system-users');
    }

    async createSystemUser(userData) {
        return this.post('/system-users', userData);
    }

    async updateSystemUser(id, userData) {
        return this.put(`/system-users/${id}`, userData);
    }

    async deleteSystemUser(id) {
        return this.delete(`/system-users/${id}`);
    }

    async getSystemUser(id) {
        return this.get(`/system-users/${id}`);
    }

    /**
     * Virtual Hosts API
     */
    async getVhosts() {
        return this.get('/vhosts');
    }

    async createVhost(vhostData) {
        return this.post('/vhosts', vhostData);
    }

    async updateVhost(id, vhostData) {
        return this.put(`/vhosts/${id}`, vhostData);
    }

    async deleteVhost(id) {
        return this.delete(`/vhosts/${id}`);
    }

    async getVhost(id) {
        return this.get(`/vhosts/${id}`);
    }

    async enableSsl(id, email) {
        return this.post(`/vhosts/${id}/ssl`, { email });
    }

    /**
     * SSL Certificates API
     */
    async getSslCertificates() {
        return this.get('/ssl-certificates');
    }

    async getSslCertificate(id) {
        return this.get(`/ssl-certificates/${id}`);
    }

    async deleteSslCertificate(id) {
        return this.delete(`/ssl-certificates/${id}`);
    }

    /**
     * System Information API
     */
    async getSystemInfo() {
        return this.get('/system/info');
    }

    async reloadNginx() {
        return this.post('/nginx/reload');
    }

    /**
     * Health check
     */
    async healthCheck() {
        return this.get('/health');
    }
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
    constructor(status, data) {
        const message = data?.message || data?.error || `API Error: ${status}`;
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
        this.errors = data?.errors || {};
    }

    /**
     * Get validation errors for a specific field
     */
    getFieldErrors(field) {
        return this.errors[field] || [];
    }

    /**
     * Check if error is a validation error
     */
    isValidationError() {
        return this.status === 422;
    }

    /**
     * Check if error is an authentication error
     */
    isAuthError() {
        return this.status === 401;
    }

    /**
     * Check if error is a network error
     */
    isNetworkError() {
        return this.status === 0;
    }
}

/**
 * Utility functions for API responses
 */
const ApiUtils = {
    /**
     * Show success toast
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    },

    /**
     * Show error toast
     */
    showError(message) {
        this.showToast(message, 'error');
    },

    /**
     * Show info toast
     */
    showInfo(message) {
        this.showToast(message, 'info');
    },

    /**
     * Show warning toast
     */
    showWarning(message) {
        this.showToast(message, 'warning');
    },

    /**
     * Generic toast function
     */
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.className = `alert alert-${type} mb-2`;
        toast.innerHTML = `
            <i class="${icons[type]}"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    },

    /**
     * Handle API errors gracefully
     */
    handleError(error, context = '') {
        console.error(`API Error in ${context}:`, error);

        let message = 'An unexpected error occurred';
        
        if (error instanceof ApiError) {
            if (error.isNetworkError()) {
                message = 'Cannot connect to server. Please check your connection.';
            } else if (error.isAuthError()) {
                message = 'Your session has expired. Please log in again.';
            } else if (error.isValidationError()) {
                message = 'Please check your input and try again.';
            } else {
                message = error.message;
            }
        }

        this.showError(message);
        return message;
    },

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Format date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },

    /**
     * Format relative time
     */
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 30) return `${diffDays} days ago`;
        return this.formatDate(dateString);
    }
};

// Create global API client instance
window.api = new ApiClient();
window.ApiError = ApiError;
window.ApiUtils = ApiUtils;