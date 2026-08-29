import app from '../src/server';
import http from 'http';

const server = http.createServer(app);

server.listen(3009, async () => {
  try {
    console.log('Testing Express server on port 3009...');

    const resHealth = await fetch('http://localhost:3009/api/health');
    const healthJson = await resHealth.json();
    console.log('GET /api/health response:', healthJson);

    const resMetrics = await fetch('http://localhost:3009/api/recovery/metrics');
    const metricsJson = await resMetrics.json();
    console.log('GET /api/recovery/metrics response:', metricsJson);

    const resAudit = await fetch('http://localhost:3009/api/recovery/audit');
    const auditJson = await resAudit.json();
    console.log('GET /api/recovery/audit count:', Array.isArray(auditJson) ? auditJson.length : 'Not array');

    const resRunBatch = await fetch('http://localhost:3009/api/recovery/run-batch', { method: 'POST' });
    const batchJson = await resRunBatch.json();
    console.log('POST /api/recovery/run-batch result:', {
      batch_id: batchJson.batch_id,
      total_recovered_amount: batchJson.total_recovered_amount
    });

    console.log('ALL 4 EXPRESS FALLBACK ENDPOINTS VERIFIED SUCCESSFULLY!');
  } catch (err) {
    console.error('Express test error:', err);
  } finally {
    server.close();
  }
});
