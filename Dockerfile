# Step 1: Use lightweight Node.js official image (Alpine Linux)
FROM node:18-alpine

# Step 2: Install required system packages for bot and media processing (Git, FFmpeg, Webp, Python)
RUN apk add --no-cache \
    git \
    ffmpeg \
    webp \
    build-base \
    python3

# Step 3: Set working directory inside the container
WORKDIR /app

# Step 4: Copy package files first to optimize caching for dependency installation
COPY package*.json ./

# Step 5: Install npm dependencies
RUN npm install

# Step 6: Copy all remaining project files into the container
COPY . .

# Step 7: Expose port for Koyeb Express server
EXPOSE 8000

# Step 8: Define the command to start the application
CMD ["node", "index.js"]
