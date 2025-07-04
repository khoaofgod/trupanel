#!/bin/bash

#======================================================================
# TruPanel Installation Script
# Open Source Server Control Panel
# 
# Description: One-line installer for Ubuntu 22.04/24.04
# Author: khoaofgod
# License: MIT
# Repository: https://github.com/khoaofgod/trupanel
#======================================================================

set -e  # Exit on any error

# Configuration
TRUPANEL_VERSION="1.0.0"
TRUPANEL_REPO="https://github.com/khoaofgod/trupanel.git"
TRUPANEL_DIR="/var/www/trupanel"
NGINX_PORT="8889"
SSH_PORT="2214"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin12345"
ADMIN_EMAIL="admin@trupanel.local"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
LOG_FILE="/var/log/trupanel-install.log"

#======================================================================
# Utility Functions
#======================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    echo -e "$1"
}

log_info() {
    log "${BLUE}[INFO]${NC} $1"
}

log_success() {
    log "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    log "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    log "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}"
    echo "======================================================================="
    echo "  TruPanel v${TRUPANEL_VERSION} - Open Source Server Control Panel"
    echo "======================================================================="
    echo -e "${NC}"
}

print_footer() {
    echo -e "${GREEN}"
    echo "======================================================================="
    echo "  TruPanel Installation Complete!"
    echo "======================================================================="
    echo
    echo "  🌐 Control Panel: http://$(hostname -I | awk '{print $1}'):${NGINX_PORT}/app.html"
    echo "  📧 Username: ${ADMIN_USERNAME}"
    echo "  🔑 Password: ${ADMIN_PASSWORD}"
    echo "  🔒 SSH Port: ${SSH_PORT}"
    echo
    echo "  ⚠️  IMPORTANT SECURITY NOTICE:"
    echo "  - Change the default admin password immediately!"
    echo "  - Configure your firewall to allow ports 80, 443, ${NGINX_PORT}, ${SSH_PORT}"
    echo "  - Consider setting up a proper SSL certificate"
    echo
    echo "  📚 Documentation: https://github.com/khoaofgod/trupanel"
    echo "  🐛 Issues: https://github.com/khoaofgod/trupanel/issues"
    echo "======================================================================="
    echo -e "${NC}"
}

#======================================================================
# System Checks
#======================================================================

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root or with sudo privileges"
        echo "Usage: sudo bash install.sh"
        exit 1
    fi
}

check_os() {
    if [[ ! -f /etc/os-release ]]; then
        log_error "Cannot determine operating system"
        exit 1
    fi

    . /etc/os-release
    
    if [[ "$ID" != "ubuntu" ]]; then
        log_error "This installer only supports Ubuntu Linux"
        exit 1
    fi

    # Check version
    if [[ "$VERSION_ID" != "22.04" && "$VERSION_ID" != "24.04" ]]; then
        log_warning "This installer is tested on Ubuntu 22.04 and 24.04. Your version: $VERSION_ID"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    log_success "Operating System: Ubuntu $VERSION_ID"
}

check_system_resources() {
    # Check available memory (minimum 1GB)
    total_mem=$(free -m | awk '/^Mem:/{print $2}')
    if [[ $total_mem -lt 1024 ]]; then
        log_error "Insufficient memory. Minimum 1GB required, found ${total_mem}MB"
        exit 1
    fi

    # Check available disk space (minimum 10GB)
    available_space=$(df / | tail -1 | awk '{print $4}')
    available_space_gb=$((available_space / 1024 / 1024))
    if [[ $available_space_gb -lt 10 ]]; then
        log_error "Insufficient disk space. Minimum 10GB required, found ${available_space_gb}GB"
        exit 1
    fi

    log_success "System resources check passed (RAM: ${total_mem}MB, Disk: ${available_space_gb}GB)"
}

check_existing_installation() {
    if [[ -d "$TRUPANEL_DIR" ]]; then
        log_warning "TruPanel directory already exists: $TRUPANEL_DIR"
        read -p "Remove existing installation and continue? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$TRUPANEL_DIR"
            log_info "Removed existing installation"
        else
            exit 1
        fi
    fi
}

