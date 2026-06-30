FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

# Expose port (Cloud Run sets the PORT env variable automatically, but we default to 8080)
EXPOSE 8080

# Command to run the application
CMD [ "node", "server.js" ]
