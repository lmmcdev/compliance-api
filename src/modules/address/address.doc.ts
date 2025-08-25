import { BaseDoc } from '../../shared/base.doc';
import { AddressType } from '../../types';

export interface AddressDoc extends BaseDoc {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  county: string;
  addressType: AddressType;
  drivingDirections?: string;
  description?: string | null;
  timeZone?: string;
  lead?: string | null;
  locationTypeId: string;
}
