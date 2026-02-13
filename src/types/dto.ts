/** DTOs para bodies de las rutas (evitar request.body as any) */

export interface RegisterBody {
  username?: string;
  email?: string;
  password?: string;
}

export interface LoginBody {
  username?: string;
  email?: string;
  password?: string;
}

export interface UpdateProfileBody {
  username?: string;
  email?: string;
}

export interface TargetUsernameBody {
  targetUsername?: string;
}

export interface ChatMessageBody {
  content?: string;
}

export interface MoveBody {
  position?: number;
}
