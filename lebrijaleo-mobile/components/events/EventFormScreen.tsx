import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';
import { useRouter } from 'expo-router';

import { COLORS } from '@/constants/theme';
import { API_URL, type EventFormValues } from '@/lib/api';
import { getFriendlyErrorMessage } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

type FormMode = 'create' | 'edit';

type FormErrorKey = keyof EventFormValues | 'image';

type FormErrors = Partial<Record<FormErrorKey, string>>;

export type SubmitResult = {
  data?: Array<{ id_evento?: string | number }> | { id_evento?: string | number };
};

type EventFormScreenProps = {
  mode: FormMode;
  eventId?: string;
  initialValues?: Partial<EventFormValues> | null;
  initialImage?: string;
  title: string;
  submitLabel: string;
  successMessage: string;
  isPastEvent?: boolean;
  isLoading?: boolean;
  loadingError?: string;
  onSubmitSuccess?: (result: SubmitResult) => void;
  onDeleteSuccess?: () => void;
};

type FieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

type BottomSheetProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

type ImagePickerAsset = ImagePicker.ImagePickerAsset | null;

LocaleConfig.locales.es = {
  monthNames: [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

const AVAILABLE_CATEGORIES = ['Música', 'Teatro', 'Gastronomía', 'Arte', 'Deporte', 'Cultura'];

const DEFAULT_POSTER = 'https://images.unsplash.com/photo-1533174000222-edfe3abc5496?q=80&w=2070';

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function toEventDateTime(dateKey: string, timeValue: string): Date | null {
  if (!dateKey || !timeValue) return null;
  const value = new Date(`${dateKey}T${timeValue}:00`);
  if (Number.isNaN(value.getTime())) return null;
  return value;
}

function getDefaultTime(): string {
  return '21:00';
}

function getInitialState(initialValues?: Partial<EventFormValues> | null): EventFormValues {
  const dateTime = initialValues?.date ? new Date(initialValues.date) : null;
  const dateKey =
    dateTime && !Number.isNaN(dateTime.getTime()) ? dateTime.toISOString().split('T')[0] : '';
  const timeValue =
    dateTime && !Number.isNaN(dateTime.getTime())
      ? `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`
      : '';

  return {
    title: initialValues?.title || '',
    category: initialValues?.category || '',
    date: dateKey,
    time: timeValue,
    description: initialValues?.description || '',
    location: initialValues?.location || '',
    price: initialValues?.price ?? '',
    capacity: initialValues?.capacity ?? '',
    ticketLink: initialValues?.ticketLink || '',
    isFree: Boolean(initialValues?.isFree),
  };
}

export function EventFormScreen({
  mode,
  eventId,
  initialValues,
  initialImage,
  title,
  submitLabel,
  successMessage,
  isPastEvent = false,
  isLoading = false,
  loadingError = '',
  onSubmitSuccess,
  onDeleteSuccess,
}: EventFormScreenProps) {
  const router = useRouter();
  const [formData, setFormData] = useState(() => getInitialState(initialValues));
  const [imagePreview, setImagePreview] = useState(initialImage || '');
  const [imageAsset, setImageAsset] = useState<ImagePickerAsset>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'warning' | 'error' | 'success'>('info');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(false);

  useEffect(() => {
    setFormData(getInitialState(initialValues));
    setImagePreview(initialImage || '');
  }, [initialImage, initialValues]);

  const selectedDateText = useMemo(() => {
    if (!formData.date) return 'Selecciona una fecha';
    const parsedDate = new Date(`${formData.date}T12:00:00`);
    if (Number.isNaN(parsedDate.getTime())) return formData.date;
    return parsedDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [formData.date]);

  const handleChange = <K extends keyof EventFormValues>(field: K, value: EventFormValues[K]) => {
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
    setFormData((prev) => {
      if (field === 'isFree') {
        const nextIsFree = value as boolean;
        return {
          ...prev,
          isFree: nextIsFree,
          price: nextIsFree ? '0' : prev.price === '0' ? '' : prev.price,
        };
      }
      return { ...prev, [field]: String(value) };
    });
  };

  const handlePickImage = async () => {
    if (isPastEvent) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAlertMessage('Necesitamos permiso para acceder a tu galería.');
      setAlertType('warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: mode === 'create' ? [4, 5] : [16, 9],
      quality: 0.9,
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setImageAsset(asset);
      setImagePreview(asset.uri);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const eventDate = toEventDateTime(formData.date, formData.time);

    if (!formData.title.trim()) errors.title = 'El título es obligatorio.';
    if (!formData.category) errors.category = 'Selecciona una categoría.';
    if (!formData.description.trim()) errors.description = 'La descripción es obligatoria.';
    if (!formData.location.trim()) errors.location = 'El lugar es obligatorio.';
    if (!formData.date) errors.date = 'Selecciona una fecha.';
    if (!formData.time || !/^\d{2}:\d{2}$/.test(formData.time)) {
      errors.time = 'Introduce una hora válida en formato HH:MM.';
    }
    if (!eventDate) {
      errors.date = errors.date || 'La fecha del evento no es válida.';
    } else if (eventDate < new Date() && !isPastEvent) {
      errors.date = 'La fecha seleccionada no puede ser anterior al momento actual.';
    }
    if (!formData.isFree) {
      const parsedPrice = Number(formData.price);
      if (!formData.price || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        errors.price = 'El precio es obligatorio y debe ser mayor a 0€.';
      }
    }
    if (formData.capacity && Number(formData.capacity) <= 0) {
      errors.capacity = 'El aforo debe ser mayor que 0.';
    }
    if (formData.ticketLink && !/^https?:\/\//i.test(formData.ticketLink)) {
      errors.ticketLink = 'El enlace debe empezar por http:// o https://';
    }
    if (mode === 'create' && !imageAsset && !imagePreview) {
      errors.image = 'Sube una imagen de portada para tu evento.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildFormData = async (): Promise<FormData> => {
    const multipart = new FormData();
    if (imageAsset?.uri) {
      try {
        const response = await fetch(imageAsset.uri);
        const blob = await response.blob();
        const filename =
          imageAsset.fileName || `event-banner.${imageAsset.mimeType?.split('/')[1] || 'jpg'}`;
        multipart.append('banner', blob, filename);
      } catch (error) {
        console.error('Error converting image URI to blob:', error);
        throw new Error('No se pudo procesar la imagen. Intenta de nuevo.');
      }
    }

    const datetime = `${formData.date}T${formData.time || getDefaultTime()}`;
    multipart.append('title', formData.title.trim());
    multipart.append('category', formData.category);
    multipart.append('date', datetime);
    multipart.append('description', formData.description.trim());
    multipart.append('location', formData.location.trim());
    multipart.append('price', formData.isFree ? '0' : String(formData.price || '0'));
    multipart.append('capacity', String(formData.capacity || ''));
    multipart.append('ticketLink', formData.ticketLink.trim());
    multipart.append('isFree', formData.isFree ? 'true' : 'false');
    return multipart;
  };

  const handleSubmit = async () => {
    if (isPastEvent || isSaving) return;
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) {
        router.push('/login');
        return;
      }

      const formDataPayload = await buildFormData();
      const response = await fetch(
        mode === 'edit' ? `${API_URL}/api/eventos/${eventId}` : `${API_URL}/api/eventos`,
        {
          method: mode === 'edit' ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataPayload,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setAlertMessage(
          getFriendlyErrorMessage(
            errorData,
            mode === 'edit'
              ? 'No se ha podido actualizar el evento. Revisa los campos e inténtalo de nuevo.'
              : 'No se ha podido publicar el evento. Revisa los campos e inténtalo de nuevo.',
          ),
        );
        setAlertType('error');
        return;
      }

      const result = (await response.json().catch(() => ({}))) as SubmitResult;
      setAlertMessage(successMessage);
      setAlertType('success');

      setTimeout(() => {
        if (onSubmitSuccess) {
          onSubmitSuccess(result);
          return;
        }

        const createdEvent = Array.isArray(result?.data) ? result.data[0] : result?.data;
        if (createdEvent?.id_evento) {
          router.replace({ pathname: '/event/[id]', params: { id: String(createdEvent.id_evento) } });
        } else if (mode === 'edit' && eventId) {
          router.replace({ pathname: '/event/[id]', params: { id: String(eventId) } });
        } else {
          router.replace('/(tabs)/my-events');
        }
      }, 1200);
    } catch (error) {
      console.error('Error enviando evento:', error);
      setAlertMessage(
        mode === 'edit'
          ? 'No se ha podido conectar con el servidor para actualizar el evento.'
          : 'No se ha podido conectar con el servidor para publicar el evento.',
      );
      setAlertType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventId || isDeleting) return;

    Alert.alert('Eliminar evento', '¿Seguro que quieres eliminar este evento? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsDeleting(true);
            const {
              data: { session },
            } = await supabase.auth.getSession();

            const token = session?.access_token;
            if (!token) {
              router.push('/login');
              return;
            }

            const response = await fetch(`${API_URL}/api/eventos/${eventId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              setAlertMessage(
                getFriendlyErrorMessage(
                  errorData,
                  'No se ha podido eliminar el evento. Revisa tus permisos e inténtalo de nuevo.',
                ),
              );
              setAlertType('error');
              return;
            }

            if (onDeleteSuccess) {
              onDeleteSuccess();
            } else {
              router.replace('/(tabs)/my-events');
            }
          } catch (error) {
            console.error('Error deleting event:', error);
            setAlertMessage('No se ha podido conectar con el servidor para eliminar el evento.');
            setAlertType('error');
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.midnightBlue} />
      </View>
    );
  }

  if (loadingError) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorTitle}>{loadingError}</Text>
        <TouchableOpacity style={styles.primaryActionButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.primaryActionButtonText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            mode === 'edit' && eventId
              ? router.push({ pathname: '/event/[id]', params: { id: String(eventId) } })
              : router.back()
          }
          style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color={COLORS.midnightBlue} />
          <Text style={styles.backButtonText}>
            {mode === 'edit' ? 'Volver al Evento' : 'Volver'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuCircle} onPress={() => setIsTipsOpen(true)}>
          <MaterialIcons name="menu" size={22} color={COLORS.midnightBlue} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>{title}</Text>

        {alertMessage ? (
          <View
            style={[
              styles.alertBox,
              alertType === 'success'
                ? styles.alertSuccess
                : alertType === 'error'
                  ? styles.alertError
                  : styles.alertWarning,
            ]}>
            <Text
              style={[
                styles.alertText,
                alertType === 'success'
                  ? styles.alertSuccessText
                  : alertType === 'error'
                    ? styles.alertErrorText
                    : styles.alertWarningText,
              ]}>
              {alertMessage}
            </Text>
          </View>
        ) : null}

        {isPastEvent ? (
          <View style={styles.warningCard}>
            <MaterialIcons name="warning" size={22} color={COLORS.red500} />
            <View style={styles.warningTextWrap}>
              <Text style={styles.warningTitle}>Evento finalizado</Text>
              <Text style={styles.warningText}>
                Los eventos pasados no se pueden modificar para mantener la integridad de la cartelera.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.sectionCard, isPastEvent && styles.sectionCardDisabled]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialIcons name="info-outline" size={22} color="rgba(15, 23, 42, 0.7)" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Información básica</Text>
              <Text style={styles.sectionSubtitle}>Detalles principales del evento.</Text>
            </View>
          </View>

          <Field label="Título del evento" error={formErrors.title}>
            <TextInput
              value={formData.title}
              onChangeText={(value) => handleChange('title', value)}
              editable={!isPastEvent}
              placeholder="Ej: Concierto de Jazz en la Plaza"
              placeholderTextColor="rgba(15, 23, 42, 0.35)"
              style={styles.input}
            />
          </Field>

          <Field label="Categoría" error={formErrors.category}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => !isPastEvent && setIsCategoryOpen(true)}
              style={styles.selectInput}>
              <Text style={formData.category ? styles.selectText : styles.selectPlaceholder}>
                {formData.category || 'Selecciona una categoría'}
              </Text>
              <MaterialIcons name="expand-more" size={24} color="rgba(15, 23, 42, 0.5)" />
            </TouchableOpacity>
          </Field>

          <Field label="Fecha" error={formErrors.date}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => !isPastEvent && setIsCalendarOpen(true)}
              style={styles.selectInput}>
              <View style={styles.selectContentRow}>
                <MaterialIcons name="calendar-today" size={18} color="rgba(15, 23, 42, 0.55)" />
                <Text style={formData.date ? styles.selectText : styles.selectPlaceholder}>
                  {formData.date ? selectedDateText : 'Selecciona una fecha'}
                </Text>
              </View>
            </TouchableOpacity>
          </Field>

          <Field label="Hora" error={formErrors.time}>
            <View style={styles.inputWithIcon}>
              <MaterialIcons name="schedule" size={18} color="rgba(15, 23, 42, 0.55)" />
              <TextInput
                value={formData.time}
                onChangeText={(value) => handleChange('time', value)}
                editable={!isPastEvent}
                placeholder="21:30"
                placeholderTextColor="rgba(15, 23, 42, 0.35)"
                autoCapitalize="none"
                style={styles.inputInline}
              />
            </View>
          </Field>

          <Field label="Descripción" error={formErrors.description}>
            <TextInput
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
              editable={!isPastEvent}
              multiline
              textAlignVertical="top"
              maxLength={500}
              placeholder="Describe de qué trata el evento, quiénes actúan, qué incluye la entrada..."
              placeholderTextColor="rgba(15, 23, 42, 0.35)"
              style={styles.textarea}
            />
            <Text style={styles.counterText}>{formData.description.length}/500 caracteres</Text>
          </Field>

          <Field label="Lugar" error={formErrors.location}>
            <View style={styles.inputWithIcon}>
              <MaterialIcons name="location-on" size={18} color="rgba(15, 23, 42, 0.55)" />
              <TextInput
                value={formData.location}
                onChangeText={(value) => handleChange('location', value)}
                editable={!isPastEvent}
                placeholder="Buscar ubicación..."
                placeholderTextColor="rgba(15, 23, 42, 0.35)"
                style={styles.inputInline}
              />
            </View>
          </Field>
        </View>

        <View style={[styles.sectionCard, isPastEvent && styles.sectionCardDisabled]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialIcons name="local-activity" size={22} color="rgba(15, 23, 42, 0.7)" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Entradas y Precio</Text>
              <Text style={styles.sectionSubtitle}>Gestiona la capacidad y el coste de las entradas.</Text>
            </View>
          </View>

          <View style={styles.freeRow}>
            <Text style={styles.fieldLabel}>Gratis</Text>
            <Switch
              value={formData.isFree}
              onValueChange={(value) => handleChange('isFree', value)}
              disabled={isPastEvent}
              trackColor={{ false: COLORS.nimbusCloud, true: COLORS.lemonIcingDark }}
              thumbColor={COLORS.white}
            />
          </View>

          <Field label="Precio de entrada" error={formErrors.price}>
            <View style={styles.inputWithIcon}>
              <Text style={styles.currencyMark}>€</Text>
              <TextInput
                value={String(formData.price ?? '')}
                onChangeText={(value) => handleChange('price', value.replace(',', '.'))}
                editable={!formData.isFree && !isPastEvent}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="rgba(15, 23, 42, 0.35)"
                style={styles.inputInline}
              />
            </View>
          </Field>

          <Field label="Capacidad / Aforo" error={formErrors.capacity}>
            <View style={styles.inputWithIcon}>
              <MaterialIcons name="groups" size={18} color="rgba(15, 23, 42, 0.55)" />
              <TextInput
                value={String(formData.capacity ?? '')}
                onChangeText={(value) => handleChange('capacity', value)}
                editable={!isPastEvent}
                keyboardType="number-pad"
                placeholder="Ej: 150 personas"
                placeholderTextColor="rgba(15, 23, 42, 0.35)"
                style={styles.inputInline}
              />
            </View>
          </Field>

          <Field label="Enlace de venta (Opcional)" error={formErrors.ticketLink}>
            <View style={styles.inputWithIcon}>
              <MaterialIcons name="link" size={18} color="rgba(15, 23, 42, 0.55)" />
              <TextInput
                value={formData.ticketLink}
                onChangeText={(value) => handleChange('ticketLink', value)}
                editable={!isPastEvent}
                autoCapitalize="none"
                keyboardType="url"
                placeholder="https://tusitio.com/venta-entradas"
                placeholderTextColor="rgba(15, 23, 42, 0.35)"
                style={styles.inputInline}
              />
            </View>
            <Text style={styles.helperText}>
              Si vendes entradas en otra plataforma, pega el enlace aquí.
            </Text>
          </Field>
        </View>

        <View style={[styles.sectionCard, isPastEvent && styles.sectionCardDisabled]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialIcons name="image" size={22} color="rgba(15, 23, 42, 0.7)" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Multimedia</Text>
              <Text style={styles.sectionSubtitle}>Añade imágenes para hacer tu evento más atractivo.</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.95}
            disabled={isPastEvent}
            onPress={handlePickImage}
            style={styles.imagePicker}>
            <Image source={{ uri: imagePreview || DEFAULT_POSTER }} style={styles.previewImage} />
            <View style={styles.previewOverlay}>
              <MaterialIcons name={imagePreview ? 'edit' : 'cloud-upload'} size={28} color={COLORS.white} />
              <Text style={styles.previewOverlayText}>
                {imagePreview ? 'Cambiar imagen' : 'Seleccionar archivo'}
              </Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.helperText}>
            {mode === 'create'
              ? 'Recomendamos formato vertical 4:5 para la cartelera móvil.'
              : 'Recomendamos una imagen clara que funcione bien en la cabecera del detalle.'}
          </Text>
          {formErrors.image ? <Text style={styles.fieldError}>{formErrors.image}</Text> : null}
        </View>

        <View style={styles.footerActions}>
          {mode === 'edit' ? (
            <TouchableOpacity
              disabled={isDeleting}
              onPress={handleDeleteEvent}
              style={styles.deleteLinkButton}>
              <Text style={styles.deleteLinkText}>{isDeleting ? 'Eliminando...' : 'Eliminar evento'}</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          <View style={styles.footerButtonsRight}>
            <TouchableOpacity
              onPress={() =>
                mode === 'edit' && eventId
                  ? router.push({ pathname: '/event/[id]', params: { id: String(eventId) } })
                  : router.back()
              }
              style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isSaving || isPastEvent}
              onPress={handleSubmit}
              style={[styles.primaryActionButton, (isSaving || isPastEvent) && styles.primaryActionButtonDisabled]}>
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.midnightBlue} />
              ) : (
                <Text style={styles.primaryActionButtonText}>{submitLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal transparent visible={isCategoryOpen} animationType="slide" onRequestClose={() => setIsCategoryOpen(false)}>
        <BottomSheet title="Selecciona una categoría" onClose={() => setIsCategoryOpen(false)}>
          {AVAILABLE_CATEGORIES.map((category) => (
            <Pressable
              key={category}
              onPress={() => {
                handleChange('category', category);
                setIsCategoryOpen(false);
              }}
              style={[styles.optionRow, formData.category === category && styles.optionRowActive]}>
              <Text style={[styles.optionText, formData.category === category && styles.optionTextActive]}>
                {category}
              </Text>
              {formData.category === category ? (
                <MaterialIcons name="check" size={20} color={COLORS.midnightBlue} />
              ) : null}
            </Pressable>
          ))}
        </BottomSheet>
      </Modal>

      <Modal transparent visible={isCalendarOpen} animationType="slide" onRequestClose={() => setIsCalendarOpen(false)}>
        <BottomSheet title="Selecciona una fecha" onClose={() => setIsCalendarOpen(false)}>
          <Calendar
            minDate={isPastEvent ? undefined : getTodayKey()}
            onDayPress={(day: DateData) => {
              handleChange('date', day.dateString);
              setIsCalendarOpen(false);
            }}
            markedDates={
              formData.date
                ? {
                    [formData.date]: {
                      selected: true,
                      selectedColor: COLORS.lemonIcingDark,
                    },
                  }
                : {}
            }
            theme={{
              calendarBackground: COLORS.white,
              todayTextColor: COLORS.midnightBlue,
              dayTextColor: COLORS.midnightBlue,
              monthTextColor: COLORS.midnightBlue,
              arrowColor: COLORS.midnightBlue,
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '700',
              selectedDayTextColor: COLORS.white,
            }}
          />
        </BottomSheet>
      </Modal>

      <Modal transparent visible={isTipsOpen} animationType="slide" onRequestClose={() => setIsTipsOpen(false)}>
        <BottomSheet title={mode === 'edit' ? 'Estado y consejos' : 'Consejos de publicación'} onClose={() => setIsTipsOpen(false)}>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>{mode === 'edit' ? 'Estado del evento' : 'Publicación'}</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusPulse} />
              <Text style={styles.statusPublishedText}>{mode === 'edit' ? 'Publicado' : 'Listo para publicar'}</Text>
            </View>
          </View>

          <View style={styles.tipSoftCard}>
            <View style={styles.tipSoftHeader}>
              <View style={styles.tipSoftIcon}>
                <MaterialIcons name="lightbulb-outline" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.tipSoftTitle}>Consejos rápidos</Text>
            </View>
            <Text style={styles.tipSoftBullet}>Usa un título corto y llamativo.</Text>
            <Text style={styles.tipSoftBullet}>Verifica siempre la hora exacta.</Text>
            <Text style={styles.tipSoftBullet}>Añade una descripción clara y útil.</Text>
            <Text style={styles.tipSoftBullet}>Elige una imagen de buena calidad.</Text>
          </View>
        </BottomSheet>
      </Modal>
    </SafeAreaView>
  );
}

function Field({ label, error, children }: FieldProps) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function BottomSheet({ title, onClose, children }: BottomSheetProps) {
  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.bottomSheetClose}>
            <MaterialIcons name="close" size={22} color={COLORS.midnightBlue} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bottomSheetContent}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.formBg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cloudDancer,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cloudDancer,
    padding: 24,
    gap: 16,
  },
  errorTitle: {
    color: COLORS.midnightBlue,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  header: {
    height: 68,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(213, 213, 216, 0.4)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    color: COLORS.midnightBlue,
    fontSize: 14,
    fontWeight: '700',
  },
  menuCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(246, 235, 200, 0.45)',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  screenTitle: {
    color: COLORS.midnightBlue,
    fontSize: 28,
    fontWeight: '800',
  },
  alertBox: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  alertSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  alertError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  alertWarning: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  alertText: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertSuccessText: {
    color: '#166534',
  },
  alertErrorText: {
    color: '#b91c1c',
  },
  alertWarningText: {
    color: '#92400e',
  },
  warningCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.red500,
  },
  warningTextWrap: {
    flex: 1,
  },
  warningTitle: {
    color: '#991b1b',
    fontSize: 15,
    fontWeight: '700',
  },
  warningText: {
    color: '#b91c1c',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(213, 213, 216, 0.35)',
    gap: 16,
  },
  sectionCardDisabled: {
    opacity: 0.82,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cloudDancer,
  },
  sectionTitle: {
    color: COLORS.midnightBlue,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: COLORS.slate500,
    fontSize: 13,
    marginTop: 2,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    color: 'rgba(15, 23, 42, 0.9)',
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.nimbusCloud,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    color: COLORS.midnightBlue,
    fontSize: 15,
  },
  selectInput: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.nimbusCloud,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  selectText: {
    color: COLORS.midnightBlue,
    fontSize: 15,
    flex: 1,
    textTransform: 'capitalize',
  },
  selectPlaceholder: {
    color: 'rgba(15, 23, 42, 0.38)',
    fontSize: 15,
    flex: 1,
  },
  inputWithIcon: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.nimbusCloud,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputInline: {
    flex: 1,
    color: COLORS.midnightBlue,
    fontSize: 15,
    minHeight: 50,
  },
  currencyMark: {
    color: 'rgba(15, 23, 42, 0.55)',
    fontSize: 18,
    fontWeight: '700',
  },
  textarea: {
    minHeight: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.nimbusCloud,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    color: COLORS.midnightBlue,
    fontSize: 15,
  },
  counterText: {
    color: COLORS.slate500,
    fontSize: 12,
    textAlign: 'right',
  },
  freeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helperText: {
    color: COLORS.slate500,
    fontSize: 12,
    lineHeight: 18,
  },
  fieldError: {
    color: COLORS.red500,
    fontSize: 12,
    fontWeight: '700',
  },
  imagePicker: {
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.cloudDancer,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  previewOverlayText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  footerActions: {
    marginTop: 8,
    gap: 14,
  },
  footerButtonsRight: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  deleteLinkButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  deleteLinkText: {
    color: COLORS.red500,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryActionButton: {
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: 18,
    backgroundColor: COLORS.lemonIcing,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButtonDisabled: {
    opacity: 0.6,
  },
  primaryActionButtonText: {
    color: COLORS.midnightBlue,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryActionButton: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.nimbusCloud,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionButtonText: {
    color: COLORS.midnightBlue,
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    maxHeight: '86%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(213, 213, 216, 0.32)',
  },
  bottomSheetTitle: {
    color: COLORS.midnightBlue,
    fontSize: 20,
    fontWeight: '800',
  },
  bottomSheetClose: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetContent: {
    paddingTop: 16,
    gap: 12,
  },
  optionRow: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(213, 213, 216, 0.35)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionRowActive: {
    backgroundColor: COLORS.lemonIcing,
    borderColor: COLORS.lemonIcingDark,
  },
  optionText: {
    color: COLORS.midnightBlue,
    fontSize: 15,
    fontWeight: '600',
  },
  optionTextActive: {
    fontWeight: '800',
  },
  tipCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(213, 213, 216, 0.35)',
    backgroundColor: COLORS.white,
    gap: 10,
  },
  tipTitle: {
    color: 'rgba(15, 23, 42, 0.55)',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusPulse: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#22c55e',
  },
  statusPublishedText: {
    color: '#16a34a',
    fontSize: 20,
    fontWeight: '800',
  },
  tipSoftCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: 'rgba(213, 213, 216, 0.28)',
    gap: 10,
  },
  tipSoftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipSoftIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.midnightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipSoftTitle: {
    color: COLORS.midnightBlue,
    fontSize: 16,
    fontWeight: '800',
  },
  tipSoftBullet: {
    color: 'rgba(15, 23, 42, 0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
});
