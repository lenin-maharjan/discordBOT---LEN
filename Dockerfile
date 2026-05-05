FROM node:22-alpine

WORKDIR /app

# Install runtime deps (ffmpeg for music support)
RUN apk add --no-cache ffmpeg

# Copy package files from the nested project and install
COPY discordBOT_LEN/package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY discordBOT_LEN/ .

ENV NODE_ENV=production

CMD ["npm", "start"]
