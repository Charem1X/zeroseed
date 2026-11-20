export const SITE_CONFIG = {
  name: 'ZeroSeed',
  domain: '.io',
  fullName: 'ZeroSeed.io',
  version: 'v1.4.0-e2ee',
  protocolNamespace: 'p2p-io/v1',
  keyDerivationDomain: 'p2p-e2ee-key-v1',
  pbkdf2Iterations: 150_000,
  chunkSize: 65_536, // 64 KB
  ackIntervalChunks: 16, // Send ACK every 16 chunks (1 MB)
  maxBufferedAmount: 4 * 1024 * 1024, // 4 MB high-water mark
  lowBufferedThreshold: 1 * 1024 * 1024, // 1 MB low-water mark
  brokerTimeoutMs: 3000,
  stunServers: [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
  ],
  mqttBrokers: [
    {
      name: 'HiveMQ Public WSS',
      url: 'wss://broker.hivemq.com:8884/mqtt',
    },
    {
      name: 'EMQX Public WSS',
      url: 'wss://broker.emqx.io:8084/mqtt',
    },
    {
      name: 'Mosquitto Public WSS',
      url: 'wss://test.mosquitto.org:8081/mqtt',
    },
  ],
} as const;
