FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
RUN apk add --no-cache mongodb
RUN mkdir -p /data/db && \
    chown -R mongodb /data/db

# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3000
EXPOSE 27017
EXPOSE 28017


#CMD [ "mongod", "--bind_ip_all", "--fork", "--logpath", "/var/log/mongod.log"]
#CMD [ "npm", "start" ]
CMD ["ash", "run.sh"]
