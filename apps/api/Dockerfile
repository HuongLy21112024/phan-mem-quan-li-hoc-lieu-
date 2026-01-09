# SmartLearn API Dockerfile
FROM node:20-alpine

# Install build dependencies for native modules (bcrypt) and jq for json manipulation
RUN apk add --no-cache python3 make g++ jq

WORKDIR /app

# Copy package files first
COPY apps/api/package.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

# Remove workspace dependencies from main package.json causing 404
RUN jq 'del(.dependencies["@smartlearn/database"]) | del(.dependencies["@smartlearn/shared"])' package.json > package.json.tmp && mv package.json.tmp package.json

# FIX: Update package.json for shared and database to point to dist/index.js instead of src/index.ts
# This is necessary because we only copy dist folder and run in Node.js (no TS)
RUN cd packages/database && jq '.main = "./dist/index.js" | .types = "./dist/index.d.ts"' package.json > package.json.tmp && mv package.json.tmp package.json
RUN cd packages/shared && jq '.main = "./dist/index.js" | .types = "./dist/index.d.ts"' package.json > package.json.tmp && mv package.json.tmp package.json

# Install dependencies (only external ones)
RUN npm install --ignore-scripts

# Rebuild bcrypt specifically ensures it matches the architecture
RUN npm rebuild bcrypt

# Copy pre-built dist files
COPY apps/api/dist ./dist
COPY packages/database/dist ./packages/database/dist
COPY packages/shared/dist ./packages/shared/dist

# Manually recreate the deleted dependencies in node_modules
RUN mkdir -p node_modules/@smartlearn && \
  ln -sf /app/packages/database node_modules/@smartlearn/database && \
  ln -sf /app/packages/shared node_modules/@smartlearn/shared

# Create uploads directory
RUN mkdir -p uploads

# Cleanup build dependencies
RUN apk del python3 make g++ jq

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
