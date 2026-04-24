import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  REALTIME_GENERIC_EVENT,
  realtimeOrganizationRoom,
} from '../../common/constants/realtime.constant';
import {
  PublishOrganizationEventParams,
  RealtimeConnectionSnapshot,
  RealtimeEventEnvelope,
  RealtimeSocketAuthContext,
} from './realtime.types';
import { Server, Socket } from 'socket.io';
import { PlatformRole } from 'generated/prisma/enums';

@Injectable()
export class RealtimeService {
  private server?: Server;

  registerServer(server: Server): void {
    this.server = server;
  }

  publishOrganizationEvent<T>(
    params: PublishOrganizationEventParams<T>,
  ): RealtimeEventEnvelope<T> {
    const envelope = this.createEnvelope(params);
    const room = realtimeOrganizationRoom(params.organizationId);

    this.server?.to(room).emit(envelope.name, envelope);
    this.server?.to(room).emit(REALTIME_GENERIC_EVENT, envelope);

    return envelope;
  }

  emitToClient<T>(client: Socket, event: string, payload: T): void {
    client.emit(event, payload);
  }

  buildConnectionSnapshot(
    client: Socket,
    context: RealtimeSocketAuthContext,
  ): RealtimeConnectionSnapshot {
    return {
      socketId: client.id,
      namespace: client.nsp.name,
      connectedAt: context.connectedAt.toISOString(),
      user: {
        id: context.payload.sub,
        email: context.payload.email,
        username: context.payload.username,
        firstName: context.payload.firstName,
        lastName: context.payload.lastName,
        platformRole: context.payload.platformRole ?? PlatformRole.USER,
      },
      organization:
        context.payload.organizationId || context.payload.organizationSlug
          ? {
              id: context.payload.organizationId ?? '',
              slug: context.payload.organizationSlug,
            }
          : null,
      member:
        context.payload.memberId && context.payload.organizationId
          ? {
              id: context.payload.memberId,
              roles: context.payload.roles ?? [],
              permissions: context.payload.permissions ?? [],
              enabledModules: context.payload.enabledModules ?? [],
            }
          : null,
      rooms: [...context.managedRooms],
    };
  }

  private createEnvelope<T>(
    params: PublishOrganizationEventParams<T>,
  ): RealtimeEventEnvelope<T> {
    return {
      id: randomUUID(),
      name: `${params.domain}.${params.resource}.${params.action}`,
      domain: params.domain,
      resource: params.resource,
      action: params.action,
      entityId: params.entityId,
      organizationId: params.organizationId,
      occurredAt: new Date().toISOString(),
      invalidate: params.invalidate ?? [],
      data: params.data,
    };
  }
}