#======================================================================
# Installation Functions
#======================================================================

update_system() {
    log_info "Updating system packages..."
    export DEBIAN_FRONTEND=noninteractive
    
    apt-get update -qq >> "$LOG_FILE" 2>&1
    apt-get upgrade -y -qq >> "$LOG_FILE" 2>&1
    
    log_success "System packages updated"
}

install_dependencies() {
    log_info "Installing system dependencies..."
    
    # Essential packages
    local packages=(
        "software-properties-common"
        "apt-transport-https"
        "ca-certificates"
        "curl"
        "wget"
        "gnupg"
        "lsb-release"
        "git"
        "unzip"
        "supervisor"
        "ufw"
    )
    
    apt-get install -y "${packages[@]}" >> "$LOG_FILE" 2>&1
    
    log_success "System dependencies installed"
}

install_nginx() {
    log_info "Installing and configuring Nginx..."
    
    apt-get install -y nginx >> "$LOG_FILE" 2>&1
    
    # Enable and start nginx
    systemctl enable nginx >> "$LOG_FILE" 2>&1
    systemctl start nginx >> "$LOG_FILE" 2>&1
    
    # Create backup of default config
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
    
    log_success "Nginx installed and started"
}

install_php() {
    log_info "Installing PHP 8.3 and extensions..."
    
    # Add PHP repository
    add-apt-repository ppa:ondrej/php -y >> "$LOG_FILE" 2>&1
    apt-get update -qq >> "$LOG_FILE" 2>&1
    
    # Install PHP and extensions
    local php_packages=(
        "php8.3"
        "php8.3-fpm"
        "php8.3-cli"
        "php8.3-common"
        "php8.3-mysql"
        "php8.3-zip"
        "php8.3-gd"
        "php8.3-mbstring"
        "php8.3-curl"
        "php8.3-xml"
        "php8.3-bcmath"
        "php8.3-sqlite3"
        "php8.3-intl"
        "php8.3-tokenizer"
    )
    
    apt-get install -y "${php_packages[@]}" >> "$LOG_FILE" 2>&1
    
    # Enable and start PHP-FPM
    systemctl enable php8.3-fpm >> "$LOG_FILE" 2>&1
    systemctl start php8.3-fpm >> "$LOG_FILE" 2>&1
    
    log_success "PHP 8.3 installed and configured"
}

install_composer() {
    log_info "Installing Composer..."
    
    # Download and install Composer
    curl -sS https://getcomposer.org/installer | php >> "$LOG_FILE" 2>&1
    mv composer.phar /usr/local/bin/composer
    chmod +x /usr/local/bin/composer
    
    log_success "Composer installed"
}

install_certbot() {
    log_info "Installing Certbot for SSL certificates..."
    
    apt-get install -y certbot python3-certbot-nginx >> "$LOG_FILE" 2>&1
    
    log_success "Certbot installed"
}

install_nodejs() {
    log_info "Installing Node.js and npm..."
    
    # Install NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - >> "$LOG_FILE" 2>&1
    apt-get install -y nodejs >> "$LOG_FILE" 2>&1
    
    log_success "Node.js installed"
}

#======================================================================
# TruPanel Setup
#======================================================================

clone_trupanel() {
    log_info "Cloning TruPanel repository..."
    
    # Create web directory
    mkdir -p "$(dirname "$TRUPANEL_DIR")"
    
    # Clone repository
    git clone "$TRUPANEL_REPO" "$TRUPANEL_DIR" >> "$LOG_FILE" 2>&1
    
    # Set ownership
    chown -R www-data:www-data "$TRUPANEL_DIR"
    
    log_success "TruPanel repository cloned"
}

install_trupanel_dependencies() {
    log_info "Installing TruPanel dependencies..."
    
    cd "$TRUPANEL_DIR"
    
    # Install PHP dependencies
    sudo -u www-data composer install --no-dev --optimize-autoloader >> "$LOG_FILE" 2>&1
    
    log_success "TruPanel dependencies installed"
}

