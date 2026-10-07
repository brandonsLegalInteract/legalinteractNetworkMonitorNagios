#!/bin/sh
#
# apply-generated.sh — validate and apply generated Nagios configuration.
#
# The monitoring interface exports hosts.cfg and services.cfg. Copy them into
# monitoring/nagios/objects/generated/, then run this script on the Nagios
# host (or inside the container) to validate and reload without a full restart.
#
# Usage (inside the container):
#   docker exec -it availability-nagios /bin/sh /scripts/apply-generated.sh
#
# Usage (native install):
#   /usr/local/nagios/bin/nagios -v /usr/local/nagios/etc/nagios.cfg
#   systemctl reload nagios

set -e

NAGIOS_ETC="${NAGIOS_ETC:-/usr/local/nagios/etc}"
NAGIOS_BIN="${NAGIOS_BIN:-/usr/local/nagios/bin}"
GENERATED="${NAGIOS_ETC}/objects/generated"

for file in hosts.cfg services.cfg; do
    if [ ! -f "${GENERATED}/${file}" ]; then
        echo "ERROR: ${GENERATED}/${file} is missing." >&2
        exit 1
    fi
done

echo "Validating configuration..."
"${NAGIOS_BIN}/nagios" -v "${NAGIOS_ETC}/nagios.cfg"

# A reload drops the schedule without losing state. If the process has a
# wrapper script, use `service nagios reload` or `systemctl reload nagios`.
case "$(uname -s)" in
    Linux)
        if command -v systemctl >/dev/null 2>&1; then
            systemctl reload nagios
        elif command -v service >/dev/null 2>&1; then
            service nagios reload
        else
            # Signal Nagios directly: SIGHUP re-reads config.
            pkill -HUP nagios
        fi
        ;;
    *)
        echo "Apply the reload manually for this platform."
        ;;
esac

echo "Done. Check /usr/local/nagios/var/nagios.log for reload results."