# elfai Media Frontend

This is the frontend application for elfai Media, built with React, TypeScript, and Material-UI.

## Features

- Browse and manage TV shows
- Browse and manage movies
- Configure media directories
- Modern, responsive UI with dark mode support

## Development

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Docker and Docker Compose (for containerized development)

### Installation

#### Option 1: Local Development

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at http://localhost:5173.

#### Option 2: Docker Development (Recommended)

1. Start the development server using Docker:
```bash
make dev
# or
docker-compose up
```

The application will be available at http://localhost:3001.

2. Other useful Docker commands:
```bash
# Install dependencies
make install

# Run tests
make test

# Format code
make format

# Clean up
make clean
```

### Building for Production

To create a production build:

```bash
# Local build
npm run build
# or
yarn build

# Docker build
make build
```

The build output will be in the `dist` directory.

### Linting

To run the linter:

```bash
npm run lint
# or
yarn lint
```

## Project Structure

- `src/` - Source code
  - `components/` - Reusable React components
  - `pages/` - Page components
  - `features/` - Feature-specific components and logic
    - `auth/` - Authentication related components
    - `chat/` - Chat interface components
  - `theme/` - Material-UI theme configuration
  - `styles/` - Global styles
  - `main.tsx` - Application entry point

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 