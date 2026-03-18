import type { BattleEvent, BattleConfig } from "@/types";

// ── Red Team Actions ─────────────────────────────────────────────────────────

interface ActionTemplate {
  phase: string;
  action: string;
  detail: string;
  successRate: number;
}

const RED_ACTIONS: ActionTemplate[][] = [
  // Round 1-2: Recon
  [
    { phase: "RECON", action: "port_scan", detail: "Scanning TCP ports 1-1024 on target host", successRate: 0.9 },
    { phase: "RECON", action: "service_enum", detail: "Enumerating running services and version fingerprints", successRate: 0.85 },
    { phase: "RECON", action: "dns_recon", detail: "Performing DNS zone transfer and subdomain enumeration", successRate: 0.6 },
    { phase: "SCAN", action: "vuln_scan", detail: "Running vulnerability scanner against detected services", successRate: 0.7 },
  ],
  // Round 3-4: Initial Access
  [
    { phase: "EXPLOIT", action: "sql_injection", detail: "Testing login form for SQL injection: ' OR 1=1 --", successRate: 0.45 },
    { phase: "EXPLOIT", action: "auth_bypass", detail: "Attempting authentication bypass via default credentials", successRate: 0.35 },
    { phase: "EXPLOIT", action: "ssrf_probe", detail: "Probing internal endpoints via SSRF in image upload handler", successRate: 0.4 },
    { phase: "RECON", action: "directory_brute", detail: "Brute forcing web directories: /admin, /api/v1, /debug", successRate: 0.7 },
  ],
  // Round 5-6: Exploitation
  [
    { phase: "EXPLOIT", action: "rce_attempt", detail: "Exploiting deserialization vulnerability in API endpoint", successRate: 0.3 },
    { phase: "EXPLOIT", action: "lfi_exploit", detail: "Local file inclusion via path traversal: ../../../../etc/passwd", successRate: 0.5 },
    { phase: "EXPLOIT", action: "xss_stored", detail: "Injecting persistent XSS payload in user profile field", successRate: 0.55 },
    { phase: "EXPLOIT", action: "jwt_forge", detail: "Forging JWT token with weak HMAC secret discovered in config", successRate: 0.4 },
  ],
  // Round 7-8: Escalation
  [
    { phase: "ESCALATE", action: "priv_escalation", detail: "Exploiting SUID binary for root privilege escalation", successRate: 0.25 },
    { phase: "ESCALATE", action: "lateral_move", detail: "Pivoting to database server using harvested credentials", successRate: 0.35 },
    { phase: "PERSIST", action: "backdoor_install", detail: "Installing reverse shell cron job for persistent access", successRate: 0.3 },
    { phase: "EXPLOIT", action: "container_escape", detail: "Attempting container escape via mounted Docker socket", successRate: 0.2 },
  ],
  // Round 9-10: Exfiltration
  [
    { phase: "EXFIL", action: "data_dump", detail: "Exfiltrating customer database via DNS tunneling", successRate: 0.35 },
    { phase: "EXFIL", action: "credential_harvest", detail: "Dumping password hashes from /etc/shadow", successRate: 0.4 },
    { phase: "PERSIST", action: "rootkit_deploy", detail: "Deploying kernel-level rootkit to maintain stealth access", successRate: 0.15 },
    { phase: "ESCALATE", action: "ad_compromise", detail: "Kerberoasting service accounts for golden ticket attack", successRate: 0.25 },
  ],
];

// ── Blue Team Actions ────────────────────────────────────────────────────────

