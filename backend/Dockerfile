# Node.js 20 Alpine lightweight base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy backend source code
COPY . .

# Expose server port
EXPOSE 5000

# Start Express server
CMD ["node", "src/server.js"]
