FROM node:20-slim

# Install system dependencies (added unzip)
RUN apt-get update && apt-get install -y \
    git \
    ffmpeg \
    webp \
    unzip \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8000

CMD ["node", "index.js"]
