# syntax=docker/dockerfile:1
#
# Monitoring interface UI — multi-stage build.
# Stage 1: build the SPA. Stage 2: serve it from nginx and proxy the Nagios
# CGIs same-origin, so the browser talks only to this container.

FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# '/' means "the CGIs come from this same server" — the nginx proxy below.
ARG VITE_DEFAULT_BASE_URL='/'
ENV VITE_DEFAULT_BASE_URL=${VITE_DEFAULT_BASE_URL}
RUN npm run build

FROM nginx:1.29-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Rendered at start by the image's envsubst step, so the listen port and the
# Nagios address are deployment inputs rather than baked-in constants. The
# filter keeps envsubst away from nginx's own $host / $uri / $args.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
RUN rm -f /etc/nginx/conf.d/default.conf
ENV PORT=80 \
    NAGIOS_UPSTREAM=http://nagios:80 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 \
    NGINX_ENVSUBST_FILTER='^(PORT|NAGIOS_UPSTREAM|NGINX_LOCAL_RESOLVERS)$'

EXPOSE 80