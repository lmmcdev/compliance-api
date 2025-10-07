import { DeviceDoc } from './device.doc';
import { DeviceRepository } from './device.repository';
import { DeviceListRequest, DeviceListResponse, DeviceGetResponse, DeviceResponse, DeviceCountRequest, DeviceCountResponse } from './device.dto';
import { NotFoundError } from '../../http';

export class DeviceService {
  private constructor(
    private readonly deviceRepository: DeviceRepository,
  ) {}

  static async createInstance() {
    const deviceRepository = await new DeviceRepository().init();
    return new DeviceService(deviceRepository);
  }

  private mapToResponse(device: DeviceDoc): DeviceResponse {
    return {
      id: device.id,
      doc_type: device.doc_type,
      equipmentNumber: device.equipmentNumber,
      Device_name: device.Device_name,
      Device_monitored: device.Device_monitored,
      Device_ID: device.Device_ID,
      Device_last_online_status_received_Date: device.Device_last_online_status_received_Date,
      Hostname: device.Hostname,
      Inventory_device_type: device.Inventory_device_type,
      Site_name: device.Site_name,
      last_updated: device.last_updated,
    };
  }

  async get(id: string): Promise<DeviceGetResponse> {
    const device = await this.deviceRepository.findById(id);
    if (!device) {
      throw new NotFoundError(`Device with id ${id} not found`);
    }

    return {
      data: this.mapToResponse(device),
    };
  }

  async list(request?: DeviceListRequest): Promise<DeviceListResponse> {
    const result = await this.deviceRepository.list({
      pageSize: request?.pageSize,
      token: request?.token,
      Device_monitored: request?.Device_monitored,
      Inventory_device_type: request?.Inventory_device_type,
      Device_name: request?.Device_name,
      q: request?.q,
    });

    return {
      items: result.items.map((device) => this.mapToResponse(device)),
      continuationToken: result.continuationToken,
      meta: {
        count: result.items.length,
        hasMore: !!result.continuationToken,
      },
    };
  }

  async count(request?: DeviceCountRequest): Promise<DeviceCountResponse> {
    const filters = {
      Device_monitored: request?.Device_monitored,
      Inventory_device_type: request?.Inventory_device_type,
    };

    const total = await this.deviceRepository.count(filters);
    const bySite = await this.deviceRepository.countBySite(filters);

    return {
      total,
      bySite,
      filters: request ? {
        Device_monitored: request.Device_monitored,
        Inventory_device_type: request.Inventory_device_type,
      } : undefined,
    };
  }
}
