import React from 'react';
import { useRouter } from 'expo-router';

import { EventFormScreen } from '@/components/events/EventFormScreen';
import type { SubmitResult } from '@/components/events/EventFormScreen';

export default function CreateEventScreen() {
  const router = useRouter();

  return (
    <EventFormScreen
      mode="create"
      title="Publicar nuevo evento"
      submitLabel="Publicar evento"
      successMessage="¡Evento publicado con éxito en LebriJaleo!"
      onSubmitSuccess={(result: SubmitResult) => {
        const createdEvent = Array.isArray(result?.data) ? result.data[0] : result?.data;
        if (createdEvent?.id_evento) {
          router.replace({
            pathname: '/event/[id]',
            params: { id: String(createdEvent.id_evento) },
          });
        } else {
          router.replace('/(tabs)/my-events');
        }
      }}
    />
  );
}
