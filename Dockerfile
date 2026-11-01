# The site and the importers. The site is built when the container starts, because building
# reads the database (it isn't reachable while the image is built).
FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3033
CMD ["sh", "-c", "npm run build && npm start"]
