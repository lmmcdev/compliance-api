# API Endpoints Documentation

This document provides detailed information about all available API endpoints in the LMC Compliance API.

## Base URL

```
https://<your-function-app>.azurewebsites.net/api/v1
```

---

## Table of Contents

1. [OpenAI Query](#1-openai-query)
2. [Cognitive Search](#2-cognitive-search)
3. [Incident Analytics](#3-incident-analytics)
4. [Patch Analytics](#4-patch-analytics)
5. [Devices](#5-devices)

---

## 1. OpenAI Query

**Endpoint:** `POST /api/v1/openaiquery`

**Description:** Query OpenAI models with custom prompts and options. Uses Azure AD authentication to connect to the AIXAAI OpenAI API.

### Request Body

```json
{
  "systemPrompt": "You are a helpful assistant specialized in IT compliance.",
  "userContent": "What are the key components of HIPAA compliance?",
  "options": {
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 1000,
    "top_p": 1.0,
    "frequency_penalty": 0,
    "presence_penalty": 0
  }
}
```

### Required Fields
- `systemPrompt` (string): System-level instructions for the AI
- `userContent` (string): The user's query or prompt

### Optional Fields
- `options` (object):
  - `model` (string): Model to use (default: "gpt-3.5-turbo")
  - `temperature` (number): 0-2, controls randomness (default: 0.7)
  - `max_tokens` (number): Maximum response length (default: 1000)
  - `top_p` (number): 0-1, nucleus sampling (optional)
  - `frequency_penalty` (number): -2 to 2 (optional)
  - `presence_penalty` (number): -2 to 2 (optional)

### Response

```json
{
  "result": {
    "success": true,
    "data": {
      "choices": [
        {
          "message": {
            "content": "HIPAA compliance includes several key components..."
          }
        }
      ]
    }
  },
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

### Example Use Cases

#### Use Case 1: Analyze Compliance Documents

```bash
POST /api/v1/openaiquery
```

```json
{
  "systemPrompt": "You are a compliance expert. Analyze documents and provide compliance insights.",
  "userContent": "Review this incident report and identify potential HIPAA violations: [incident details]"
}
```

#### Use Case 2: Generate Compliance Reports

```bash
POST /api/v1/openaiquery
```

```json
{
  "systemPrompt": "You are a technical writer for compliance reports.",
  "userContent": "Generate a summary of security incidents from Q4 2025",
  "options": {
    "model": "gpt-4",
    "temperature": 0.3,
    "max_tokens": 2000
  }
}
```

#### Use Case 3: IT Support Assistance

```bash
POST /api/v1/openaiquery
```

```json
{
  "systemPrompt": "You are an IT support specialist.",
  "userContent": "How do I troubleshoot a Windows patch installation failure for KB2267602?"
}
```

---

## 2. Cognitive Search

**Endpoint:** `POST /api/v1/cognitivesearch`

**Description:** Search and query data using Azure Cognitive Search. Accepts flexible JSON payloads for various search scenarios.

### Request Body

The endpoint accepts any JSON structure. Common format:

```json
{
  "extractedData": {
    "field1": "value1",
    "field2": "value2"
  },
  "query": "search term",
  "filters": {
    "category": "security"
  },
  "top": 10,
  "skip": 0
}
```

### Flexible Schema
- Accepts any JSON structure
- No strict validation
- Pass any data structure needed by your search implementation

### Response

```json
{
  "result": {
    "success": true,
    "data": {
      // Search results
    }
  },
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

### Example Use Cases

#### Use Case 1: Search Extracted Document Data

```bash
POST /api/v1/cognitivesearch
```

```json
{
  "extractedData": {
    "documentType": "license",
    "facilityName": "Medical Center",
    "licenseNumber": "FL123456"
  }
}
```

#### Use Case 2: Full-Text Search

```bash
POST /api/v1/cognitivesearch
```

```json
{
  "query": "security updates",
  "filters": {
    "dateRange": {
      "start": "2025-10-01",
      "end": "2025-10-31"
    }
  },
  "top": 20
}
```

#### Use Case 3: Complex Query with Extracted Data

```bash
POST /api/v1/cognitivesearch
```

```json
{
  "extractedData": {
    "patientId": "12345",
    "incidentType": "data_breach",
    "severity": "high"
  },
  "searchMode": "all",
  "orderBy": "timestamp desc"
}
```

---

## 3. Incident Analytics

**Endpoint:** `POST /api/v1/incidentanalytics`

**Description:** Analyze IT and compliance incidents from Cosmos DB. Provides timeline analysis, heatmaps, blocked tools detection, and geographic mapping.

### Request Body (All Optional)

```json
{
  "doc_type": "it_incident",
  "Ticket_priority": "High",
  "Activity_status": "Open",
  "Ticket_type": "Incident",
  "severity": "critical",
  "status": "open",
  "startDate": "2025-09-01T00:00:00Z",
  "endDate": "2025-09-30T23:59:59Z"
}
```

### Optional Filters
- `doc_type`: "it_incident" | "compliance_incident"
- `Ticket_priority`: Priority level (e.g., "High", "Medium", "Low")
- `Activity_status`: Status of IT incidents
- `Ticket_type`: Type of ticket
- `severity`: Compliance incident severity
- `status`: Compliance incident status
- `startDate`: ISO date string for range start
- `endDate`: ISO date string for range end

### Response

```json
{
  "summary": {
    "totalIncidents": 150,
    "totalInstalled": 120,
    "totalPending": 20,
    "totalFailed": 10,
    "dateRange": {
      "start": "2025-09-01T00:00:00.000Z",
      "end": "2025-09-30T23:59:59.000Z"
    },
    "uniqueCategories": 5,
    "uniqueIPs": 25
  },
  "timeline": [
    {
      "date": "2025-09-30",
      "category": "CyberSecurity (SOC): EndPoint",
      "count": 5,
      "incidents": [
        {
          "id": "5118",
          "title": "[Blackpoint] Managed Application Control",
          "created": "2025-09-30T08:21:24.000Z",
          "resolved": "2025-09-30T08:31:31.000Z"
        }
      ]
    }
  ],
  "heatmap": [
    {
      "hour": 8,
      "activity": "Closed",
      "count": 12,
      "incidents": ["5118", "5119"]
    },
    {
      "hour": 13,
      "activity": "Open",
      "count": 8,
      "incidents": ["5120", "5121"]
    }
  ],
  "blockedTools": [
    {
      "tool": "Blackpoint",
      "count": 15,
      "incidents": ["5118", "5119"],
      "firstOccurrence": "2025-09-15T10:00:00.000Z",
      "lastOccurrence": "2025-09-30T08:21:24.000Z"
    }
  ],
  "geographicMap": [
    {
      "ip": "50.172.119.226",
      "count": 25,
      "incidents": ["5118", "5119", "5120"]
    }
  ],
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

### Example Use Cases

#### Use Case 1: Analyze All Incidents (No Filters)

```bash
POST /api/v1/incidentanalytics
```

```json
{}
```

#### Use Case 2: High Priority IT Incidents This Month

```bash
POST /api/v1/incidentanalytics
```

```json
{
  "doc_type": "it_incident",
  "Ticket_priority": "High",
  "startDate": "2025-10-01T00:00:00Z",
  "endDate": "2025-10-31T23:59:59Z"
}
```

#### Use Case 3: Critical Compliance Incidents

```bash
POST /api/v1/incidentanalytics
```

```json
{
  "doc_type": "compliance_incident",
  "severity": "critical",
  "status": "open"
}
```

#### Use Case 4: Closed Incidents by Date Range

```bash
POST /api/v1/incidentanalytics
```

```json
{
  "Activity_status": "Closed",
  "startDate": "2025-09-01T00:00:00Z",
  "endDate": "2025-09-30T23:59:59Z"
}
```

#### Use Case 5: Security Incidents Timeline

```bash
POST /api/v1/incidentanalytics
```

```json
{
  "Ticket_type": "Security Incident",
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-12-31T23:59:59Z"
}
```

---

## 4. Patch Analytics

**Endpoint:** `POST /api/v1/patchanalytics`

**Description:** Analyze Windows patch compliance from the windows_reports container. Provides statistics by patch type, temporal trends, and site-level compliance.

### Request Body (All Optional)

```json
{
  "month": "2025-10",
  "Classification": "Security Updates",
  "Patch_status": "Installed",
  "Site_name": "Hialeah Gardens SPE",
  "startDate": "2025-10-01",
  "endDate": "2025-10-31"
}
```

### Optional Filters
- `month`: "YYYY-MM" format (e.g., "2025-10") - automatically converts to date range
- `Classification`: "Definition Updates" | "Security Updates" | "Critical Updates" | "Feature Updates"
- `Patch_status`: Status of patch (e.g., "Installed", "Pending", "Failed")
- `Site_name`: Filter by specific site/branch
- `startDate`: "YYYY-MM-DD" format (overrides month if provided)
- `endDate`: "YYYY-MM-DD" format (overrides month if provided)

### Response

```json
{
  "summary": {
    "totalPatches": 1250,
    "totalInstalled": 1100,
    "totalPending": 100,
    "totalFailed": 50,
    "overallComplianceRate": 88.0,
    "dateRange": {
      "start": "2025-10-01",
      "end": "2025-10-07"
    },
    "uniqueSites": 12,
    "uniqueDevices": 150
  },
  "complianceByPatchType": [
    {
      "patchType": "Definition Updates",
      "totalPatches": 600,
      "installed": 580,
      "pending": 15,
      "failed": 5,
      "complianceRate": 96.67
    },
    {
      "patchType": "Security Updates",
      "totalPatches": 400,
      "installed": 350,
      "pending": 40,
      "failed": 10,
      "complianceRate": 87.5
    },
    {
      "patchType": "Critical Updates",
      "totalPatches": 250,
      "installed": 170,
      "pending": 45,
      "failed": 35,
      "complianceRate": 68.0
    }
  ],
  "temporalTrend": [
    {
      "date": "2025-10-01",
      "installed": 150,
      "pending": 20,
      "failed": 5,
      "total": 175,
      "byClassification": {
        "Security Updates": {
          "installed": 80,
          "pending": 10,
          "failed": 2,
          "total": 92
        },
        "Definition Updates": {
          "installed": 70,
          "pending": 10,
          "failed": 3,
          "total": 83
        }
      }
    }
  ],
  "complianceBySite": [
    {
      "siteName": "Hialeah Gardens SPE",
      "totalPatches": 300,
      "installed": 280,
      "pending": 15,
      "failed": 5,
      "complianceRate": 93.33,
      "byClassification": {
        "Security Updates": {
          "installed": 150,
          "pending": 8,
          "failed": 2,
          "total": 160
        }
      }
    }
  ],
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

### Example Use Cases

#### Use Case 1: October 2025 Patch Compliance

```bash
POST /api/v1/patchanalytics
```

```json
{
  "month": "2025-10"
}
```

#### Use Case 2: Security Updates Compliance

```bash
POST /api/v1/patchanalytics
```

```json
{
  "Classification": "Security Updates",
  "month": "2025-10"
}
```

#### Use Case 3: Failed Patches Analysis

```bash
POST /api/v1/patchanalytics
```

```json
{
  "Patch_status": "Failed",
  "startDate": "2025-10-01",
  "endDate": "2025-10-07"
}
```

#### Use Case 4: Site-Specific Compliance

```bash
POST /api/v1/patchanalytics
```

```json
{
  "Site_name": "Hialeah Gardens SPE",
  "month": "2025-10"
}
```

#### Use Case 5: Critical Updates Status

```bash
POST /api/v1/patchanalytics
```

```json
{
  "Classification": "Critical Updates",
  "startDate": "2025-09-01",
  "endDate": "2025-10-31"
}
```

#### Use Case 6: Quarterly Patch Report

```bash
POST /api/v1/patchanalytics
```

```json
{
  "startDate": "2025-07-01",
  "endDate": "2025-09-30"
}
```

---

## 5. Devices

### 5.1 Get Single Device

**Endpoint:** `GET /api/v1/devices/{id}`

**Description:** Retrieve a single device by its ID from the lmmc_devices container.

### Path Parameters
- `id` (required): Device ID

### Response

```json
{
  "data": {
    "id": "3240",
    "doc_type": "lmmc_device",
    "equipmentNumber": "460",
    "Device_name": "HQ-REFER42",
    "Device_monitored": "false",
    "Device_ID": "3240",
    "Device_last_online_status_received_Date": "2025-10-07",
    "Hostname": "50.172.119.226",
    "Inventory_device_type": "Windows PC",
    "last_updated": "2025-10-07T13:29:25.954361Z"
  }
}
```

### Example Use Cases

#### Use Case 1: Get Device by ID

```bash
GET /api/v1/devices/3240
```

#### Use Case 2: Verify Device Exists

```bash
GET /api/v1/devices/5678
```

---

### 5.2 List Devices

**Endpoint:** `POST /api/v1/devices`

**Description:** List devices with optional filters and pagination from the lmmc_devices container.

### Request Body (All Optional)

```json
{
  "pageSize": 100,
  "token": "continuation_token_here",
  "Device_monitored": "true",
  "Inventory_device_type": "Windows PC",
  "Device_name": "HQ-REFER42",
  "q": "search term"
}
```

### Optional Filters
- `pageSize` (number): Number of items per page (1-1000, default: 100)
- `token` (string): Continuation token for pagination
- `Device_monitored`: "true" | "false" - Filter by monitoring status
- `Inventory_device_type`: Filter by device type
- `Device_name`: Filter by exact device name
- `q`: Search query (searches across device name, hostname, equipment number)

### Response

```json
{
  "items": [
    {
      "id": "3240",
      "doc_type": "lmmc_device",
      "equipmentNumber": "460",
      "Device_name": "HQ-REFER42",
      "Device_monitored": "false",
      "Device_ID": "3240",
      "Device_last_online_status_received_Date": "2025-10-07",
      "Hostname": "50.172.119.226",
      "Inventory_device_type": "Windows PC",
      "last_updated": "2025-10-07T13:29:25.954361Z"
    }
  ],
  "continuationToken": "next_page_token_here",
  "meta": {
    "count": 1,
    "hasMore": true
  }
}
```

### Example Use Cases

#### Use Case 1: Get All Devices (No Filters)

```bash
POST /api/v1/devices
```

```json
{}
```

#### Use Case 2: Get Monitored Devices Only

```bash
POST /api/v1/devices
```

```json
{
  "Device_monitored": "true"
}
```

#### Use Case 3: Get Windows PCs

```bash
POST /api/v1/devices
```

```json
{
  "Inventory_device_type": "Windows PC"
}
```

#### Use Case 4: Search Devices by Name or Hostname

```bash
POST /api/v1/devices
```

```json
{
  "q": "HQ-REFER"
}
```

#### Use Case 5: Get Specific Device by Name

```bash
POST /api/v1/devices
```

```json
{
  "Device_name": "HQ-REFER42"
}
```

#### Use Case 6: Paginated Results

```bash
POST /api/v1/devices
```

```json
{
  "pageSize": 50,
  "Device_monitored": "true"
}
```

Then use the continuation token for next page:

```json
{
  "pageSize": 50,
  "token": "continuation_token_from_previous_response",
  "Device_monitored": "true"
}
```

#### Use Case 7: Unmonitored Devices Report

```bash
POST /api/v1/devices
```

```json
{
  "Device_monitored": "false",
  "pageSize": 200
}
```

#### Use Case 8: Search by Equipment Number

```bash
POST /api/v1/devices
```

```json
{
  "q": "460"
}
```

#### Use Case 9: Devices by IP Range (via search)

```bash
POST /api/v1/devices
```

```json
{
  "q": "50.172.119"
}
```

---

### 5.3 Count Devices

**Endpoint:** `POST /api/v1/devices/count`

**Description:** Get the total count of devices with optional filters from the lmmc_devices container.

### Request Body (All Optional)

```json
{
  "Device_monitored": "true",
  "Inventory_device_type": "Windows PC"
}
```

### Optional Filters
- `Device_monitored`: "true" | "false" - Filter by monitoring status
- `Inventory_device_type`: Filter by device type

### Response

```json
{
  "total": 150,
  "bySite": [
    {
      "siteName": "Corporate",
      "count": 45
    },
    {
      "siteName": "Hialeah Gardens SPE",
      "count": 38
    },
    {
      "siteName": "Remote Office",
      "count": 25
    }
  ],
  "filters": {
    "Device_monitored": "true",
    "Inventory_device_type": "Windows PC"
  }
}
```

### Example Use Cases

#### Use Case 1: Total Device Count

```bash
POST /api/v1/devices/count
```

```json
{}
```

**Response:**
```json
{
  "total": 250,
  "bySite": [
    {
      "siteName": "Corporate",
      "count": 85
    },
    {
      "siteName": "Hialeah Gardens SPE",
      "count": 65
    },
    {
      "siteName": "Remote Office",
      "count": 50
    },
    {
      "siteName": "Branch A",
      "count": 30
    },
    {
      "siteName": "Branch B",
      "count": 20
    }
  ]
}
```

#### Use Case 2: Count Monitored Devices

```bash
POST /api/v1/devices/count
```

```json
{
  "Device_monitored": "true"
}
```

**Response:**
```json
{
  "total": 180,
  "bySite": [
    {
      "siteName": "Corporate",
      "count": 65
    },
    {
      "siteName": "Hialeah Gardens SPE",
      "count": 48
    },
    {
      "siteName": "Remote Office",
      "count": 35
    },
    {
      "siteName": "Branch A",
      "count": 22
    },
    {
      "siteName": "Branch B",
      "count": 10
    }
  ],
  "filters": {
    "Device_monitored": "true"
  }
}
```

#### Use Case 3: Count Windows PCs

```bash
POST /api/v1/devices/count
```

```json
{
  "Inventory_device_type": "Windows PC"
}
```

**Response:**
```json
{
  "total": 120,
  "bySite": [
    {
      "siteName": "Corporate",
      "count": 50
    },
    {
      "siteName": "Hialeah Gardens SPE",
      "count": 30
    },
    {
      "siteName": "Remote Office",
      "count": 25
    },
    {
      "siteName": "Branch A",
      "count": 10
    },
    {
      "siteName": "Branch B",
      "count": 5
    }
  ],
  "filters": {
    "Inventory_device_type": "Windows PC"
  }
}
```

#### Use Case 4: Count Monitored Windows PCs

```bash
POST /api/v1/devices/count
```

```json
{
  "Device_monitored": "true",
  "Inventory_device_type": "Windows PC"
}
```

**Response:**
```json
{
  "total": 95,
  "bySite": [
    {
      "siteName": "Corporate",
      "count": 40
    },
    {
      "siteName": "Hialeah Gardens SPE",
      "count": 25
    },
    {
      "siteName": "Remote Office",
      "count": 18
    },
    {
      "siteName": "Branch A",
      "count": 8
    },
    {
      "siteName": "Branch B",
      "count": 4
    }
  ],
  "filters": {
    "Device_monitored": "true",
    "Inventory_device_type": "Windows PC"
  }
}
```

#### Use Case 5: Count Unmonitored Devices

```bash
POST /api/v1/devices/count
```

```json
{
  "Device_monitored": "false"
}
```

**Response:**
```json
{
  "total": 70,
  "bySite": [
    {
      "siteName": "Remote Office",
      "count": 20
    },
    {
      "siteName": "Corporate",
      "count": 18
    },
    {
      "siteName": "Hialeah Gardens SPE",
      "count": 15
    },
    {
      "siteName": "Branch A",
      "count": 10
    },
    {
      "siteName": "Branch B",
      "count": 7
    }
  ],
  "filters": {
    "Device_monitored": "false"
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Invalid request body or parameters
- `NOT_FOUND`: Resource not found
- `AUTH_ERROR`: Authentication failed
- `DATABASE_ERROR`: Database query failed
- `EXTERNAL_API_FAILED`: External API call failed
- `INTERNAL_ERROR`: Internal server error

---

## Authentication

All endpoints use Azure AD authentication with the following configuration:
- **Tenant ID**: Configured via `AZURE_TENANT_ID`
- **Client ID**: Configured via `AZURE_AIXAAI_CLIENT_ID`
- **Client Secret**: Configured via `AZURE_AIXAAI_CLIENT_SECRET`
- **Scope**: Configured via `AIXAAI_API_SCOPE`

Endpoints automatically handle token acquisition and refresh.

---

## Rate Limits

- Default page size: 100 items
- Maximum page size: 1000 items
- Cosmos DB query timeout: 2 minutes

---

## Best Practices

1. **Pagination**: Always use continuation tokens for large result sets
2. **Date Filters**: Use ISO 8601 format for all date fields
3. **Search Queries**: Use specific search terms for better performance
4. **Error Handling**: Always check the `success` field in responses
5. **Caching**: Consider caching frequently accessed data
6. **Month Filters**: Use `month` parameter instead of calculating date ranges manually

---

## Environment Variables

Required environment variables:

```env
# Azure AD Configuration
AZURE_TENANT_ID=your-tenant-id
AZURE_AIXAAI_CLIENT_ID=your-client-id
AZURE_AIXAAI_CLIENT_SECRET=your-client-secret
AIXAAI_API_SCOPE=your-api-scope

# API URLs
AIXAAI_OPENAI_QUERY_API_URL=https://your-openai-api-url
AIXXAAI_COGNITIVE_SEARCH_API_URL=https://your-cognitive-search-url

# Cosmos DB Configuration
COSMOS_ENDPOINT=https://your-cosmos-db.documents.azure.com:443/
COSMOS_KEY=your-cosmos-key
COSMOS_DB_NAME=your-database-name
```

---

## Version History

- **v1.0** (2025-10-07): Initial API release
  - OpenAI Query endpoint
  - Cognitive Search endpoint
  - Incident Analytics endpoint
  - Patch Analytics endpoint
  - Devices endpoints (GET, LIST, and COUNT)

---

## Support

For issues or questions, please contact the development team or create an issue in the project repository.
