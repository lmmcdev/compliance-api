"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    constructor(ds, entity, opts = {}) {
        this.repo = ds.getRepository(entity);
        this.defaultOrder = opts.defaultOrder;
        this.maxPageSize = opts.maxPageSize ?? 100;
    }
    /** Paged list; pass optional where/order to override defaults */
    async findPaged(page = 1, pageSize = 20, where, order) {
        const take = Math.max(1, Math.min(pageSize, this.maxPageSize));
        const skip = (Math.max(1, page) - 1) * take;
        const [items, total] = await this.repo.findAndCount({
            where,
            order: order ?? this.defaultOrder,
            skip,
            take,
        });
        return { items, page, pageSize: take, total, totalPages: Math.ceil(total / take) };
    }
    /** Get one by id (or any custom options) */
    findById(id, options) {
        return this.repo.findOne({ where: { id }, ...options });
    }
    /** Generic findOne with where/options */
    findOne(where, options) {
        return this.repo.findOne({ where, ...options });
    }
    /** Create & save */
    createOne(data) {
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }
    /** Patch & save by id; returns null if not found */
    async updateOne(id, data) {
        const existing = await this.findById(id);
        if (!existing)
            return null;
        Object.assign(existing, data);
        return this.repo.save(existing);
    }
    /** Soft delete (requires @DeleteDateColumn on the entity) */
    async softDelete(id) {
        await this.repo.softDelete(id);
    }
    /** Restore a soft-deleted row */
    async restore(id) {
        await this.repo.restore(id);
    }
    /** Hard delete (careful!) */
    async hardDelete(id) {
        await this.repo.delete(id);
    }
    /** Count with optional filter */
    count(where) {
        return this.repo.count({ where });
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=base.repository.js.map