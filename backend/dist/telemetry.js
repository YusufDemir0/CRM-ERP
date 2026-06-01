"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sdk = void 0;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const exporter_prometheus_1 = require("@opentelemetry/exporter-prometheus");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const metricsPort = parseInt(process.env.METRICS_PORT || '9464', 10);
const exporter = new exporter_prometheus_1.PrometheusExporter({
    port: metricsPort,
    endpoint: '/metrics',
});
const sdk = new sdk_node_1.NodeSDK({
    resource: new resources_1.Resource({
        [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME || 'ermay-erp',
        [semantic_conventions_1.SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    }),
    metricReader: exporter,
    instrumentations: [
        (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)({
            '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
    ],
});
exports.sdk = sdk;
sdk.start();
process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => console.log('OpenTelemetry SDK shut down successfully'))
        .catch((error) => console.log('Error shutting down OpenTelemetry SDK', error))
        .finally(() => process.exit(0));
});
//# sourceMappingURL=telemetry.js.map