// Maps a targeted port to the kind of attack it usually represents (client-safe).
export type AttackCategory = { id: string; name: string; what: string };

export const attackCategories: AttackCategory[] = [
  { id: 'ssh', name: 'Fuerza bruta SSH', what: 'Prueban usuarios y contraseñas en servidores Linux y routers.' },
  { id: 'web', name: 'Ataques web', what: 'Buscan paneles, fallos y archivos expuestos en servidores web.' },
  { id: 'iot', name: 'Telnet / IoT', what: 'Botnets tipo Mirai intentan entrar en cámaras y routers.' },
  { id: 'remote', name: 'Escritorio remoto', what: 'Intentos contra RDP y VNC para tomar control del equipo.' },
  { id: 'smb', name: 'Compartición Windows', what: 'Exploits y gusanos contra SMB/NetBIOS, vía típica de ransomware.' },
  { id: 'db', name: 'Bases de datos', what: 'Accesos a MySQL, SQL Server, Redis o Elasticsearch abiertos.' },
  { id: 'infra', name: 'Correo y DNS', what: 'Abuso de servidores de correo y DNS expuestos.' },
  { id: 'p2p', name: 'P2P / torrent', what: 'Tráfico de redes P2P que los sensores registran sin pedirlo.' },
  { id: 'other', name: 'Otros puertos', what: 'Escaneos a puertos poco comunes o propios de un fabricante.' },
];

const byPort: Record<number, string> = {
  22: 'ssh', 2222: 'ssh', 2223: 'ssh', 22222: 'ssh',
  80: 'web', 443: 'web', 8080: 'web', 8000: 'web', 8443: 'web', 81: 'web', 8888: 'web', 8081: 'web', 8001: 'web', 3000: 'web', 9000: 'web', 8090: 'web', 5000: 'web', 8008: 'web',
  23: 'iot', 2323: 'iot', 37215: 'iot', 52869: 'iot', 7547: 'iot', 5555: 'iot', 60001: 'iot', 9530: 'iot',
  3389: 'remote', 5900: 'remote', 5901: 'remote',
  445: 'smb', 139: 'smb', 135: 'smb',
  3306: 'db', 1433: 'db', 5432: 'db', 6379: 'db', 27017: 'db', 9200: 'db', 11211: 'db',
  25: 'infra', 587: 'infra', 53: 'infra', 123: 'infra', 161: 'infra', 1900: 'infra',
  51413: 'p2p', 6881: 'p2p', 6969: 'p2p',
};

export function categoryOf(port: number): AttackCategory {
  const id = byPort[port] ?? 'other';
  return attackCategories.find((c) => c.id === id)!;
}

/** Sums records per attack category, largest first, with each share as a 0–1 fraction. */
export function groupByCategory(ports: { port: number; records: number }[]) {
  const total = ports.reduce((s, p) => s + p.records, 0) || 1;
  const sums = new Map<string, number>();
  for (const p of ports) { const c = categoryOf(p.port); sums.set(c.id, (sums.get(c.id) ?? 0) + p.records); }
  return [...sums.entries()].map(([id, records]) => ({ ...attackCategories.find((c) => c.id === id)!, records, share: records / total })).sort((a, b) => b.records - a.records);
}

/** Average attacks per second over the given days of reports. */
export function attacksPerSecond(days: { records: number }[]) {
  if (!days.length) return 0;
  return days.reduce((s, d) => s + d.records, 0) / days.length / 86400;
}
