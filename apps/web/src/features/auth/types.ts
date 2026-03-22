export type SessionUser = {
  id: number;
  username?: string;
  firstName?: string;
};

export type AuthResponse = {
  ok: boolean;
  user: SessionUser;
  sessionExpiresAt: number;
};
