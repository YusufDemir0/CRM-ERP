import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

/**
 * OpenTelemetry Bootstrap.
 * This MUST be imported before anything else in main.ts or worker.ts.
 * 
 * METRICS_PORT is configurable via env to avoid EADDRINUSE when
 * multiple processes (API + Worker) run on the same host.
 *   API:    METRICS_PORT=9464 (default)
 *   Worker: METRICS_PORT=9465
 */

const metricsPort = parseInt(process.env.METRICS_PORT || '9464', 10);

const exporter = new PrometheusExporter({
  port: metricsPort,
  endpoint: '/metrics',
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME || 'ermay-erp',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  }),
  metricReader: exporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable noisy instrumentations if needed
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

// Start the SDK
sdk.start();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry SDK shut down successfully'))
    .catch((error: unknown) => console.log('Error shutting down OpenTelemetry SDK', error))
    .finally(() => process.exit(0));
});

export { sdk };
