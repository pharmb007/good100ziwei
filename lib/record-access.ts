export function recordAccessRole(email: string, administrator?: string, sharedAccount?: string) {
  const normalize = (value?: string) => value?.trim().toLowerCase();
  const signedInEmail = normalize(email);
  const adminEmail = normalize(administrator);
  const sharedEmail = normalize(sharedAccount);
  if (!signedInEmail || !adminEmail || !sharedEmail || adminEmail === sharedEmail) return 'personal';
  if (signedInEmail === adminEmail) return 'administrator';
  if (signedInEmail === sharedEmail) return 'shared';
  return 'personal';
}
