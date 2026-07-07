// Server-side observability. Initializes the Azure Monitor OpenTelemetry distro so
// Application Insights receives request/dependency/exception telemetry. Gated on the
// connection string (injected into the Container App by infra/modules/containerapp.bicep)
// so local dev and CI — where it is unset — run as a no-op. Node runtime only; the OTel
// SDK is not supported on the Edge runtime.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) return;

  const { useAzureMonitor } = await import("@azure/monitor-opentelemetry");
  // eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook; SDK entrypoint
  useAzureMonitor();
}
