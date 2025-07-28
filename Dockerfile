#Image choose/server
FROM node:22-alpine

WORKDIR /app

#COPY source(current) destination (dcoker)
COPY package*json ./

#Shell terminal command
RUN npm install

#Copy rest of the source code
COPY . .

#Docker port
EXPOSE 2000

#Entry point
CMD ["node","server.js"]

#docker run -d -p 5050:5050 --name backend backend-app