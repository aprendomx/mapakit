FROM node:20-alpine

# Enable corepack and install pnpm globally
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

# Copy all files and install dependencies
COPY . .
RUN pnpm install

# Expose the Vite dev server port
EXPOSE 5173

CMD ["pnpm", "dev"]
