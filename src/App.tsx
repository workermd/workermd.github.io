import { useEffect, useState } from 'react';
import { Panel, Flex, Typography, Button, Spinner } from '@maxhub/max-ui';
import {
    CONTACT_ERROR_REASONS,
    CONTACT_ERROR_MESSAGES,
    ERROR_PREFIX,
    isWebAppRequestPhone,
    UserRefusedPhoneError,
    ContactRequestError,
} from './contactErrors';

declare const WebApp: any;

interface ContactData {
    phone:    string;
    authDate: string;
    hash:     string;
}

interface Booking {
    id:      string;
    date:    string;
    time:    string;
    address: string;
}

interface StatusUpdate {
    id:     string;
    status: Status;
}

type Status = 'confirmed' | 'cancelled';

async function requestContact(): Promise<ContactData> {
    try {
        return await WebApp.requestContact();
    } catch (e: unknown) {
        if (!isWebAppRequestPhone(e)) {
            throw new Error("Unknown contact request error", { cause: e });
        }

        const reason = e.error.code;

        if (reason === `${ERROR_PREFIX}${CONTACT_ERROR_REASONS.UserRefused}`) {
            throw new UserRefusedPhoneError(e);
        } else if (reason === `${ERROR_PREFIX}${CONTACT_ERROR_REASONS.RequestError}`) {
            throw new ContactRequestError(e);
        }

        throw new Error("Unknown contact request error", { cause: e });
    }
}

async function fetchBookings(contactData: ContactData): Promise<Booking[]> {
    const response = await fetch('https://rgp.mfc.tomsk.ru/bookings/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            init_data:    WebApp.initData,
            contact_data: contactData
        }),
    });

    if (!response.ok) {
        throw new Error(`Request for bookings failed with status ${response.status}`);
    }

    return await response.json() as Booking[];
}

async function updateBookingStatus(statusUpdate: StatusUpdate): Promise<void> {
    const response = await fetch('https://rgp.mfc.tomsk.ru/bookings/response', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(statusUpdate),
        signal:  AbortSignal.timeout(5000)
    });

    if (!response.ok) {
        throw new Error(`Status update failed with status ${response.status}`);
    }
}

const TRANSITION_MS = 200;

const App = () => {
    const [bookings, setBookings] = useState<Booking[] | null>(null); // null = still loading
    const [loadError, setLoadError] = useState<string | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [index, setIndex] = useState<number>(0);
    const [visible, setVisible] = useState<boolean>(true);

    const initialize = () => {
        requestContact()
            .then((contactData) => {
                return fetchBookings(contactData);
            })
            .then((fetchedBookings) => {
                setBookings(fetchedBookings);
                WebApp.ready();
            })
            .catch((e: unknown) => {
                console.error(e);

                if (e instanceof UserRefusedPhoneError) {
                    setLoadError(CONTACT_ERROR_MESSAGES.UserRefused);
                    return;
                }

                setLoadError(CONTACT_ERROR_MESSAGES.Default);
                WebApp.ready();
            });
    };

    useEffect(initialize, []);

    if (bookings === null) {
        return (
            <Panel centeredX centeredY>
                {loadError === null ? (
                    <Spinner />
                ) : loadError === CONTACT_ERROR_MESSAGES.UserRefused ? (
                    <Flex direction="column" align="center" gap={16}>
                        <Typography.Body variant="medium">{loadError}</Typography.Body>
                        <Button
                          mode="primary"
                          stretched={true}
                          onClick={() => initialize()}
                        >
                            Поделиться номером телефона
                        </Button>
                    </Flex>
                ) : (
                    <Typography.Body variant="medium">{loadError}</Typography.Body>
                )}
            </Panel>
        );
    }

    const current = bookings[index];
    const isDone = index >= bookings.length;

    const handleAnswer = async (id: string, status: Status) => {
        setUpdateError(null);

        try {
            await updateBookingStatus({ id, status });
        } catch (e) {
            console.error(e);
            setUpdateError('Не удалось сохранить ответ. Попробуйте ещё раз.');
            return; // don't advance to the next booking — let the user retry
        }

        setVisible(false);

        setTimeout(() => {
            setIndex((i) => i + 1);
            setVisible(true);
        }, TRANSITION_MS);
    };

    const content = isDone ? (
        <Typography.Body variant="medium">
            У вас нет записей, ожидающих подтверждения
        </Typography.Body>
    ) : (
        <Flex direction="column" align="center" gap={16}>
            <Typography.Body variant="medium">
                Вы записаны на {current.date} в {current.time} по следующему адресу: {current.address}
            </Typography.Body>

            <Flex direction="column" gap={8} style={{ width: '100%' }}>
                <Button
                  mode="primary"
                  stretched={true}
                  onClick={() => handleAnswer(current.id, 'confirmed')}
                >
                    Подтвердить запись
                </Button>
                <Button
                  mode="primary"
                  appearance="negative"
                  stretched={true}
                  onClick={() => handleAnswer(current.id, 'cancelled')}
                >
                    Отменить запись
                </Button>
                {updateError !== null && (
                    <Typography.Label variant="medium" style={{ color: 'var(--color-negative, #e53935)' }}>
                        {updateError}
                    </Typography.Label>
                )}
            </Flex>
        </Flex>
    );

    return (
        <Panel
            centeredX
            centeredY
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(8px)',
                transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
                width: '100%',
            }}
        >
            {content}
        </Panel>
    );
};

export default App;
