FROM node:18
WORKDIR /opt/server
COPY package.json /opt/server/
RUN npm install
COPY server.js /opt/server/
COPY /views /opt/server/views
CMD ["node", "server.js"]