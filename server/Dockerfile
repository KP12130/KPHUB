FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the server code
COPY . .

# Expose the port the app runs on (Cloud Run uses PORT env var)
EXPOSE 8080

# Use the PORT environment variable if available
CMD ["node", "server.js"]
