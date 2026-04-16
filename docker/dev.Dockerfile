FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

# Source code mounted as volume for hot reloading
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
