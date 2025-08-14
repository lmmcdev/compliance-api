import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum LicenseTypeCode {
  BTL = 'BTL',
  AHC = 'AHC',
  BIOMEDICAL_WASTE = 'Biomedical Waste',
  CAQH = 'CAQH',
  CLIA = 'CLIA',
  CMS = 'CMS',
  CU = 'CU',
  DEA = 'DEA',
  DOH_SANITATION_CERTIFICATE = 'DOH - Sanitation Certificate',
  DRIVER_LICENSE = 'Driver License',
  ELEVATORS = 'Elevators',
  EQUIPMENT_CALIBRATION = 'Equipment Calibration',
  FIRE_PERMIT = 'Fire Permit',
  HCCE = 'HCCE',
  HEALTH_SUN = 'HealthSun',
  MEDICAID = 'Medicaid',
  MEDICAL_LICENSE = 'Medical License',
  OSHA = 'OSHA',
  PROFESSIONAL_LICENSE = 'Professional License',
  RADIATION_CONTROL = 'Radiation Control',
  SIMPLY = 'Simply',
}

@Entity('license_types')
export class LicenseType extends BaseEntity {
  @Column({
    name: 'code',
    type: 'nvarchar',
    length: 128,
    enum: LicenseTypeCode,
  })
  code!: LicenseTypeCode;

  @Column({ name: 'display_name', type: 'nvarchar', length: 128 })
  displayName!: string;

  @Column({ name: 'description', type: 'nvarchar', length: 256, nullable: true })
  description?: string | null;
}
