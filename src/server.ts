import express, { Request, Response } from 'express';
import { getDatabase } from './db/database';
import { AuditLogger } from './audit/audit_logger';
import { RevenueRecoveryOrchestrator } from './agent/orchestrator';
import { ModelPredictor } from './prediction/model_predictor';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Run batch endpoint
app.post('/api/recovery/run-batch', async (req: Request, res: Response) => {
  try {
    const report = await RevenueRecoveryOrchestrator.runBatch();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Model Prediction endpoint
app.post('/api/recovery/predict', (req: Request, res: Response) => {
  try {
    const prediction = ModelPredictor.predict(req.body);
    res.json({ success: true, prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Portfolio Batch Prediction endpoint
app.get('/api/recovery/predict-portfolio', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const records = db.prepare('SELECT subscription_id, customer_name, amount, failure_reason_code, customer_segment, retry_count_so_far, payment_method FROM subscriptions ORDER BY amount DESC').all() as any[];
    const portfolio = ModelPredictor.predictPortfolio(records || []);
    res.json({ success: true, portfolio });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get latest metrics
app.get('/api/recovery/metrics', (req: Request, res: Response) => {
  const db = getDatabase();
  const latestMetric = db.prepare('SELECT * FROM recovery_metrics ORDER BY timestamp DESC LIMIT 1').get();
  res.json(latestMetric || {});
});

// Get audit logs for a subscription or all
app.get('/api/recovery/audit', (req: Request, res: Response) => {
  const subscriptionId = req.query.subscription_id as string | undefined;
  if (subscriptionId) {
    res.json(AuditLogger.getLogsBySubscription(subscriptionId));
  } else {
    res.json(AuditLogger.getAllLogs());
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Server] AI Revenue Recovery backend listening on port ${PORT}`);
  });
}

export default app;
