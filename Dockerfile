FROM node:latest

WORKDIR /app

# Install sqlite3 dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ sqlite3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"] 