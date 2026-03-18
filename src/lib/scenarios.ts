import type { Scenario } from "@/types";

/**
 * Built-in battle scenarios.
 * Each defines a target environment for Red Team to attack and Blue Team to defend.
 */
export const BUILTIN_SCENARIOS: Scenario[] = [
  {
    id: "web-server",
    name: "Web Server",
    description: "NGINX web server with a backend API. Red Team probes for injection, traversal, and misconfig. Blue Team monitors logs and hardens config.",
    category: "web",
    difficulty: "beginner",
    services: ["nginx", "node-api", "postgresql"],
    maxRounds: 10,
  },
  {
    id: "corporate-network",
    name: "Corporate Network",
    description: "Simulated enterprise network with Active Directory, file shares, and email. Red Team attempts lateral movement. Blue Team monitors and segments.",
    category: "network",
    difficulty: "intermediate",
    services: ["active-directory", "smb-shares", "mail-server", "firewall"],
    maxRounds: 15,
  },
  {
    id: "cloud-infrastructure",
    name: "Cloud Infrastructure",
    description: "AWS-style cloud environment with S3 buckets, EC2 instances, and IAM roles. Red Team hunts for misconfigurations. Blue Team enforces least privilege.",
    category: "cloud",
    difficulty: "advanced",
    services: ["s3", "ec2", "iam", "cloudtrail", "vpc"],
    maxRounds: 12,
  },
  {
    id: "iot-factory",
    name: "IoT Factory Floor",
    description: "Industrial control systems with PLCs, SCADA, and sensor networks. Red Team targets OT protocols. Blue Team monitors anomalies.",
    category: "iot",
    difficulty: "advanced",
    services: ["plc", "scada", "modbus", "mqtt", "historian"],
    maxRounds: 10,
  },
  {
    id: "api-gateway",
    name: "API Gateway",
    description: "REST + GraphQL API behind an API gateway. Red Team attempts auth bypass, rate limit abuse, and data exfiltration. Blue Team applies WAF rules.",
    category: "web",
    difficulty: "intermediate",
    services: ["api-gateway", "rest-api", "graphql", "redis", "waf"],
    maxRounds: 10,
  },
  {
    id: "container-cluster",
    name: "Container Cluster",
    description: "Kubernetes cluster with multiple microservices. Red Team escapes containers and pivots. Blue Team enforces network policies and RBAC.",
    category: "cloud",
    difficulty: "advanced",
    services: ["kubernetes", "docker", "etcd", "ingress", "service-mesh"],
    maxRounds: 12,
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return BUILTIN_SCENARIOS.find((s) => s.id === id);
}

export function getScenariosByCategory(category: Scenario["category"]): Scenario[] {
  return BUILTIN_SCENARIOS.filter((s) => s.category === category);
}
