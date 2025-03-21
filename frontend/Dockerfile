# Stage 1: Development - includes dev dependencies and runs the Vite dev server
FROM node:22 AS development

# Set working directory
WORKDIR /app

# Copy package files and install dependencies (cached if unchanged)
COPY package*.json ./
RUN npm install

# Copy all source code into the image
COPY . .

# Expose port 3000 for the Vite dev server
EXPOSE 3000

# Start the development server (Vite) by default
CMD ["npm", "run", "dev"]

# Stage 2: Builder - installs dependencies and builds the app for production
FROM node:22 AS builder

WORKDIR /app

# Copy package files and install dependencies (leverages cache layers)
COPY package*.json ./
RUN npm install  # Install all dependencies (including those needed to build)

# Copy source code and build the application
COPY . .
RUN npm run build  # Generates static files in /app/dist

# Stage 3: Production - final stage with only the static build output
FROM node:22-slim AS production

WORKDIR /app

# Copy the build artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# (Optional) If any configuration files or assets are needed in production, copy them as well
# COPY --from=builder /app/package.json ./  (for example, if needed for documentation)

# Declare the dist/ directory as a volume to share with a web server container (e.g., Nginx)
VOLUME /app/dist

# No need to expose ports or specify CMD – this image only contains static files for Nginx
# (The Nginx container in Docker Compose will serve the files from this volume)