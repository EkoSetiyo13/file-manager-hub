FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Print Node.js and npm versions for debugging
RUN node --version && npm --version

# List contents of the directory
RUN ls -la

# Print package.json content
RUN cat package.json

# Attempt to build and capture the output
RUN npm run build || (echo "Build failed. Error log:" && cat /app/.next/error.log && exit 1)

EXPOSE 3000

CMD ["npm", "start"]