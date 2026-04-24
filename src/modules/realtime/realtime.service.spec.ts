import { REALTIME_GENERIC_EVENT } from '../../common';
import { RealtimeService } from './realtime.service';

describe('RealtimeService', () => {
  it('publishes both the domain event and the generic realtime event', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const server = { to } as never;
    const service = new RealtimeService();

    service.registerServer(server);

    const envelope = service.publishOrganizationEvent({
      organizationId: 'organization-id',
      domain: 'users',
      resource: 'member',
      action: 'created',
      entityId: 'member-id',
      invalidate: ['users.members'],
      data: { id: 'member-id' },
    });

    expect(to).toHaveBeenNthCalledWith(1, 'organization:organization-id');
    expect(to).toHaveBeenNthCalledWith(2, 'organization:organization-id');
    expect(emit).toHaveBeenNthCalledWith(1, 'users.member.created', envelope);
    expect(emit).toHaveBeenNthCalledWith(2, REALTIME_GENERIC_EVENT, envelope);
  });
});
