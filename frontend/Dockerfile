# Stage 1: Development - includes dev dependencies and runs the Vite dev server
FROM node:22 AS development

# Set working directory
WORKDIR /app

# Update npm to latest version and clear cache
RUN npm install -g npm@latest && \
    npm cache clean --force

# Copy package files and install dependencies
COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

# Copy source code
COPY . .

# Expose port for the Vite dev server
EXPOSE ${PORT:-3000}

# Stage 2: Builder - installs dependencies and builds the app for production
FROM node:22 AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY tsconfig.json ./

RUN npm install -g npm@latest && \
    npm cache clean --force && \
    npm install

# Copy source code and build the application
COPY . .
RUN npm run build

# Stage 3: Production - final stage with only the static build output
FROM node:22 AS production

WORKDIR /app

# Copy the build artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Declare the dist/ directory as a volume
VOLUME /app/dist

# No need to expose ports or specify CMD – this image only contains static files for Nginx
# (The Nginx container in Docker Compose will serve the files from this volume)