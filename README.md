# QA Platform Frontend

### Prerequisites

- Node.js 16+
- Backend API running

### Installation

```bash
# Clone repository
git clone https://github.com/MertBaran/QA-frontend.git && cd QA-frontend

# Install dependencies
npm install

# Environment setup
cp env.example .env
# Edit .env with your configuration

# Start development server
npm start
```

### Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t qa-frontend .
docker run -p 3000:3000 --env-file .env qa-frontend
```

## Available Scripts

```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
```

## Environment Variables

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api

# Sentry Configuration
REACT_APP_SENTRY_DSN=YOUR_SENTRY_DSN_HERE

# App Configuration
REACT_APP_NAME=QA Platform
REACT_APP_VERSION=1.0.0
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── error/          # Error handling components
│   ├── layout/         # Layout components
│   └── ui/             # UI components
├── config/             # Configuration files
├── pages/              # Page components
│   ├── admin/          # Admin pages
│   ├── auth/           # Auth pages
│   ├── question/       # Question pages
│   └── user/           # User pages
├── routes/             # Routing configuration
├── services/           # API services
├── store/              # Redux store
│   ├── auth/           # Auth state
│   ├── bookmarks/      # Bookmarks state
│   ├── confirm/        # Confirm dialog state
│   ├── language/       # Language state
│   ├── questions/      # Questions state
│   └── theme/          # Theme state
├── types/              # TypeScript types
├── utils/              # Utilities
│   ├── i18n/           # Internationalization
│   ├── validation/     # Form validation
│   └── errorHandling/  # Error handling
└── App.tsx             # Main application component
```

## Tech Stack

- React 18
- Redux Toolkit
- Material-UI
- TypeScript
- Axios
- Yup
- React Router DOM
- Sentry

<div align="center">

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Redux](https://img.shields.io/badge/redux-%23593d88.svg?style=for-the-badge&logo=redux&logoColor=white)
![Material-UI](https://img.shields.io/badge/material--ui-%230081CB.svg?style=for-the-badge&logo=material-ui&logoColor=white)
![Webpack](https://img.shields.io/badge/webpack-%238DD6F9.svg?style=for-the-badge&logo=webpack&logoColor=black)
![Sentry](https://img.shields.io/badge/sentry-0dccd4?style=for-the-badge&logo=sentry&logoColor=white)

</div>

## Contributing

## License

MIT License

## Related

- Backend: [QA API](https://github.com/MertBaran/QA-API)
