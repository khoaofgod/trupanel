# TruPanel - Open Source Server Control Panel

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PHP Version](https://img.shields.io/badge/PHP-8.3-blue.svg)](https://www.php.net)
[![Laravel](https://img.shields.io/badge/Laravel-10.x-red.svg)](https://laravel.com)

TruPanel is a modern, open-source server control panel for Ubuntu that simplifies the management of web hosting environments. Built with an API-first architecture, it provides a clean separation between backend and frontend, making it easy to extend and customize.

## 🚀 Features

- **User Management**: Create and manage Linux system users with SSH access control
- **Virtual Host Management**: Easy nginx configuration with per-user isolation
- **SSL Certificates**: Automated Let's Encrypt integration
- **API-First Architecture**: RESTful API with token authentication
- **Modern UI**: Responsive design with DaisyUI components
- **Security Focused**: Encrypted passwords, user isolation, and secure defaults

## 📋 Requirements

- Ubuntu 22.04 or 24.04 LTS
- Root access
- Minimum 1GB RAM
- 10GB available disk space
- Domain name (for SSL certificates)

## 🔧 Quick Installation

```bash
curl -sL https://raw.githubusercontent.com/khoaofgod/trupanel/main/install.sh | sudo bash
```

After installation:
- Access URL: `http://your-server-ip:8889`
- Default login: `admin` / `admin12345`
- **⚠️ Change the default password immediately!**

## 🏗️ Architecture

TruPanel follows a strict API-first architecture:

- **Backend**: Laravel 10.x REST API
- **Frontend**: Vanilla JavaScript SPA
- **Database**: SQLite with encrypted passwords
- **Web Server**: Nginx with PHP-FPM 8.3
- **SSL**: Let's Encrypt with auto-renewal

## 🔒 Security

TruPanel is designed with security in mind:

- All passwords are bcrypt encrypted
- Each virtual host runs under its own Linux user
- Automatic firewall configuration
- Rate limiting on API endpoints
- CSRF and XSS protection

## 📖 Documentation

- [Installation Guide](docs/installation.md)
- [API Documentation](docs/api.md)
- [Security Best Practices](SECURITY.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/khoaofgod/trupanel.git
cd trupanel

# Install dependencies
composer install
npm install

# Set up environment
cp .env.example .env
php artisan key:generate

# Run development servers
php artisan serve --port=8889
npm run dev
```

## 🐛 Bug Reports

Found a bug? Please open an issue on our [GitHub Issues](https://github.com/khoaofgod/trupanel/issues) page.

For security vulnerabilities, please email khoaofgod@gmail.com directly.

## 📄 License

TruPanel is open-source software licensed under the [MIT license](LICENSE).

## 🙏 Acknowledgments

Built with:
- [Laravel](https://laravel.com)
- [DaisyUI](https://daisyui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Let's Encrypt](https://letsencrypt.org)

---

Made with ❤️ by [khoaofgod](https://github.com/khoaofgod)