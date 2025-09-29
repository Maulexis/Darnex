# backend/Dockerfile

# Use the specific Node.js version your project requires (v24.x)
FROM node:24-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker's caching
COPY package*.json ./

# Install only production dependencies to keep the image small
RUN npm install --omit=dev

# Copy the rest of your application's source code
COPY . .

# Expose the port your Express server runs on
EXPOSE 8000

# The command to start your server.
# IMPORTANT: Change 'src/server.js' to your actual entry point file.
CMD ["node", "src/server.js"]