# Simple Dockerfile for local development
FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --silent || true

# Copy rest of the application
COPY . .

ENV NODE_ENV=development
EXPOSE 3000

CMD ["npm", "run", "dev"]
