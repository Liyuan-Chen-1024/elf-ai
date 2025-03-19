# Use Node.js LTS
FROM node:20.17.0-slim as base

# Set environment variables
ENV NODE_ENV=development \
    PORT=3000

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM node:20.17.0-slim as development

RUN mkdir -p /app/node_modules && \
    chmod -R 777 /app/node_modules

# Install ALL dependencies, including devDependencies
RUN npm install

# Copy application code
COPY . .

# Start development server
CMD ["npm", "run", "dev"]

# Production stage
FROM node:20.17.0-slim as production

WORKDIR /app

# Install production dependencies only
RUN npm ci --only=production

COPY . .

RUN npm run build

CMD ["npm", "run", "preview"]

FROM nginx:alpine as nginx

COPY --from=production /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
