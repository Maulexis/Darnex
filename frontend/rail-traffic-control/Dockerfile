# frontend/Dockerfile

# --- Stage 1: Build the React App ---
# Use an official Node.js image as the builder environment
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to use Docker's layer caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application for production
RUN npm run build

# --- Stage 2: Serve the App with Nginx ---
# Use a lightweight Nginx web server image
FROM nginx:1.25-alpine

# Copy the final built files from the 'builder' stage to Nginx's web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Tell Docker that the container listens on port 80
EXPOSE 80

# The default command to start the Nginx server
CMD ["nginx", "-g", "daemon off;"]