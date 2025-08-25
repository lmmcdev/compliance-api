import { BaseDoc } from '../../shared/base.doc';

export interface LocationDoc extends BaseDoc {
  name: string;
  description?: string | null;
  locationTypeId: string;
  externalReference?: string | null;
  addressId?: string | null;
  visitorAddressId?: string | null;
  timeZone?: string | null;
  drivingDirections?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  parentLocationId?: string | null;
}