configure_trupanel() {
    log_info "Configuring TruPanel..."
    
    cd "$TRUPANEL_DIR"
    
    # Copy environment file
    cp .env.example .env
    
    # Generate application key
    sudo -u www-data php artisan key:generate >> "$LOG_FILE" 2>&1
    
    # Configure environment
    sed -i "s/APP_NAME=Laravel/APP_NAME=TruPanel/" .env
    sed -i "s/APP_ENV=local/APP_ENV=production/" .env
    sed -i "s/APP_DEBUG=true/APP_DEBUG=false/" .env
    sed -i "s|APP_URL=http://localhost|APP_URL=http://$(hostname -I | awk '{print $1}'):${NGINX_PORT}|" .env
    
    # Database configuration
    sed -i "s/DB_CONNECTION=mysql/DB_CONNECTION=sqlite/" .env
    sed -i "s|DB_DATABASE=laravel|DB_DATABASE=${TRUPANEL_DIR}/database/database.sqlite|" .env
    
    # Create SQLite database
    sudo -u www-data touch database/database.sqlite
    chmod 664 database/database.sqlite
    
    # Run migrations
    sudo -u www-data php artisan migrate --force >> "$LOG_FILE" 2>&1
    
    # Create admin user
    sudo -u www-data php artisan db:seed >> "$LOG_FILE" 2>&1
    
    # Set proper permissions
    chown -R www-data:www-data "$TRUPANEL_DIR"
    find "$TRUPANEL_DIR" -type f -exec chmod 644 {} \;
    find "$TRUPANEL_DIR" -type d -exec chmod 755 {} \;
    chmod -R 775 "$TRUPANEL_DIR/storage"
    chmod -R 775 "$TRUPANEL_DIR/bootstrap/cache"
    
    log_success "TruPanel configured"
}

