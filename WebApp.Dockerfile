FROM node:20-alpine AS frontend  
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app 
COPY ./frontend/package*.json ./  
USER node

# Remove node_modules and package-lock.json
RUN rm -rf node_modules && rm -f package-lock.json

# Install dependencies and generate package-lock.json
RUN npm install

COPY --chown=node:node ./frontend/ ./frontend  
COPY --chown=node:node ./static/ ./static  
WORKDIR /home/node/app/frontend

# Build the project
RUN NODE_OPTIONS=--max_old_space_size=8192 npm run build
  
FROM python:3.11-alpine 
RUN apk add --no-cache --virtual .build-deps \  
    build-base \  
    libffi-dev \  
    openssl-dev \  
    curl \  
    && apk add --no-cache \  
    libpq 
  
COPY requirements.txt /usr/src/app/  
RUN pip install --no-cache-dir -r /usr/src/app/requirements.txt \  
    && rm -rf /root/.cache  
  
COPY . /usr/src/app/  
COPY --from=frontend /home/node/app/static  /usr/src/app/static/
WORKDIR /usr/src/app  
EXPOSE 80  

CMD ["gunicorn"  , "-b", "0.0.0.0:80", "app:app"]