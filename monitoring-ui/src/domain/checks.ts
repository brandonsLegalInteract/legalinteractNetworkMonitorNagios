import type { CheckKind, DnsRecordType, Target } from '@/domain/types';

/**
 * Nagios object values are `!`-separated on the `check_command` line and
 * `;`-terminated in config files, so operator-supplied text has to be scrubbed
 * before it reaches generated configuration.
 */
export function sanitizeNagiosValue(value: string): string {
  return value.replace(/[!;\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
}

export const DEFAULT_HTTP_PATH = '/';
export const DEFAULT_HTTP_STATUS = 200;
export const DEFAULT_DNS_RECORD_TYPE: DnsRecordType = 'A';

export function defaultPortFor(target: Pick<Target, 'check' | 'secure'>): number {
  if (target.check === 'http') {
    return target.secure ? 443 : 80;
  }
  return 443;
}

/**
 * Build the Nagios `check_command` value for a target.
 *
 * Commands are defined in `monitoring/nagios/objects/commands.cfg`; each one
 * resolves the address through `$HOSTADDRESS$`, so generated services never
 * duplicate the address or leak host details into the command line.
 */
export function checkCommandFor(target: Target): string {
  switch (target.check) {
    case 'ping':
      return 'monitor-ping';
    case 'tcp':
      return `monitor-tcp!${target.port ?? defaultPortFor(target)}`;
    case 'http': {
      const command = target.secure ? 'monitor-https' : 'monitor-http';
      const port = target.port ?? defaultPortFor(target);
      const path = target.path?.trim() || DEFAULT_HTTP_PATH;
      const expectStatus = target.expectStatus ?? DEFAULT_HTTP_STATUS;
      return [command, port, sanitizeNagiosValue(path), expectStatus].join('!');
    }
    case 'dns': {
      // check_dns resolves names; it cannot assert record types, so v1 maps
      // record types to a plain resolution check and only adds an expectation
      // when the operator supplies one.
      const expectValue = sanitizeNagiosValue(target.expectValue ?? '');
      return expectValue.length > 0 ? `monitor-dns-expected!${expectValue}` : 'monitor-dns';
    }
  }
}

/** Short human label describing what a target actually checks. */
export function checkLabel(target: Target): string {
  switch (target.check) {
    case 'ping':
      return 'Ping';
    case 'tcp':
      return `TCP ${target.port ?? defaultPortFor(target)}`;
    case 'http': {
      const scheme = target.secure ? 'https' : 'http';
      const port = target.port ?? defaultPortFor(target);
      const path = target.path?.trim() || DEFAULT_HTTP_PATH;
      return `${scheme.toUpperCase()} ${port}${path}`;
    }
    case 'dns':
      return `DNS ${target.dnsRecordType ?? DEFAULT_DNS_RECORD_TYPE}`;
  }
}

export const CHECK_KIND_LABEL: Record<CheckKind, string> = {
  ping: 'Ping (ICMP)',
  tcp: 'TCP port',
  http: 'HTTP(S) endpoint',
  dns: 'DNS record',
};
