# Use Node.js 20 LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including tsx in production)
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variable for Railway
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["npm", "start"]