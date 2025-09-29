import { IncidentDoc } from './incident.doc';
import { IncidentRepository } from './incident.repository';
import { CreateIncidentSchema } from './incident.dto';
import { NotFoundError } from '../../http';

export class IncidentService {
  private constructor(
    private readonly incidentRepository: IncidentRepository,
  ) {}

  static async createInstance() {
    const incidentRepository = await new IncidentRepository().init();
    return new IncidentService(incidentRepository);
  }

  async create(payload: unknown): Promise<IncidentDoc> {
    const dto = CreateIncidentSchema.parse(payload);

    // Handle different incident types
    if (dto.doc_type === 'compliance_incident') {
      const incidentData = {
        ...dto,
        reportedAt: dto.reportedAt || new Date().toISOString(),
      };
      return this.incidentRepository.create(incidentData);
    } else {
      // IT incident - no need to add reportedAt as it doesn't have this field
      return this.incidentRepository.create(dto);
    }
  }

  async get(id: string, incidentNumber: string): Promise<IncidentDoc | null> {
    const pk = incidentNumber;
    const found = await this.incidentRepository.findById(id, pk);
    if (!found) throw new NotFoundError(`Incident with id ${id} or incidentNumber ${pk} not found`);
    return found;
  }

  async list(opts?: {
    pageSize?: number;
    token?: string;
    q?: string;
    doc_type?: string;
    // IT incident filters
    Ticket_priority?: string;
    Activity_status?: string;
    Ticket_type?: string;
    // Compliance incident filters
    severity?: string;
    status?: string;
    assignedTo?: string;
    sort?: 'createdAt' | 'updatedAt' | 'Ticket_resolved_Date' | 'reportedAt';
    order?: 'ASC' | 'DESC';
  }): Promise<{ items: IncidentDoc[]; continuationToken: string | null }> {
    return this.incidentRepository.list(opts);
  }

  async update(
    id: string,
    incidentNumber: string,
    patch: Partial<Omit<IncidentDoc, 'id' | 'createdAt' | 'incidentNumber'>>,
  ): Promise<IncidentDoc | null> {
    const pk = incidentNumber;
    const found = await this.incidentRepository.findById(id, pk);
    if (!found) throw new NotFoundError(`Incident with id ${id} or incidentNumber ${pk} not found`);
    return this.incidentRepository.update(id, pk, patch);
  }

  async remove(id: string, incidentNumber: string): Promise<void> {
    const pk = incidentNumber;
    const found = await this.incidentRepository.findById(id, pk);
    if (!found) throw new NotFoundError(`Incident with id ${id} or incidentNumber ${pk} not found`);
    return this.incidentRepository.delete(id, pk);
  }
}