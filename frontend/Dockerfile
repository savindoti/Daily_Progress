### Build stage
FROM node:18-alpine AS build
WORKDIR /app

# copy package files and install
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent

# copy source
COPY . .

# allow passing API base at build time
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}

RUN npm run build

### Production stage: nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
