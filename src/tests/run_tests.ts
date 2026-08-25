import { testDetection } from './detection.test';
import { testStoppingRules } from './stopping_rules.test';
import { testComplianceGate } from './compliance_gate.test';
import { testVoiceRecovery } from './voice_recovery.test';
import { testPromiseToPay } from './promise_to_pay.test';

async function runAllTests() {
  console.log('='.repeat(65));
  console.log(' RUNNING AI REVENUE RECOVERY AGENT — FULL SYSTEM UNIT TESTS');
  console.log('='.repeat(65));

  try {
    testDetection();
    testStoppingRules();
    testComplianceGate();
    testVoiceRecovery();
    testPromiseToPay();
    console.log('\n' + '='.repeat(65));
    console.log(' ALL TESTS PASSED SUCCESSFULLY (5/5 Test Suites)');
    console.log('='.repeat(65));
  } catch (error) {
    console.error('\n❌ Test Failure:', error);
    process.exit(1);
  }
}

runAllTests();
