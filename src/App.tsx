import { useState } from 'react';
import { Panel, Flex, Typography, Button } from '@maxhub/max-ui';

interface Item {
    date: string;
    time: string;
    location: string;
}

type Status = 'confirmed' | 'cancelled';

interface Result {
    status: Status;
}

const getItemsFromQuery = (): Item[] => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('data');

    if (!raw) return [];

    try {
        const parsed = JSON.parse(decodeURIComponent(raw));
        return Array.isArray(parsed) ? (parsed as Item[]) : [];
    } catch (e) {
        console.error('Failed to parse `data` query param:', e);
        return [];
    }
};

const TRANSITION_MS = 200;

const App = () => {
    const [items] = useState<Item[]>(getItemsFromQuery);
    const [index, setIndex] = useState<number>(0);
    const [results, setResults] = useState<Result[]>([]);
    const [visible, setVisible] = useState<boolean>(true);

    const current = items[index];
    const isDone = index >= items.length;

    const handleAnswer = (status: Status) => {
        setVisible(false);

        setTimeout(() => {
            setResults((prev) => {
                const next = [...prev, { status }];

                if (index + 1 >= items.length) {
                    // TODO: replace with wherever `results` actually needs to go
                    // (bot callback, API call, window.parent.postMessage, etc.)
                    console.log('All items answered:', next);
                }

                return next;
            });
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
                Вы записаны на {current.date} в {current.time} по следующему адресу: {current.location}
            </Typography.Body>

            <Flex direction="column" gap={8} style={{ width: '100%' }}>
                <Button
                  mode="primary"
                  stretched={true}
                  onClick={() => handleAnswer('confirmed')}
                >
                    Подтвердить запись
                </Button>
                <Button
                  mode="primary"
                  appearance="negative"
                  stretched={true}
                  onClick={() => handleAnswer('cancelled')}
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
