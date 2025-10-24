FROM node:18-bullseye-slim

# Install LibreOffice and minimal fonts required for conversion
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libreoffice \
    libreoffice-core \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install production deps
COPY package*.json ./
RUN npm ci --only=production || npm install --only=production

# Copy app source
COPY . .

# Ensure upload/out directories exist
RUN mkdir -p uploads out

EXPOSE 4000

CMD ["node", "index.js"]