const BLUE_ACTIONS: ActionTemplate[][] = [
  // Round 1-2: Monitor
  [
    { phase: "MONITOR", action: "log_analysis", detail: "Analyzing authentication logs for anomalous patterns", successRate: 0.7 },
    { phase: "DETECT", action: "ids_alert", detail: "IDS triggered: unusual port scanning activity detected", successRate: 0.8 },
    { phase: "HARDEN", action: "firewall_update", detail: "Tightening firewall rules to block non-essential ports", successRate: 0.85 },
    { phase: "MONITOR", action: "traffic_baseline", detail: "Establishing network traffic baseline for anomaly detection", successRate: 0.9 },
  ],
  // Round 3-4: Detect
  [
    { phase: "DETECT", action: "waf_block", detail: "WAF blocked SQL injection attempt from source IP", successRate: 0.75 },
    { phase: "DETECT", action: "auth_alert", detail: "Alert: multiple failed login attempts from single IP", successRate: 0.8 },
    { phase: "HARDEN", action: "patch_apply", detail: "Applying security patches to web server components", successRate: 0.9 },
    { phase: "RESPOND", action: "ip_block", detail: "Blocking suspicious source IP at perimeter firewall", successRate: 0.85 },
  ],
  // Round 5-6: Respond
  [
    { phase: "DETECT", action: "file_integrity", detail: "File integrity monitoring: unauthorized changes detected", successRate: 0.65 },
    { phase: "RESPOND", action: "session_kill", detail: "Terminating suspicious user sessions and rotating tokens", successRate: 0.8 },
    { phase: "HARDEN", action: "input_validation", detail: "Deploying enhanced input validation rules to API gateway", successRate: 0.85 },
    { phase: "ANALYZE", action: "forensic_capture", detail: "Capturing memory dump and network pcap for analysis", successRate: 0.9 },
  ],
  // Round 7-8: Contain
  [
    { phase: "CONTAIN", action: "network_segment", detail: "Isolating compromised subnet from production network", successRate: 0.7 },
    { phase: "DETECT", action: "priv_esc_detect", detail: "Detecting privilege escalation attempt via auditd logs", successRate: 0.55 },
    { phase: "RESPOND", action: "credential_rotate", detail: "Force-rotating all service account credentials", successRate: 0.9 },
    { phase: "HARDEN", action: "rbac_enforce", detail: "Enforcing strict RBAC policies and removing excess permissions", successRate: 0.85 },
  ],
  // Round 9-10: Eradicate
  [
    { phase: "CONTAIN", action: "threat_eradicate", detail: "Removing persistence mechanisms and cleaning compromised hosts", successRate: 0.6 },
    { phase: "DETECT", action: "exfil_detect", detail: "Detecting anomalous DNS queries consistent with data exfiltration", successRate: 0.5 },
    { phase: "RESPOND", action: "incident_report", detail: "Generating incident timeline and indicator of compromise report", successRate: 0.95 },
    { phase: "HARDEN", action: "config_hardening", detail: "Implementing defense-in-depth configuration across all services", successRate: 0.9 },
  ],
];

// ── Mock Battle Engine ───────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getPhaseActions(round: number, maxRounds: number, actions: ActionTemplate[][]): ActionTemplate[] {
  const phaseIndex = Math.min(
    Math.floor((round - 1) / Math.max(1, maxRounds / actions.length)),
    actions.length - 1
  );
  return actions[phaseIndex];
}

function createEvent(
  template: ActionTemplate,
  team: "red" | "blue",
  startedAt: number,
  round: number,
  eventIndex: number,
): BattleEvent {
  const success = Math.random() < template.successRate;
  const timeOffset = (round - 1) * 2000 + eventIndex * (200 + Math.random() * 600);

  return {
    timestamp: startedAt + timeOffset,
    team,
    phase: template.phase,
    action: template.action,
    detail: template.detail,
    success,
  };
}

export interface MockBattleController {
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function runMockBattle(
  config: BattleConfig,
  onEvent: (event: BattleEvent) => void,
  onRoundChange: (round: number) => void,
  onComplete: () => void,
): MockBattleController {
  const startedAt = Date.now();
  let currentRound = 0;
  let isPaused = false;
  let isStopped = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function scheduleNext(events: BattleEvent[], index: number) {
    if (isStopped || index >= events.length) {
      if (!isStopped && currentRound < config.maxRounds) {
        // Next round
        const delay = 300 + Math.random() * 500;
        timeoutId = setTimeout(() => runRound(currentRound + 1), delay);
      } else if (!isStopped) {
        onComplete();
      }
      return;
    }

    if (isPaused) {
      // Will be resumed via resume()
      const resumeCheck = setInterval(() => {
        if (!isPaused) {
          clearInterval(resumeCheck);
          scheduleNext(events, index);
        }
        if (isStopped) {
          clearInterval(resumeCheck);
        }
      }, 100);
      return;
    }

    const delay = 200 + Math.random() * 600;
    timeoutId = setTimeout(() => {
      onEvent(events[index]);
      scheduleNext(events, index + 1);
    }, delay);
  }

  function runRound(round: number) {
    if (isStopped) return;
    currentRound = round;
    onRoundChange(round);

    const redActions = getPhaseActions(round, config.maxRounds, RED_ACTIONS);
    const blueActions = getPhaseActions(round, config.maxRounds, BLUE_ACTIONS);

    // Generate 2-4 events per team per round
    const eventsPerTeam = 2 + Math.floor(Math.random() * 3);
    const roundEvents: BattleEvent[] = [];

    for (let i = 0; i < eventsPerTeam; i++) {
      const redTemplate = pickRandom(redActions);
      roundEvents.push(createEvent(redTemplate, "red", startedAt, round, i * 2));

      const blueTemplate = pickRandom(blueActions);
      roundEvents.push(createEvent(blueTemplate, "blue", startedAt, round, i * 2 + 1));
    }

    // Sort by timestamp to interleave red/blue
    roundEvents.sort((a, b) => a.timestamp - b.timestamp);

    scheduleNext(roundEvents, 0);
  }

  return {
    start: () => {
      runRound(1);
    },
    pause: () => {
      isPaused = true;
    },
    resume: () => {
      isPaused = false;
    },
    stop: () => {
      isStopped = true;
      if (timeoutId) clearTimeout(timeoutId);
      onComplete();
    },
  };
}
