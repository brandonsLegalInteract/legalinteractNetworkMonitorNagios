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
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80