# QA Platform Frontend

Modern React-based Q&A platform with comprehensive error handling, validation, and monitoring.

## 🚀 Features

- **Modern React Architecture** - Hooks, Redux Toolkit, React Router
- **Material UI Design** - Beautiful, responsive UI components
- **Comprehensive Error Handling** - Sentry integration with modular error handlers
- **Form Validation** - Yup schemas with custom validation hooks
- **State Management** - Redux Toolkit with async thunks
- **Routing** - Feature-based routing with protected routes
- **Environment Configuration** - Centralized config management

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components (Header, Footer)
│   ├── ui/             # Generic UI components
│   └── error/          # Error handling components
├── config/             # Configuration files
│   ├── environment.js  # Environment variables
│   ├── sentry.js       # Sentry configuration
│   └── index.js        # Config exports
├── hooks/              # Custom React hooks
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── question/       # Question-related pages
│   └── user/           # User-related pages
├── routes/             # Routing configuration
│   ├── config/         # Route definitions
│   ├── AppRoutes.js    # Main routing logic
│   ├── ProtectedRoute.js
│   └── PublicRoute.js
├── services/           # API services
├── store/              # Redux store
│   ├── slices/         # Redux slices
│   ├── hooks.js        # Redux hooks
│   └── index.js        # Store configuration
├── theme/              # Material UI theme
├── utils/              # Utility functions
│   └── errorHandling/  # Error handling utilities
└── validation/         # Validation schemas
```

## 🛠️ Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd qa-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm start
   ```

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run build:prod` - Build with production environment
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run analyze` - Analyze bundle size
- `npm run validate` - Run all validations

## 🌍 Environment Variables

Create a `.env` file based on `env.example`:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Sentry Configuration
REACT_APP_SENTRY_DSN=YOUR_SENTRY_DSN_HERE

# App Configuration
REACT_APP_NAME=QA Platform
REACT_APP_VERSION=1.0.0

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEBUG_MODE=true
```

## 🔒 Error Handling

The project includes comprehensive error handling:

### Error Types
- **API Errors** - Network and server errors
- **Validation Errors** - Form validation issues
- **Component Errors** - React component crashes
- **Redux Errors** - State management issues
- **Network Errors** - Connection problems
- **User Action Errors** - User interaction issues

### Error Boundary
- Catches React component errors
- Provides user-friendly error UI
- Integrates with Sentry for monitoring

## 📊 Monitoring

### Sentry Integration
- Real-time error tracking
- Performance monitoring
- User context tracking
- Environment-specific configuration

### Development vs Production
- **Development**: Console logging, no Sentry sending
- **Production**: Full Sentry integration with real-time monitoring

## 🎨 UI/UX

### Material UI
- Consistent design system
- Responsive components
- Accessibility features
- Custom theme configuration

### Components
- Reusable UI components
- Layout components (Header, Footer)
- Form components with validation
- Error and loading states

## 🔐 Authentication

### Features
- Login/Register forms
- Protected routes
- Token-based authentication
- User context management

### Route Protection
- Public routes (login, register)
- Protected routes (dashboard, profile)
- Automatic redirects

## 📝 Validation

### Yup Schemas
- Form validation rules
- Custom error messages
- Cross-field validation
- Async validation support

### Custom Hooks
- `useFormValidation` - Form validation hook
- Real-time validation
- Error state management

## 🚀 Deployment

### Build Process
```bash
npm run build:prod
```

### Environment Setup
- Set production environment variables
- Configure Sentry DSN
- Set API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run validations: `npm run validate`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review error logs in Sentry
