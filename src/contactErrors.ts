export const CONTACT_ERROR_REASONS = {
    UserRefused:  'user_refused_provide_phone_number',
    RequestError: 'request_error',
} as const;

export type ContactErrorReason = typeof CONTACT_ERROR_REASONS[keyof typeof CONTACT_ERROR_REASONS];

export const ERROR_PREFIX = 'client.request_phone.' as const;

export type ContactErrorCode = `${typeof ERROR_PREFIX}${ContactErrorReason}`;

export const CONTACT_ERROR_MESSAGES = {
    UserRefused: 'Для работы приложения необходимо предоставить номер телефона.',
    Default:     'Не удалось получить данные. Попробуйте обратиться позже.',
} as const;

export interface WebAppRequestPhone {
    error: {
        code: ContactErrorCode;
    };
}

export function isWebAppRequestPhone(e: unknown): e is WebAppRequestPhone {
    return typeof (e as any)?.error?.code === 'string';
}

export class UserRefusedPhoneError extends Error {
    constructor(cause: unknown) {
        super('User refused to provide phone number', { cause });
        this.name = 'UserRefusedPhoneError';
    }
}

export class ContactRequestError extends Error {
    constructor(cause: unknown) {
        super('Error occured when requesting phone', { cause });
        this.name = 'ContactRequestError';
    }
}
