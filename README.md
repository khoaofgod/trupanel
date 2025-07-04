# TruPanel - Open Source Server Control Panel

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PHP Version](https://img.shields.io/badge/PHP-8.3-blue.svg)](https://php.net)
[![Laravel](https://img.shields.io/badge/Laravel-12-red.svg)](https://laravel.com)

TruPanel is a modern, open-source server control panel built with Laravel and JavaScript. It provides a clean, intuitive interface for managing nginx virtual hosts, Let's Encrypt SSL certificates, and Linux system users on Ubuntu servers.

## 🚀 Features

- **API-First Architecture**: Complete separation between frontend and backend
- **Modern UI**: Responsive design with DaisyUI and Tailwind CSS
- **System User Management**: Create and manage Linux users with SSH/FTP access
- **Virtual Host Management**: Easy nginx configuration with automatic generation
- **SSL Certificate Management**: Automated Let's Encrypt integration
- **Security-Focused**: Built with security best practices from the ground up
- **Single-File Installation**: Deploy with one command

## 📋 Requirements

- **Operating System**: Ubuntu 22.04 or 24.04 LTS
- **Memory**: Minimum 1GB RAM
- **Storage**: Minimum 10GB available disk space
- **Network**: Internet connection for package downloads and SSL certificates
- **Access**: Root or sudo privileges

## ⚡ Quick Installation

Install TruPanel with a single command:

```bash
curl -sL https://raw.githubusercontent.com/khoaofgod/trupanel/main/install.sh | sudo bash
```

### What the installer does:

1. **System Updates**: Updates all system packages
2. **Dependencies**: Installs nginx, PHP 8.3, Composer, Certbot, Node.js
3. **TruPanel Setup**: Clones repository, installs dependencies, configures database
4. **Security**: Changes SSH port to 2214, configures firewall, enables auto-updates
5. **Web Server**: Configures nginx to serve TruPanel on port 8889

### Post-Installation

After installation, access your control panel at:
```
http://YOUR_SERVER_IP:8889/
```

**Default Credentials:**
- Username: `admin`
- Password: `admin12345`

⚠️ **IMPORTANT**: Change the default password immediately after first login!

## 🛠️ Management Commands

TruPanel includes a management script for common operations:

```bash
# Check service status
sudo trupanel status

# Restart all services
sudo trupanel restart

# Update to latest version
sudo trupanel update

# View error logs
sudo trupanel logs

# Create backup
sudo trupanel backup
```

## 📚 API Documentation

TruPanel provides a comprehensive REST API for all operations:

### Authentication
```bash
# Login
curl -X POST http://YOUR_SERVER_IP:8889/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trupanel.local","password":"admin12345"}'
```

## 🔒 Security Features

- **User Isolation**: Each virtual host runs under its own Linux user
- **Secure SSH**: SSH port changed to 2214, root login disabled
- **Firewall**: UFW configured with minimal required ports
- **SSL/TLS**: Let's Encrypt integration with auto-renewal
- **Security Headers**: Comprehensive HTTP security headers
- **Input Validation**: All user inputs validated and sanitized
- **Password Encryption**: Bcrypt hashing for all passwords

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Laravel](https://laravel.com) - The PHP framework for web artisans
- [DaisyUI](https://daisyui.com) - The most popular component library for Tailwind CSS
- [Let's Encrypt](https://letsencrypt.org) - Free SSL certificates for everyone
- [Nginx](https://nginx.org) - High-performance web server

---

**Made with ❤️ for the open source community**
