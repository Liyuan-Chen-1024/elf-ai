# Use Node.js 20 slim image
FROM node:20-slim as base

# Set environment variables
ENV NODE_ENV=development \
    PORT=3000

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Development stage
FROM base as development
# Install dependencies with proper permissions
RUN npm install --legacy-peer-deps && \
    # Fix permissions for node_modules
    mkdir -p /app/node_modules/.cache && \
    chmod -R 777 /app/node_modules

# Copy application code
COPY . .

# Start development server
CMD ["npm", "run", "dev"]

# Production stage
FROM base as production
RUN npm ci --only=production --legacy-peer-deps
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
