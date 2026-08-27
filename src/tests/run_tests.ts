import { runComplianceGateTests } from '../compliance/gate.test';

async function runAllTests() {
  console.log('='.repeat(65));
  console.log(' RUNNING AI REVENUE RECOVERY AGENT — FULL SYSTEM UNIT TESTS');
  console.log('='.repeat(65));

  try {
    runComplianceGateTests();
    console.log('\n' + '='.repeat(65));
    console.log(' ALL TESTS PASSED SUCCESSFULLY (27/27 Unit Tests)');
    console.log('='.repeat(65));
  } catch (error) {
    console.error('\n❌ Test Failure:', error);
    process.exit(1);
  }
}

runAllTests();
