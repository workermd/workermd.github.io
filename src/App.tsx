import { useEffect, useState } from 'react';
import { Panel, Flex, Typography, Button, Spinner } from '@maxhub/max-ui';

declare const WebApp: any;

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

async function fetchBookings(): Promise<Booking[]> {
    const response = await fetch('https://rgp.mfc.tomsk.ru/bookings/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: WebApp.initData }),
    });

    if (!response.ok) {
        throw new Error(`Request for bookings failed with status ${response.status}`);
    }

    return response.json() as Promise<Booking[]>;
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
    const [index, setIndex] = useState<number>(0);
    const [visible, setVisible] = useState<boolean>(true);

    useEffect(() => {
        fetchBookings()
            .then((fetched) => {
                setBookings(fetched);
                WebApp.ready();
            })
            .catch((e) => {
                console.error(e);
                setLoadError('Не удалось получить данные. Попробуйте обратиться позже');
                WebApp.ready(); // still signal ready so the skeleton clears
            });
    }, []);

    if (bookings === null) {
        return (
            <Panel centeredX centeredY>
                {loadError ? (
                    <Typography.Body variant="medium">{loadError}</Typography.Body>
                ) : (
                    <Spinner />
                )}
            </Panel>
        );
    }

    const current = bookings[index];
    const isDone = index >= bookings.length;

    const handleAnswer = (id: string, status: Status) => {
        const statusUpdate: StatusUpdate = {id, status}

        updateBookingStatus(statusUpdate);

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
