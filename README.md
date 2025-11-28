# GrosInt Frontend Application

A modern, mobile-first Angular PWA application built with industry best practices.

## Features

- ✅ **Mobile-First PWA** - Optimized for mobile devices with PWA support
- ✅ **Multi-Language Support** - Supports English and Indian languages (Hindi, Tamil, Telugu, etc.)
- ✅ **Angular Material** - Customizable Material Design theme
- ✅ **Reactive Programming** - RxJS for async operations, Signals for state management
- ✅ **Performance Optimized** - OnPush change detection, lazy loading, virtual scrolling ready
- ✅ **Security First** - HTTP interceptors, authentication guards, input sanitization
- ✅ **SCSS Architecture** - Reusable mixins, variables, and utilities
- ✅ **TypeScript Strict Mode** - Type-safe codebase

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Angular CLI 17+

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

Navigate to `http://localhost:4200/`

### Build

```bash
# Development build
npm run build

# Production build
npm run build:prod
```

### Testing

```bash
# Unit tests
npm test

# E2E tests
npm run e2e
```

## Project Structure

```
src/
├── app/
│   ├── core/              # Core module (singletons)
│   │   ├── services/      # Global services
│   │   ├── interceptors/ # HTTP interceptors
│   │   ├── guards/        # Route guards
│   │   └── models/        # Data models
│   ├── features/          # Feature modules (lazy-loaded)
│   ├── shared/            # Shared module
│   ├── ui/                # UI component library
│   └── app.module.ts
├── assets/
│   └── i18n/              # Translation files
└── styles/                # SCSS architecture
```

## Key Technologies

- Angular 17
- Angular Material
- RxJS
- Angular Signals
- SCSS
- TypeScript
- PWA (Service Worker)

## Configuration

### Environment Variables

Edit `src/environments/environment.ts` for development and `src/environments/environment.prod.ts` for production.

### API Configuration

Update the `apiUrl` in environment files to point to your backend API.

### Theme Customization

Edit `src/styles/themes/_material-theme.scss` to customize the Angular Material theme.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT
