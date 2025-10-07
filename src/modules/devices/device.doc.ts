// Device document interface
export interface DeviceDoc {
  id: string;
  doc_type: 'lmmc_device';
  equipmentNumber?: string;
  Device_name: string;
  Device_monitored?: string;
  Device_ID: string;
  Device_last_online_status_received_Date?: string; // YYYY-MM-DD
  Hostname?: string;
  Inventory_device_type?: string;
  Site_name?: string;
  last_updated: string;
}
