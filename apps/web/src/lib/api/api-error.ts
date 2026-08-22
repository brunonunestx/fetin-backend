import axios from 'axios';
import { z } from 'zod';

const apiErrorPayloadSchema = z.object({
  code: z.string().optional(),
  correlationId: z.string().optional(),
  message: z.union([z.string(), z.array(z.string())]).optional(),
  statusCode: z.number().optional(),
});

const knownMessages: Record<string, string> = {
  EMAIL_ALREADY_REGISTERED: 'Este e-mail já está cadastrado.',
  FORBIDDEN_USER_TYPE: 'Esta conta não pode acessar essa área.',
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  INVALID_TOKEN: 'Sua sessão venceu. Entre novamente.',
  MISSING_TOKEN: 'Entre na sua conta para continuar.',
};

class ApiError extends Error {
  readonly code: string;
  readonly correlationId?: string;
  readonly details: string[];
  readonly statusCode?: number;

  constructor({
    code,
    correlationId,
    details = [],
    message,
    statusCode,
  }: {
    code: string;
    correlationId?: string;
    details?: string[];
    message: string;
    statusCode?: number;
  }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.correlationId = correlationId;
    this.details = details;
    this.statusCode = statusCode;
  }
}

function translateValidationMessage(messages: string[]): string {
  const joinedMessages = messages.join(' ');

  if (joinedMessages.includes('email must be an email')) {
    return 'Digite um e-mail válido.';
  }

  if (joinedMessages.includes('password must be longer than or equal to 8 characters')) {
    return 'A senha precisa ter pelo menos 8 caracteres.';
  }

  if (joinedMessages.includes('type must be one of the following values')) {
    return 'Escolha se você quer trabalhar ou contratar.';
  }

  return 'Confira os dados informados e tente novamente.';
}

function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (!axios.isAxiosError(error)) {
    return new ApiError({
      code: 'UNEXPECTED_ERROR',
      message: 'Não foi possível concluir. Tente novamente.',
    });
  }

  if (!error.response) {
    return new ApiError({
      code: 'NETWORK_ERROR',
      message: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
    });
  }

  const parsedPayload = apiErrorPayloadSchema.safeParse(error.response.data);
  const payload = parsedPayload.success ? parsedPayload.data : {};
  const statusCode = payload.statusCode ?? error.response.status;
  const code = payload.code ?? `HTTP_${statusCode}`;
  const details = Array.isArray(payload.message)
    ? payload.message
    : payload.message
      ? [payload.message]
      : [];
  const message =
    knownMessages[code] ??
    (statusCode === 400
      ? translateValidationMessage(details)
      : details[0] || 'Não foi possível concluir. Tente novamente.');

  return new ApiError({
    code,
    correlationId: payload.correlationId,
    details,
    message,
    statusCode,
  });
}

function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export { ApiError, isApiError, normalizeApiError };
