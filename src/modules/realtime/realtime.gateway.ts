import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Logger, UnauthorizedException } from '@nestjs/common';
import {
  extractBearerToken,
  JwtAccessPayload,
  REALTIME_CONNECTED_EVENT,
  REALTIME_CONTEXT_EVENT,
  REALTIME_ERROR_EVENT,
  REALTIME_NAMESPACE,
  REALTIME_PING_EVENT,
  REALTIME_SYNC_EVENT,
  isRealtimeManagedRoom,
  realtimeMemberRoom,
  realtimeOrganizationRoom,
  realtimeUserRoom,
  resolveLiveAccessContext,
} from '../../common';
import { getAppConfig, getJwtConfig } from '../../config';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeService } from './realtime.service';
import {
  RealtimeSocketAuthContext,
  RealtimeSyncPayload,
} from './realtime.types';
import { Server, Socket } from 'socket.io';

type RealtimeSocket = Socket & {
  data: {
    realtimeAuth?: RealtimeSocketAuthContext;
  };
};

const appConfig = getAppConfig();

@WebSocketGateway({
  namespace: REALTIME_NAMESPACE,
  cors: {
    origin: appConfig.corsOrigins,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit<Server>, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly jwtConfig = getJwtConfig();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
  ) {}

  afterInit(server: Server): void {
    this.realtimeService.registerServer(server);
  }

  async handleConnection(client: RealtimeSocket): Promise<void> {
    try {
      const context = await this.authenticateClient(client);
      await this.bindClientContext(client, context);

      this.realtimeService.emitToClient(
        client,
        REALTIME_CONNECTED_EVENT,
        this.realtimeService.buildConnectionSnapshot(client, context),
      );
    } catch (error) {
      this.handleUnauthorizedClient(client, error);
    }
  }

  handleDisconnect(client: RealtimeSocket): void {
    this.logger.debug(`Realtime client disconnected: ${client.id}`);
  }

  @SubscribeMessage(REALTIME_SYNC_EVENT)
  async handleSync(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: RealtimeSyncPayload = {},
  ) {
    try {
      const context = await this.authenticateClient(
        client,
        payload.accessToken,
      );
      await this.bindClientContext(client, context);
      const snapshot = this.realtimeService.buildConnectionSnapshot(
        client,
        context,
      );

      this.realtimeService.emitToClient(
        client,
        REALTIME_CONTEXT_EVENT,
        snapshot,
      );

      return snapshot;
    } catch (error) {
      this.handleUnauthorizedClient(client, error);
      throw new WsException(this.resolveErrorMessage(error));
    }
  }

  @SubscribeMessage(REALTIME_PING_EVENT)
  handlePing(@ConnectedSocket() client: RealtimeSocket) {
    const context = client.data.realtimeAuth;

    if (!context) {
      throw new WsException('Realtime context is not initialized');
    }

    return this.realtimeService.buildConnectionSnapshot(client, context);
  }

  private async authenticateClient(
    client: RealtimeSocket,
    explicitToken?: string,
  ): Promise<RealtimeSocketAuthContext> {
    const token =
      explicitToken?.trim() || this.extractTokenFromHandshake(client)?.trim();

    if (!token) {
      throw new UnauthorizedException('Realtime access token is required');
    }

    const payload = await this.verifyAccessToken(token);
    const liveAccessContext = await resolveLiveAccessContext(
      this.prisma,
      payload,
    );

    if (
      payload.memberId &&
      payload.organizationId &&
      !liveAccessContext.member
    ) {
      throw new UnauthorizedException(
        'Organization membership is no longer active',
      );
    }

    const resolvedPayload = this.mergeLiveAccessPayload(
      payload,
      liveAccessContext,
    );

    return {
      token,
      connectedAt: client.data.realtimeAuth?.connectedAt ?? new Date(),
      payload: resolvedPayload,
      managedRooms: this.resolveManagedRooms(resolvedPayload),
    };
  }

  private extractTokenFromHandshake(
    client: RealtimeSocket,
  ): string | undefined {
    const authToken =
      typeof client.handshake.auth?.token === 'string'
        ? client.handshake.auth.token
        : typeof client.handshake.auth?.accessToken === 'string'
          ? client.handshake.auth.accessToken
          : undefined;

    if (authToken) {
      return authToken;
    }

    return extractBearerToken({
      headers: client.handshake.headers as Record<string, string | string[]>,
    });
  }

  private async verifyAccessToken(token: string): Promise<JwtAccessPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(
        token,
        {
          secret: this.jwtConfig.accessSecret,
        },
      );

      if (!payload.sub || !payload.email) {
        throw new Error('Invalid payload');
      }

      if (payload.tokenType && payload.tokenType !== 'access') {
        throw new Error('Invalid token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired realtime token');
    }
  }

  private resolveManagedRooms(payload: JwtAccessPayload): string[] {
    const rooms = [realtimeUserRoom(payload.sub)];

    if (payload.organizationId) {
      rooms.push(realtimeOrganizationRoom(payload.organizationId));
    }

    if (payload.memberId) {
      rooms.push(realtimeMemberRoom(payload.memberId));
    }

    return rooms;
  }

  private mergeLiveAccessPayload(
    payload: JwtAccessPayload,
    liveAccessContext: Awaited<ReturnType<typeof resolveLiveAccessContext>>,
  ): JwtAccessPayload {
    return {
      ...payload,
      organizationId:
        liveAccessContext.organization?.id ?? payload.organizationId,
      organizationSlug:
        liveAccessContext.organization?.slug ?? payload.organizationSlug,
      memberId: liveAccessContext.member?.id ?? payload.memberId,
      roles: liveAccessContext.member?.roles ?? payload.roles,
      permissions: liveAccessContext.member?.permissions ?? payload.permissions,
      enabledModules:
        liveAccessContext.member?.enabledModules ?? payload.enabledModules,
    };
  }

  private async bindClientContext(
    client: RealtimeSocket,
    context: RealtimeSocketAuthContext,
  ): Promise<void> {
    const previousRooms = [...(client.data.realtimeAuth?.managedRooms ?? [])];

    for (const room of previousRooms) {
      await client.leave(room);
    }

    for (const room of context.managedRooms) {
      await client.join(room);
    }
    client.data.realtimeAuth = context;

    this.logger.debug(
      `Realtime client ${client.id} bound to rooms: ${context.managedRooms.join(', ')}`,
    );
  }

  private handleUnauthorizedClient(
    client: RealtimeSocket,
    error: unknown,
  ): void {
    this.realtimeService.emitToClient(client, REALTIME_ERROR_EVENT, {
      code: 'realtime_unauthorized',
      message: this.resolveErrorMessage(error),
    });

    for (const room of [...client.rooms].filter(isRealtimeManagedRoom)) {
      void client.leave(room);
    }

    client.disconnect(true);
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof UnauthorizedException) {
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Realtime authentication failed';
  }
}
