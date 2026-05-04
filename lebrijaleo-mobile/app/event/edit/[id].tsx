import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { EventFormScreen } from '@/components/events/EventFormScreen';
import { API_URL, type EventDetail } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function EditEventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  const [eventData, setEventData] = useState<EventDetail | null>(null);
  const [isPastEvent, setIsPastEvent] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      if (!id) {
        setLoadingError('No se pudo identificar el evento.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/eventos/${id}`);
        if (!response.ok) {
          throw new Error('No se pudo cargar el evento');
        }

        const data = (await response.json()) as EventDetail;
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace('/login');
          return;
        }

        const userId = session.user.id;
        if (userId !== data.id_empresario && userId !== data.empresario_creado_por) {
          setLoadingError('No tienes permisos para editar este evento.');
          setIsLoading(false);
          return;
        }

        const isoDate = data.fecha && data.hora ? `${data.fecha}T${data.hora.slice(0, 5)}:00` : '';
        const parsedDate = isoDate ? new Date(isoDate) : null;
        if (parsedDate && !Number.isNaN(parsedDate.getTime()) && parsedDate < new Date()) {
          setIsPastEvent(true);
        }

        setEventData(data);
      } catch (error) {
        console.error('Error fetching event:', error);
        setLoadingError('Error al cargar el evento.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvent();
  }, [id, router]);

  const initialValues = useMemo(() => {
    if (!eventData) return null;
    return {
      title: eventData.nombre || '',
      category: eventData.categoria || '',
      date: eventData.fecha && eventData.hora ? `${eventData.fecha}T${eventData.hora.slice(0, 5)}:00` : '',
      description: eventData.descripcion || '',
      location: eventData.lugar || '',
      price:
        eventData.precio === 0 || eventData.precio === null || eventData.precio === undefined
          ? '0'
          : String(eventData.precio),
      capacity: eventData.aforo_max ? String(eventData.aforo_max) : '',
      ticketLink: eventData.ticketLink || '',
      isFree: eventData.precio === 0,
    };
  }, [eventData]);

  return (
    <EventFormScreen
      mode="edit"
      eventId={id}
      title="Editar Evento"
      submitLabel="Guardar Cambios"
      successMessage="¡Evento actualizado con éxito!"
      isPastEvent={isPastEvent}
      isLoading={isLoading}
      loadingError={loadingError}
      initialValues={initialValues}
      initialImage={eventData?.cartel_url || ''}
      onSubmitSuccess={() => {
        router.replace({
          pathname: '/event/[id]',
          params: { id: String(id) },
        });
      }}
      onDeleteSuccess={() => {
        router.replace('/(tabs)/my-events');
      }}
    />
  );
}
