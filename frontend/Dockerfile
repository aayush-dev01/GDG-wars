# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Pass build arguments
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE

# Copy the rest of the frontend code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:stable-alpine

# Copy the build output from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Add custom Nginx config to handle SPA routing
RUN printf "server {\n\
    listen 8080;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files \$uri \$uri/ /index.html;\n\
    }\n\
}" > /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

# Run Nginx
CMD ["nginx", "-g", "daemon off;"]