configure_nginx_trupanel() {
    log_info "Configuring Nginx for TruPanel..."
    
    # Create TruPanel nginx configuration
    cat > /etc/nginx/sites-available/trupanel << EOF
server {
    listen ${NGINX_PORT};
    listen [::]:${NGINX_PORT};
    
    server_name _;
    root ${TRUPANEL_DIR}/public;
    index index.php index.html index.htm app.html;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php\$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
        
        # Security
        fastcgi_hide_header X-Powered-By;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ /(storage|bootstrap/cache) {
        deny all;
    }
    
    location ~ \.(env|log)$ {
        deny all;
    }

    # Cache static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # Enable site
    ln -sf /etc/nginx/sites-available/trupanel /etc/nginx/sites-enabled/
    
    # Test nginx configuration
    nginx -t >> "$LOG_FILE" 2>&1
    
    # Reload nginx
    systemctl reload nginx >> "$LOG_FILE" 2>&1
    
    log_success "Nginx configured for TruPanel"
}

#======================================================================
# Security Configuration
#======================================================================

configure_ssh() {
    log_info "Configuring SSH security (changing port to ${SSH_PORT})..."
    
    # Backup SSH config
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Change SSH port
    sed -i "s/#Port 22/Port ${SSH_PORT}/" /etc/ssh/sshd_config
    sed -i "s/Port 22/Port ${SSH_PORT}/" /etc/ssh/sshd_config
    
    # Disable root login
    sed -i "s/#PermitRootLogin yes/PermitRootLogin no/" /etc/ssh/sshd_config
    sed -i "s/PermitRootLogin yes/PermitRootLogin no/" /etc/ssh/sshd_config
    
    # Restart SSH service
    systemctl restart ssh >> "$LOG_FILE" 2>&1
    
    log_success "SSH configured (port changed to ${SSH_PORT})"
}

configure_firewall() {
    log_info "Configuring UFW firewall..."
    
    # Reset UFW
    ufw --force reset >> "$LOG_FILE" 2>&1
    
    # Default policies
    ufw default deny incoming >> "$LOG_FILE" 2>&1
    ufw default allow outgoing >> "$LOG_FILE" 2>&1
    
    # Allow essential services
    ufw allow ${SSH_PORT}/tcp comment 'SSH' >> "$LOG_FILE" 2>&1
    ufw allow 80/tcp comment 'HTTP' >> "$LOG_FILE" 2>&1
    ufw allow 443/tcp comment 'HTTPS' >> "$LOG_FILE" 2>&1
    ufw allow ${NGINX_PORT}/tcp comment 'TruPanel' >> "$LOG_FILE" 2>&1
    
    # Enable firewall
    ufw --force enable >> "$LOG_FILE" 2>&1
    
    log_success "Firewall configured and enabled"
}

setup_automatic_updates() {
    log_info "Setting up automatic security updates..."
    
    apt-get install -y unattended-upgrades >> "$LOG_FILE" 2>&1
    
    # Configure automatic updates for security packages only
    cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

    # Enable automatic updates
    cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF

    log_success "Automatic security updates configured"
}

#======================================================================
# Cleanup and Finalization
#======================================================================

cleanup() {
    log_info "Cleaning up installation files..."
    
    # Clean package cache
    apt-get autoremove -y >> "$LOG_FILE" 2>&1
    apt-get autoclean >> "$LOG_FILE" 2>&1
    
    # Clear bash history for security
    history -c
    
    log_success "Cleanup completed"
}

create_management_scripts() {
    log_info "Creating management scripts..."
    
    # Create trupanel command
    cat > /usr/local/bin/trupanel << 'EOF'
#!/bin/bash
# TruPanel Management Script

TRUPANEL_DIR="/var/www/trupanel"

case "$1" in
    status)
        echo "=== TruPanel Status ==="
        systemctl status nginx --no-pager -l
        systemctl status php8.3-fpm --no-pager -l
        ;;
    restart)
        echo "Restarting TruPanel services..."
        systemctl restart nginx
        systemctl restart php8.3-fpm
        echo "Services restarted"
        ;;
    update)
        echo "Updating TruPanel..."
        cd "$TRUPANEL_DIR"
        git pull origin main
        sudo -u www-data composer install --no-dev --optimize-autoloader
        sudo -u www-data php artisan migrate --force
        sudo -u www-data php artisan config:cache
        sudo -u www-data php artisan route:cache
        systemctl restart nginx
        systemctl restart php8.3-fpm
        echo "TruPanel updated"
        ;;
    logs)
        echo "=== TruPanel Logs ==="
        tail -f /var/log/nginx/error.log
        ;;
    backup)
        echo "Creating TruPanel backup..."
        backup_dir="/root/trupanel-backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$backup_dir"
        cp -r "$TRUPANEL_DIR" "$backup_dir/"
        tar -czf "${backup_dir}.tar.gz" -C "$(dirname "$backup_dir")" "$(basename "$backup_dir")"
        rm -rf "$backup_dir"
        echo "Backup created: ${backup_dir}.tar.gz"
        ;;
    *)
        echo "TruPanel Management Script"
        echo "Usage: $0 {status|restart|update|logs|backup}"
        echo ""
        echo "Commands:"
        echo "  status  - Show service status"
        echo "  restart - Restart all services"
        echo "  update  - Update TruPanel to latest version"
        echo "  logs    - Show error logs"
        echo "  backup  - Create backup"
        ;;
esac
EOF
    
    chmod +x /usr/local/bin/trupanel
    
    log_success "Management scripts created"
}

#======================================================================
# Main Installation Process
#======================================================================

main() {
    print_header
    
    # Initialize log file
    touch "$LOG_FILE"
    chmod 600 "$LOG_FILE"
    
    log_info "Starting TruPanel installation..."
    log_info "Installation log: $LOG_FILE"
    
    # System checks
    check_root
    check_os
    check_system_resources
    check_existing_installation
    
    # System installation
    update_system
    install_dependencies
    install_nginx
    install_php
    install_composer
    install_certbot
    install_nodejs
    
    # TruPanel installation
    clone_trupanel
    install_trupanel_dependencies
    configure_trupanel
    configure_nginx_trupanel
    
    # Security configuration
    configure_ssh
    configure_firewall
    setup_automatic_updates
    
    # Finalization
    create_management_scripts
    cleanup
    
    print_footer
    
    log_success "TruPanel installation completed successfully!"
}

# Trap errors
trap 'log_error "Installation failed at line $LINENO. Check $LOG_FILE for details."; exit 1' ERR

# Run main installation
main "$@"