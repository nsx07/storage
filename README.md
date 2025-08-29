# 🗄️ Storage API

<p align="center">
  <strong>A powerful, production-ready storage and backup API</strong>
</p>

<p align="center">
  <a href="https://railway.com/deploy/iiWiUr">
    <img src="https://railway.app/button.svg" alt="Deploy on Railway" height="32">
  </a>
</p>

<p align="center">
  <a href="https://github.com/nsx07/storage"><img src="https://img.shields.io/github/stars/nsx07/storage?style=social" alt="GitHub stars"></a>
  <a href="https://github.com/nsx07/storage/issues"><img src="https://img.shields.io/github/issues/nsx07/storage" alt="GitHub issues"></a>
  <a href="https://github.com/nsx07/storage/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nsx07/storage" alt="License"></a>
  <a href="https://railway.com/deploy/iiWiUr"><img src="https://img.shields.io/badge/Railway-Template-0B0D0E?logo=railway" alt="Railway Template"></a>
</p>

## 🚀 One-Click Deploy

This is an open-source Railway template that provides a complete storage and backup solution. Deploy instantly to Railway with zero configuration required!

## 📋 Description

A modern, scalable storage API built with NestJS that provides comprehensive file management, PostgreSQL backup capabilities, and caching solutions. Perfect for applications that need reliable file storage with automated backup functionality.

## ✨ Features

### 🗃️ File Storage Management

- **Tree Structure**: List storage in organized tree structure
- **File Operations**: Upload, rename, download, and delete files
- **Directory Management**: Create and manage directory structures
- **ZIP Compression**: Create compressed archives of directories
- **File Server**: Serve static files with optimized delivery

### 🔄 PostgreSQL Backup & Restore

- **Scheduled Backups**: Automated backups via cron jobs
- **One-time Backups**: Manual backup creation
- **Restore Operations**: Restore from backup files via API
- **Backup Management**: List, remove, and monitor backup jobs
- **Cross-platform**: Supports Linux and Windows PostgreSQL binaries

### 🚀 Caching System

- **Redis Support**: Production-ready Redis caching
- **Memory Fallback**: In-memory caching for development
- **Factory Pattern**: Dynamic cache provider selection
- **TTL Support**: Configurable cache expiration

### 🔐 Security & Authentication

- **Token-based Auth**: API authentication via middleware
- **Auto-generated Tokens**: Secure tokens generated on deployment
- **Bypass Mode**: Development-friendly bypass option
- **Request Validation**: Comprehensive input validation

### 🧪 Testing & Quality

- **Comprehensive Test Suite**: 108+ tests with 72%+ coverage
- **Unit Tests**: Isolated component testing
- **Integration Tests**: Full API endpoint testing
- **E2E Tests**: End-to-end workflow validation
- **CI/CD Ready**: Optimized for continuous integration

## 🎨 Frontend Integration

Works seamlessly with [Storagex](https://storagex.vercel.app/) - a modern web interface for managing your storage, files, folders, and backups.

## 🏗️ Template Architecture

### Services Included:

- **Storage API** (`nsx07/storage`) - Main application
- **Redis** (`bitnami/redis`) - Caching layer
- **Docker Volumes** - Persistent file storage

### Technology Stack:

- **Backend**: NestJS, TypeScript, Express
- **Database**: PostgreSQL (backup operations)
- **Cache**: Redis with Memory fallback
- **File Handling**: Multer for uploads
- **Authentication**: Custom token middleware
- **Testing**: Jest with comprehensive coverage

## 📦 Installation

### Local Development

```bash
# Clone the repository
git clone https://github.com/nsx07/storage.git
cd storage

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the application
npm run start:dev
```

### Environment Variables

```env
# Application
PORT=3000
BYPASS=false
STORAGE_TOKEN=your-secure-token

# Cache
CACHE_TYPE=redis
REDIS_URL=redis://localhost:6379

# Database (for backups)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## 🚀 Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod

# Build the application
npm run build

# Start built application
npm run start
```

## 🧪 Testing

This project includes a comprehensive test suite with excellent coverage:

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration/e2e tests
npm run test:e2e

# Generate coverage reports
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run tests for CI/CD
npm run test:ci
```

### Test Coverage

- **108+ Total Tests** across all modules
- **72%+ Statement Coverage** overall
- **100% Passing** unit and integration tests
- **E2E Tests** for complete API validation

For detailed testing documentation, see [TEST_SUITE_README.md](./TEST_SUITE_README.md).

## 📚 API Documentation

### Storage Endpoints

```bash
# File Management
GET    /api/listTree           # List directory structure
POST   /api/createDirectory    # Create new directory
DELETE /api/deleteDirectory    # Delete directory
PATCH  /api/rename            # Rename file/directory
GET    /api/downloadZip       # Download directory as ZIP
PUT    /api/log              # Write to log files
PUT    /api/updateFile       # Upload/update files

# Backup Management
POST   /api/backup           # Create backup
POST   /api/updateBackup     # Update backup configuration
POST   /api/restore          # Restore from backup
DELETE /api/removeBackup     # Remove scheduled backup
GET    /api/listBackups      # List all backups

# Authentication
GET    /api/validateToken    # Validate API token
```

### Authentication

All API requests require authentication via the `token` header:

```bash
curl -H "token: YOUR_API_TOKEN" https://your-app.railway.app/api/listTree
```

## 🔧 Configuration

### Docker Volumes

⚠️ **Important**: This template uses Docker Volumes for persistent storage. Changes to volume paths may affect file accessibility across deployments.

### Railway Deployment

When deployed on Railway:

- Auto-generates secure API tokens
- Configures Redis caching automatically
- Sets up persistent volumes for file storage
- Exposes the API on Railway's public network

## 💡 Usage Examples

### Creating a Backup

```bash
curl -X POST https://your-app.railway.app/api/backup \
  -H "token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "daily-backup",
    "folder": "production",
    "connectionString": "postgresql://user:pass@host:5432/db",
    "continuos": true,
    "schedule": "0 2 * * *"
  }'
```

### Listing Files

```bash
curl -H "token: YOUR_TOKEN" \
  https://your-app.railway.app/api/listTree
```

### Creating Directory

```bash
curl -X POST https://your-app.railway.app/api/createDirectory \
  -H "token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"path": "uploads/images"}'
```

## 🤝 Contributing

We welcome contributions! This is an open-source project maintained by the community.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation as needed
- Follow the existing code style
- Ensure all tests pass before submitting

### Reporting Issues

Found a bug? Have a feature request?
[Open an issue](https://github.com/nsx07/storage/issues) on GitHub!

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **NestJS Team** - For the amazing framework
- **Railway** - For providing the deployment platform
- **Community Contributors** - For making this project better

## 🔗 Links

- **🚀 [Deploy on Railway](https://railway.com/deploy/iiWiUr)** - One-click deployment
- **📱 [Storagex Frontend](https://storagex.vercel.app/)** - Web interface
- **🐛 [Report Issues](https://github.com/nsx07/storage/issues)** - Bug reports & features
- **💬 [Railway Discord](https://discord.gg/railway)** - Community support
- **📖 [NestJS Docs](https://docs.nestjs.com/)** - Framework documentation

## 📊 Project Stats

- **⭐ 62+ Projects** deployed from this template
- **✅ 100%** deployment success rate on Railway
- **🏗️ Production-ready** with comprehensive testing
- **🔧 Actively maintained** by the community

---

<p align="center">
  <strong>Made with ❤️ by the open-source community</strong>
  <br>
  <a href="https://railway.com/deploy/iiWiUr">Deploy your own instance today!</a>
</p>
