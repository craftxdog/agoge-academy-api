export type AccessScope = 'tenant' | 'self' | 'public';

export function inferAccessScopeFromPermission(
  permissionKey?: string | null,
): AccessScope {
  if (!permissionKey) {
    return 'public';
  }

  return permissionKey.includes('.self.') ? 'self' : 'tenant';
}
