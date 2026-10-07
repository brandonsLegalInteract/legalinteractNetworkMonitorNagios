#!/bin/sh
set -e

NAGIOS_ETC=/usr/local/nagios/etc
NAGIOS_BIN=/usr/local/nagios/bin
NAGIOS_ADMIN_PASSWORD="${NAGIOS_ADMIN_PASSWORD:-nagiosadmin}"

# Create a usable admin account on first start. The file is not treated as
# immutable so operators can swap in their own htpasswd via a mounted volume.
if [ ! -f "${NAGIOS_ETC}/htpasswd.users" ]; then
    echo "Creating nagiosadmin account in ${NAGIOS_ETC}/htpasswd.users"
    htpasswd -cb "${NAGIOS_ETC}/htpasswd.users" nagiosadmin "${NAGIOS_ADMIN_PASSWORD}"
    chown nagios:nagios "${NAGIOS_ETC}/htpasswd.users"
    chmod 640 "${NAGIOS_ETC}/htpasswd.users"
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
echo "Starting Apache..."
apache2ctl start 2>&1

echo "Starting Nagios Core..."
exec "${NAGIOS_BIN}/nagios" "${NAGIOS_ETC}/nagios.cfg"