import { UsersController } from './users.controller';

describe('UsersController', () => {
  const usersService = {
    listMembers: jest.fn(),
    createMember: jest.fn(),
    getMember: jest.fn(),
    updateMember: jest.fn(),
    updateMemberStatus: jest.fn(),
    removeMember: jest.fn(),
    listInvitations: jest.fn(),
    createInvitation: jest.fn(),
    acceptInvitation: jest.fn(),
    revokeInvitation: jest.fn(),
  };
  let controller: UsersController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsersController(usersService as never);
  });

  it('delegates member requests', async () => {
    const response = { id: 'member-id' };
    const dto = { email: 'coach@agoge.com', firstName: 'Alex', lastName: 'Coach' };
    usersService.listMembers.mockResolvedValue({ items: [response] });
    usersService.createMember.mockResolvedValue(response);
    usersService.getMember.mockResolvedValue(response);
    usersService.updateMember.mockResolvedValue(response);
    usersService.updateMemberStatus.mockResolvedValue(response);
    usersService.removeMember.mockResolvedValue(response);

    await expect(
      controller.listMembers('organization-id', {} as never),
    ).resolves.toEqual({ items: [response] });
    await expect(
      controller.createMember('organization-id', dto as never),
    ).resolves.toBe(response);
    await expect(controller.getMember('organization-id', 'member-id')).resolves.toBe(
      response,
    );
    await expect(
      controller.updateMember('organization-id', 'member-id', dto as never),
    ).resolves.toBe(response);
    await expect(
      controller.updateMemberStatus(
        'organization-id',
        'current-member-id',
        'member-id',
        { status: 'SUSPENDED' } as never,
      ),
    ).resolves.toBe(response);
    await expect(
      controller.removeMember('organization-id', 'current-member-id', 'member-id'),
    ).resolves.toBe(response);
  });

  it('delegates invitation requests', async () => {
    const response = { id: 'invitation-id' };
    usersService.listInvitations.mockResolvedValue({ items: [response] });
    usersService.createInvitation.mockResolvedValue(response);
    usersService.acceptInvitation.mockResolvedValue(response);
    usersService.revokeInvitation.mockResolvedValue(response);

    await expect(
      controller.listInvitations('organization-id', {} as never),
    ).resolves.toEqual({ items: [response] });
    await expect(
      controller.createInvitation(
        'organization-id',
        'member-id',
        { email: 'coach@agoge.com' } as never,
      ),
    ).resolves.toBe(response);
    await expect(
      controller.acceptInvitation({ token: 'some-valid-token-12345' } as never),
    ).resolves.toBe(response);
    await expect(
      controller.revokeInvitation('organization-id', 'invitation-id'),
    ).resolves.toBe(response);
    expect(usersService.createInvitation).toHaveBeenCalledWith({
      organizationId: 'organization-id',
      invitedByMemberId: 'member-id',
      dto: { email: 'coach@agoge.com' },
    });
  });
});
