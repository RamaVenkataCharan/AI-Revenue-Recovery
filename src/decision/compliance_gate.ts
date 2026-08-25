import { AtRiskSubscriptionEvent } from '../detection/subscription_failure_detector';
import { AuditLogger } from '../audit/audit_logger';

export interface ComplianceCheckResult {
  passed: boolean;
  blocked_reason?: string;
  next_allowed_execution_time?: string;
  compliance_rule?: 'CONTACT_FREQUENCY_CAP_EXCEEDED' | 'QUIET_HOURS_DND_VIOLATION';
}

export class ComplianceGate {
  public static readonly MAX_CONTACTS_PER_48H = 2;
  public static readonly QUIET_HOURS_START = 21; // 9:00 PM (21:00)
  public static readonly QUIET_HOURS_END = 8;    // 8:00 AM (08:00)

  /**
   * Enforces regulatory compliance: TRAI/RBI anti-harassment contact caps and DND quiet hours.
   */
  public static evaluate(
    event: AtRiskSubscriptionEvent,
    actionType: string,
    currentDate: Date = new Date()
  ): ComplianceCheckResult {
    // Customer-facing outreach actions require strict compliance checks
    const isCustomerOutreach = 
      actionType.includes('NUDGE') || 
      actionType.includes('VOICE') || 
      actionType.includes('REQUEST') ||
      actionType.includes('HINGLISH');

    if (!isCustomerOutreach) {
      // Internal system retry without direct customer ping
      return { passed: true };
    }

    // 1. Anti-Harassment Contact Frequency Cap (max 2 contacts per 48 hours)
    if (event.recent_contact_count_48h >= ComplianceGate.MAX_CONTACTS_PER_48H) {
      const reason = `Contact frequency violation: Customer ${event.customer_name} has already received ${event.recent_contact_count_48h} touches in the last 48h (Cap: ${ComplianceGate.MAX_CONTACTS_PER_48H}). Anti-harassment policy prevents further outreach.`;

      AuditLogger.log({
        event_type: 'COMPLIANCE_GATE_CHECK',
        subscription_id: event.subscription_id,
        decision: 'COMPLIANCE_GATE_BLOCKED',
        reasoning: reason,
        action_taken: 'BLOCK_COMMUNICATION',
        result: 'COMPLIANCE_GATE_BLOCKED',
        metadata: {
          recent_contact_count_48h: event.recent_contact_count_48h,
          max_allowed: ComplianceGate.MAX_CONTACTS_PER_48H,
          compliance_rule: 'CONTACT_FREQUENCY_CAP_EXCEEDED'
        }
      });

      return {
        passed: false,
        blocked_reason: reason,
        compliance_rule: 'CONTACT_FREQUENCY_CAP_EXCEEDED'
      };
    }

    // 2. Quiet Hours (DND) check: 9 PM to 8 AM in IST (UTC+5:30)
    const utcHours = currentDate.getUTCHours();
    const utcMinutes = currentDate.getUTCMinutes();
    const istHours = (utcHours + 5 + Math.floor((utcMinutes + 30) / 60)) % 24;

    const isQuietHours = istHours >= ComplianceGate.QUIET_HOURS_START || istHours < ComplianceGate.QUIET_HOURS_END;

    if (isQuietHours) {
      const reason = `Quiet hours violation: Current time is ${istHours.toString().padStart(2, '0')}:00 IST. TRAI/RBI regulations strictly prohibit automated consumer calls or SMS between 21:00 and 08:00 IST.`;

      AuditLogger.log({
        event_type: 'COMPLIANCE_GATE_CHECK',
        subscription_id: event.subscription_id,
        decision: 'COMPLIANCE_GATE_BLOCKED',
        reasoning: reason,
        action_taken: 'RESCHEDULE_FOR_MORNING_WINDOW',
        result: 'COMPLIANCE_GATE_BLOCKED',
        metadata: {
          istHours,
          restrictedWindow: '21:00 - 08:00',
          compliance_rule: 'QUIET_HOURS_DND_VIOLATION'
        }
      });

      return {
        passed: false,
        blocked_reason: reason,
        compliance_rule: 'QUIET_HOURS_DND_VIOLATION',
        next_allowed_execution_time: '09:00 IST (Next morning business window)'
      };
    }

    // Gate Passed
    AuditLogger.log({
      event_type: 'COMPLIANCE_GATE_CHECK',
      subscription_id: event.subscription_id,
      decision: 'COMPLIANCE_GATE_PASSED',
      reasoning: `Action "${actionType}" complies with all anti-harassment and diurnal contact regulations. Contacts in 48h: ${event.recent_contact_count_48h}/${ComplianceGate.MAX_CONTACTS_PER_48H}, Time: ${istHours}:00 IST (Active Window).`,
      action_taken: 'APPROVE_ACTION',
      result: 'PASSED'
    });

    return {
      passed: true
    };
  }
}
