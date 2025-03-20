# Use Node 18 slim as the base
FROM node:18-slim

# Optional environment variables
ENV AWS_DEFAULT_REGION=us-east-2
ENV APP_ENV=dev

# Set the work directory in the container
WORKDIR /usr/src/app

# Copy only package manifests first (for Docker caching)
COPY package*.json ./

# Install dependencies
RUN npm install --include=dev

# Copy the rest of the code (including 'src', 'tsconfig.json', etc.)
COPY . .

# Expose the port your Node app runs on
EXPOSE 8000

# Default command (change if you have a different start script)
CMD ["npm", "run", "dev"]
