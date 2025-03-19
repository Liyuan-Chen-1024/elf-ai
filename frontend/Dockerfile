# Use Node.js LTS
FROM node:20.17.0-slim as base

# Set environment variables
ENV NODE_ENV=development \
    PORT=3000

# Set working directory
WORKDIR /app

# Development stage
FROM base as development

# Create and set permissions for node_modules
RUN mkdir -p /app/node_modules && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Copy package files
COPY --chown=node:node package*.json ./

# Install ALL dependencies, including devDependencies
RUN npm install

# Copy application code
COPY --chown=node:node . .

# Start development server
CMD ["npm", "run", "dev"]

# Production stage
FROM base as production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the application
RUN npm run build

CMD ["npm", "run", "preview"]

# Nginx stage
FROM nginx:alpine as nginx

COPY --from=production /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
