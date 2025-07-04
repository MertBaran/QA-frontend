# QA Platform Frontend

A modern Question & Answer platform built with React, Redux, and comprehensive error handling. Features user authentication, question management, and real-time interactions.

## 🚀 Features

- **User Authentication** - Secure login/register with JWT tokens
- **Question Management** - Ask, view, like/unlike questions
- **Answer System** - Provide and manage answers
- **Advanced Error Handling** - Sentry integration with retry mechanisms
- **Form Validation** - Real-time validation with Yup schemas
- **Responsive Design** - Mobile-first approach with modern UI
- **Loading States** - Skeleton screens and loading indicators
- **Lazy Loading** - Code splitting for better performance

## 🛠️ Quick Start

### Prerequisites

- Node.js (v16+)
- Backend API running

### Installation

```bash
# Clone the repository
git clone https://github.com/MertBaran/QA-frontend.git
cd QA-frontend

# Install dependencies
npm install

# Setup environment
cp env.example .env
# Edit .env with your configuration

# Start development server
npm start
```

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## 🌍 Environment Variables

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api

# Sentry Configuration
REACT_APP_SENTRY_DSN=YOUR_SENTRY_DSN_HERE

# App Configuration
REACT_APP_NAME=QA Platform
REACT_APP_VERSION=1.0.0
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── config/             # Configuration files
├── pages/              # Page components (auth, questions, user)
├── routes/             # Routing configuration
├── services/           # API services
├── store/              # Redux store (auth, questions, theme)
├── utils/              # Utilities (error handling, validation)
└── App.js              # Main application component
```

## 🔒 Error Handling

- **Error Boundaries** - Graceful error handling with fallback UI
- **Retry Mechanisms** - Automatic retry for failed API calls
- **User-Friendly Messages** - Clear error messages with recovery options
- **Sentry Integration** - Real-time error tracking and monitoring

## 🎨 UI/UX

- **Modern Design** - Clean, intuitive interface
- **Responsive** - Works on all devices
- **Loading States** - Skeleton screens and loading indicators
- **Interactive Elements** - Like/unlike, real-time updates

## 🚀 Deployment

### Docker

```bash
docker-compose up --build
```

### Production

```bash
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a Pull Request

## 📄 License

MIT License

## 🔗 Related

- **Backend**: [QA API](https://github.com/MertBaran/qa-api)
- **Monitoring**: Sentry for error tracking
