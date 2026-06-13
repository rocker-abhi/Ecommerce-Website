# Dockerfile for Appolo Frontend
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install npm packages
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Expose port 5173 for Vite dev server
EXPOSE 5173

# Run Vite dev server in host binding mode
CMD ["npm", "run", "dev", "--", "--host"]
