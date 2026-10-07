#!/bin/sh
set -e

NAGIOS_ETC=/usr/local/nagios/etc
NAGIOS_BIN=/usr/local/nagios/bin

# Managed platforms (Railway, Cloud Run, Heroku) hand the container the port it
# must listen on. Locally there is no PORT and 80 is what docker-compose maps.
PORT="${PORT:-80}"

# A platform deployment is reachable from the internet the moment it is up, so
# refuse to come up there on the built-in password. Locally (no RAILWAY_*) the
# default stays, which is what the compose quickstart relies on.
if [ -z "${NAGIOS_ADMIN_PASSWORD}" ] && [ -n "${RAILWAY_ENVIRONMENT}" ]; then
    echo "ERROR: NAGIOS_ADMIN_PASSWORD is not set." >&2
    echo "       This deployment is internet-reachable; set the variable on the" >&2
    echo "       service before starting it. Refusing to use the default." >&2
    exit 1
fi
NAGIOS_ADMIN_PASSWORD="${NAGIOS_ADMIN_PASSWORD:-nagiosadmin}"

# Point Apache at the assigned port. Both families are bound explicitly:
# platform private networking is IPv6-only, the public edge is IPv4.
printf 'Listen 0.0.0.0:%s\nListen [::]:%s\n' "${PORT}" "${PORT}" > /etc/apache2/ports.conf
sed -i "s|<VirtualHost \*:[0-9]*>|<VirtualHost *:${PORT}>|" \
    /etc/apache2/sites-available/000-default.conf

# Create a usable admin account on first start. The file is not treated as
# immutable so operators can swap in their own htpasswd via a mounted volume.
if [ ! -f "${NAGIOS_ETC}/htpasswd.users" ]; then
    echo "Creating nagiosadmin account in ${NAGIOS_ETC}/htpasswd.users"
    htpasswd -cb "${NAGIOS_ETC}/htpasswd.users" nagiosadmin "${NAGIOS_ADMIN_PASSWORD}"
    chown nagios:nagios "${NAGIOS_ETC}/htpasswd.users"
    chmod 640 "${NAGIOS_ETC}/htpasswd.users"
    # Apache reads it as www-data to answer the Basic Auth challenge.
    chgrp www-data "${NAGIOS_ETC}/htpasswd.users"
fi

# Refuse to start on broken configuration: fail loudly in the container so a
# bad edit is caught before it half-starts.
echo "Validating configuration..."
if ! "${NAGIOS_BIN}/nagios" -v "${NAGIOS_ETC}/nagios.cfg"; then
    echo "ERROR: Nagios configuration is invalid. Fix it and restart the container." >&2
    exit 1
fi

# Start Apache in the background (output to the container log), then hand PID 1
# to Nagios so docker stop delivers SIGTERM to the actual daemon.
echo "Starting Apache on port ${PORT}..."
apache2ctl start 2>&1

echo "Starting Nagios Core..."
exec "${NAGIOS_BIN}/nagios" "${NAGIOS_ETC}/nagios.cfg"
