// Avanan Phishing Report Summary document interface
export interface AvanSummaryDoc {
  id: string; // Format: "Avanan_Summary_{YYYY-MM-DD}"
  doc_type: 'avanan_phishing_summary';
  date: string; // YYYY-MM-DD

  // Total counts by threat type
  Total_emails_analyzed: number;
  Phishing_count: number;
  Malware_count: number;
  Spam_count: number;
  Graymail_count: number;
  Clean_count: number;

  // Spam verdict distribution (0-10 scale)
  Spam_verdict_distribution: {
    [key: string]: number; // "0": 10, "1": 5, etc.
  };

  // Top attacked users (recipients with most threats)
  Top_attacked_users: Array<{
    recipient: string;
    threat_count: number;
    phishing_count: number;
    malware_count: number;
    spam_count: number;
  }>;

  // Top sender domains (attackers)
  Top_attacker_domains: Array<{
    domain: string;
    email_count: number;
    phishing_count: number;
  }>;

  // Detection methods effectiveness
  Detection_methods: {
    Microsoft_detections: number;
    SPF_failures: number;
    DMARC_failures: number;
    Quarantined: number;
  };

  // Threat trends by hour
  Hourly_distribution: Array<{
    hour: number; // 0-23
    threat_count: number;
  }>;

  // Average threat severity
  Average_spam_verdict: number;

  // Most common attack types
  Top_attack_types: Array<{
    attack_type: string;
    count: number;
  }>;

  // Email authentication stats
  Authentication_stats: {
    SPF_pass: number;
    SPF_fail: number;
    DMARC_pass: number;
    DMARC_fail: number;
    DMARC_none: number;
  };

  last_updated: string; // ISO 8601 timestamp

  // CosmosDB internal fields
  _rid?: string;
  _self?: string;
  _etag?: string;
  _attachments?: string;
  _ts?: number;
}
