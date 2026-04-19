import { PrismaService } from '../../database/prisma.service';
import { GenericRepository } from './generic.repository';
import {
  CursorPaginationParams,
  CursorPaginatedRepositoryResult,
  DefaultTypeMap,
  FindAllParams,
  ModelName,
  OffsetPaginationParams,
  OffsetPaginatedRepositoryResult,
  RepositoryTypeMap,
  TenantScopedEntity,
} from './types';

/**
 * Repository base for tenant-owned records.
 *
 * Use this for models with `organizationId` so every domain repository can
 * scope reads and writes by tenant in one obvious place.
 */
export class TenantRepository<
  T extends { id: string } & TenantScopedEntity,
  M extends RepositoryTypeMap = DefaultTypeMap,
> extends GenericRepository<T, M> {
  constructor(prisma: PrismaService, modelName: ModelName) {
    super(prisma, modelName);
  }

  async findAllByOrganization(
    organizationId: string,
    params?: FindAllParams<M>,
  ): Promise<T[]> {
    return this.findAll({
      ...params,
      where: this.withOrganization(organizationId, params?.where),
    } as FindAllParams<M>);
  }

  async findCursorPageByOrganization(
    organizationId: string,
    params: CursorPaginationParams<M>,
  ): CursorPaginatedRepositoryResult<T> {
    return this.findCursorPage({
      ...params,
      where: this.withOrganization(organizationId, params.where),
    });
  }

  async findOffsetPageByOrganization(
    organizationId: string,
    params: OffsetPaginationParams<M>,
  ): OffsetPaginatedRepositoryResult<T> {
    return this.findOffsetPage({
      ...params,
      where: this.withOrganization(organizationId, params.where),
    });
  }

  async countByOrganization(
    organizationId: string,
    where?: M['WhereInput'],
  ): Promise<number> {
    return this.count(this.withOrganization(organizationId, where));
  }

  protected withOrganization(
    organizationId: string,
    where?: M['WhereInput'],
  ): M['WhereInput'] {
    return this.mergeWhere(where, { organizationId });
  }
}
