import { runComplianceGateTests } from '../compliance/gate.test';
import { runAdapterTests } from '../compliance/adapter.test';
import { runRescheduleLoopTests } from './reschedule_loop.test';
import { testDetection } from './detection.test';
import { testRootCauseClassifier } from './diagnosis.test';
import { testStoppingRules } from './stopping_rules.test';
import { testComplianceGate } from './compliance_gate.test';
import { testPromiseToPay } from './promise_to_pay.test';
import { testVoiceRecovery } from './voice_recovery.test';
import { runPredictionModelTests } from './prediction_model.test';

async function runAllTests() {
  console.log('='.repeat(70));
  console.log(' RUNNING AI REVENUE RECOVERY AGENT — FULL SYSTEM UNIT TESTS');
  console.log('='.repeat(70));

  try {
    // 1. Canonical Regulatory Compliance Gate (27 Tests)
    runComplianceGateTests();

    // 2. Compliance Adapter Parity & Contract Tests (7 Tests)
    runAdapterTests();

    // 3. 2-Cycle Reschedule Loop & Deferral Resolution Tests (2 Tests)
    runRescheduleLoopTests();

    // 4. Detection Engine Tests
    testDetection();

    // 5. Root Cause Classifier Tests
    testRootCauseClassifier();

    // 6. Stopping Rules Safety Bounds Tests
    testStoppingRules();

    // 7. Integrated Adapted Compliance Gate Tests
    testComplianceGate();

    // 8. Promise-to-Pay State Machine Tests
    testPromiseToPay();

    // 9. Voice Recovery Escalation Policy & Script Tests
    testVoiceRecovery();

    // 10. Compliance Decision Predictor Engine Tests (8 Tests)
    runPredictionModelTests();

    console.log('\n' + '='.repeat(70));
    console.log(' ALL TEST SUITES PASSED (27 Gate + 7 Adapter + 2 Loop + 8 Engine + All Modules)');
    console.log('='.repeat(70));
  } catch (error) {
    console.error('\n❌ Test Failure:', error);
    process.exit(1);
  }
}

runAllTests();
