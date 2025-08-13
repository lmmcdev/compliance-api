/* import { getLocationRepository } from '../repositories/locationRepository';
import { Location } from '../entities/location';

export class LocationService {
  async getAll(): Promise<Location[]> {
    const repo = await getLocationRepository();
    return repo.find();
  }

  async getById(id: string): Promise<Location | null> {
    try {
      console.log(`Fetching location with ID: ${id}`);
      const repo = await getLocationRepository();
      const location = await repo.findOneBy({ id });
      return location;
    } catch (error) {
      console.error(`Error fetching location with ID ${id}:`, error);
      return null;
    }
  }

  async create(data: Partial<Location>): Promise<Location> {
    const repo = await getLocationRepository();
    const location = repo.create(data);
    return repo.save(location);
  }

  async update(id: string, data: Partial<Location>): Promise<Location | null> {
    const repo = await getLocationRepository();
    const location = await repo.findOneBy({ id });
    if (!location) return null;
    Object.assign(location, data);
    return repo.save(location);
  }

  async delete(id: string): Promise<boolean> {
    const repo = await getLocationRepository();
    const result = await repo.delete(id);
    return !!result.affected && result.affected > 0;
  }
}
 */
