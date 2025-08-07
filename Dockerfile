FROM node:22.12-alpine

# Set working directory
WORKDIR /app

# Define build arguments
ARG NODE_ENV
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG BACKEND_URL
ARG NEXT_PUBLIC_BACKEND_URL
ARG JUDGE0_API_URL
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG NEXT_PUBLIC_APP_URL

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=${NODE_ENV}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV BACKEND_URL=${BACKEND_URL}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV JUDGE0_API_URL=${JUDGE0_API_URL}

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Copy the rest of the application
COPY . .

# Build the application with environment variables available
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["sh", "-c", "echo 'Environment variables:' && env | grep -E 'NEXTAUTH|GOOGLE|NODE_ENV|NEXT_PUBLIC|BACKEND|JUDGE0' && npm start"]
