export class AuthenticatedAccount {
  channel: { id: string; name: string; avatarFileId: string | null };
  session: object;
  user: object;
}
