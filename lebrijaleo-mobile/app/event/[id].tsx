import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { COLORS } from '@/constants/theme';
import { API_URL } from '@/lib/api';
import { supabase } from '@/lib/supabase';

type EventDetail = {
  id_evento: number | string;
  nombre?: string;
  descripcion?: string;
  fecha?: string;
  hora?: string;
  lugar?: string;
  categoria?: string;
  precio?: number | string | null;
  aforo_max?: number | null;
  estado?: string;
  cartel_url?: string | null;
  organizador_avatar?: string | null;
  organizador_nombre?: string | null;
  organizador_username?: string | null;
  id_empresario?: string | null;
  empresario_creado_por?: string | null;
};

type FavoriteResponse = {
  count: number;
  is_favorite: boolean;
};

function formatDate(dateString?: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  });
}

function formatTime(timeString?: string) {
  if (!timeString) return '';
  return `${timeString.slice(0, 5)}h`;
}

function getPriceLabel(price?: number | string | null) {
  const numericPrice = typeof price === 'string' ? Number(price) : price;
  if (price === null || price === undefined || numericPrice === 0) {
    return 'Gratis';
  }

  return `${price}€`;
}

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [eventData, setEventData] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  useEffect(() => {
    async function fetchEventData() {
      if (!id) {
        setError('No hemos podido identificar este evento.');
        setIsLoading(false);
        return;
      }

      try {
        setError('');

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setCurrentUser({ id: session.user.id });
        }

        const response = await fetch(`${API_URL}/api/eventos/${id}`);
        if (!response.ok) {
          throw new Error('No se pudo cargar el evento');
        }

        const data = (await response.json()) as EventDetail;
        setEventData(data);

        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const favResponse = await fetch(`${API_URL}/api/eventos/${id}/favoritos`, { headers });
        if (favResponse.ok) {
          const favData = (await favResponse.json()) as FavoriteResponse;
          setFavoritesCount(favData.count);
          setIsFavorite(favData.is_favorite);
        }
      } catch (fetchError) {
        console.error('Error fetching event:', fetchError);
        setError('Lo sentimos, no hemos podido cargar este evento.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEventData();
  }, [id]);

  const canManageEvent = useMemo(() => {
    if (!eventData || !currentUser) return false;
    return (
      eventData.id_empresario === currentUser.id ||
      eventData.empresario_creado_por === currentUser.id
    );
  }, [currentUser, eventData]);

  const handleToggleFavorite = async () => {
    if (!id) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    if (isTogglingFav) return;
    setIsTogglingFav(true);

    try {
      const response = await fetch(`${API_URL}/api/eventos/${id}/favoritos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('No se pudo actualizar favoritos');
      }

      const data = (await response.json()) as FavoriteResponse;
      setFavoritesCount(data.count);
      setIsFavorite(data.is_favorite);
    } catch (toggleError) {
      console.error('Error toggling favorite:', toggleError);
      Alert.alert('Error', 'No se pudo actualizar tus favoritos.');
    } finally {
      setIsTogglingFav(false);
    }
  };

  const handleDeleteEvent = () => {
    if (!eventData || !id) return;

    Alert.alert(
      'Eliminar evento',
      '¿Seguro que quieres eliminar este evento? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const {
                data: { session },
              } = await supabase.auth.getSession();

              if (!session) {
                router.push('/login');
                return;
              }

              const response = await fetch(`${API_URL}/api/eventos/${id}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              });

              if (response.ok) {
                setIsInfoModalOpen(false);
                router.replace('/(tabs)/my-events');
                return;
              }

              const errorData = (await response.json().catch(() => ({}))) as { detail?: string };
              setDeleteMessage(errorData.detail || 'No se ha podido eliminar el evento.');
            } catch (deleteError) {
              console.error('Error deleting event:', deleteError);
              setDeleteMessage('No se ha podido conectar con el servidor para eliminar el evento.');
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.midnightBlue} />
      </View>
    );
  }

  if (error || !eventData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialIcons name="info-outline" size={56} color="rgba(15, 23, 42, 0.35)" />
        <Text style={styles.errorTitle}>Ups... Algo ha fallado</Text>
        <Text style={styles.errorText}>{error || 'No hemos podido cargar el evento.'}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.primaryButtonText}>Volver a la cartelera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const posterUri =
    eventData.cartel_url ||
    'https://images.unsplash.com/photo-1533174000222-edfe3abc5496?q=80&w=2070&auto=format&fit=crop';
  const organizerAvatar =
    eventData.organizador_avatar ||
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color={COLORS.midnightBlue} />
          <Text style={styles.backButtonText}>Volver a la cartelera</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{eventData.estado || 'Publicado'}</Text>
          </View>
          <TouchableOpacity onPress={() => setIsInfoModalOpen(true)} style={styles.menuButton}>
            <MaterialIcons name="menu" size={24} color={COLORS.midnightBlue} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Image source={{ uri: posterUri }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />

          <View style={styles.heroContent}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{eventData.categoria || 'Evento'}</Text>
            </View>

            <Text style={styles.heroTitle}>{eventData.nombre}</Text>

            <TouchableOpacity
              style={styles.organizerCard}
              activeOpacity={0.9}
              onPress={() => {
                if (eventData.id_empresario) {
                  router.push(`/(tabs)/profile/${eventData.id_empresario}`);
                }
              }}>
              <View style={styles.organizerAvatarWrap}>
                <Image source={{ uri: organizerAvatar }} style={styles.organizerAvatar} />
                <View style={styles.organizerOnlineDot} />
              </View>

              <View style={styles.organizerTextWrap}>
                <View style={styles.organizerNameRow}>
                  <Text style={styles.organizerName}>{eventData.organizador_nombre || 'Organizador'}</Text>
                  <MaterialIcons name="verified" size={18} color={COLORS.white} />
                </View>
                <Text style={styles.organizerHandle}>
                  {eventData.organizador_username
                    ? `@${eventData.organizador_username}`
                    : 'Toca para ver perfil'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          {deleteMessage ? <Text style={styles.deleteMessage}>{deleteMessage}</Text> : null}

          <View style={styles.quickGrid}>
            <View style={styles.quickCard}>
              <View style={styles.quickIconWrap}>
                <MaterialIcons name="calendar-today" size={20} color={COLORS.midnightBlue} />
              </View>
              <Text style={styles.quickLabel}>Fecha</Text>
              <Text style={styles.quickValue}>{formatDate(eventData.fecha)}</Text>
            </View>

            <View style={styles.quickCard}>
              <View style={styles.quickIconWrap}>
                <MaterialIcons name="schedule" size={20} color={COLORS.midnightBlue} />
              </View>
              <Text style={styles.quickLabel}>Hora</Text>
              <Text style={styles.quickValue}>{formatTime(eventData.hora)}</Text>
            </View>

            <View style={styles.quickCard}>
              <View style={styles.quickIconWrap}>
                <MaterialIcons name="location-on" size={20} color={COLORS.midnightBlue} />
              </View>
              <Text style={styles.quickLabel}>Lugar</Text>
              <Text style={styles.quickValue} numberOfLines={2}>
                {eventData.lugar || 'Por confirmar'}
              </Text>
            </View>

            <View style={styles.quickCard}>
              <View style={styles.quickIconWrap}>
                <MaterialIcons name="payments" size={20} color={COLORS.midnightBlue} />
              </View>
              <Text style={styles.quickLabel}>Precio</Text>
              <Text style={styles.quickValue}>{getPriceLabel(eventData.precio)}</Text>
            </View>
          </View>

          <View style={styles.infoPanel}>
            <Text style={styles.infoPanelEyebrow}>Entrada general</Text>
            <Text style={styles.infoPanelPrice}>{getPriceLabel(eventData.precio)}</Text>
            <Text style={styles.infoPanelDescription}>
              {Number(eventData.precio) === 0 || eventData.precio === null || eventData.precio === undefined
                ? 'Acceso libre hasta completar aforo. Se recomienda llegar con antelación.'
                : 'Las entradas pueden adquirirse en la plataforma o taquilla del organizador.'}
            </Text>
            {eventData.aforo_max ? (
              <Text style={styles.capacityText}>Aforo máximo: {eventData.aforo_max} personas</Text>
            ) : null}
          </View>

          <View style={styles.favoriteStatsCard}>
            <MaterialIcons name="favorite-border" size={30} color={COLORS.red500} />
            <Text style={styles.favoriteCount}>{favoritesCount}</Text>
            <Text style={styles.favoriteLabel}>Favoritos</Text>
          </View>

          <View style={styles.descriptionCard}>
            <View style={styles.descriptionTitleRow}>
              <MaterialIcons name="info-outline" size={24} color="rgba(15, 23, 42, 0.7)" />
              <Text style={styles.descriptionTitle}>Sobre el evento</Text>
            </View>
            <Text style={styles.descriptionText}>
              {eventData.descripcion || 'El organizador no ha añadido una descripción todavía.'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.favoriteButton,
              isFavorite ? styles.favoriteButtonActive : styles.favoriteButtonDefault,
              isTogglingFav ? styles.favoriteButtonLoading : null,
            ]}
            onPress={handleToggleFavorite}
            activeOpacity={0.9}
            disabled={isTogglingFav}>
            {isTogglingFav ? (
              <ActivityIndicator size="small" color={isFavorite ? COLORS.red500 : COLORS.midnightBlue} />
            ) : (
              <>
                <MaterialIcons
                  name={isFavorite ? 'favorite' : 'favorite-border'}
                  size={24}
                  color={isFavorite ? COLORS.red500 : COLORS.midnightBlue}
                />
                <Text style={isFavorite ? styles.favoriteButtonTextActive : styles.favoriteButtonTextDefault}>
                  {isFavorite ? 'En tus favoritos' : 'Añadir a favoritos'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={isInfoModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsInfoModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsInfoModalOpen(false)} />
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Info del Evento</Text>
              <TouchableOpacity onPress={() => setIsInfoModalOpen(false)} style={styles.bottomSheetClose}>
                <MaterialIcons name="close" size={22} color={COLORS.slate400} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bottomSheetContent}>
              <View style={styles.infoPanel}>
                <Text style={styles.infoPanelEyebrow}>Entrada general</Text>
                <Text style={styles.infoPanelPrice}>{getPriceLabel(eventData.precio)}</Text>
                <Text style={styles.infoPanelDescription}>
                  {Number(eventData.precio) === 0 || eventData.precio === null || eventData.precio === undefined
                    ? 'Acceso libre hasta completar aforo. Se recomienda llegar con antelación.'
                    : 'Las entradas pueden adquirirse en la plataforma o taquilla del organizador.'}
                </Text>
                {eventData.aforo_max ? (
                  <Text style={styles.capacityText}>Aforo máximo: {eventData.aforo_max} personas</Text>
                ) : null}
              </View>

              <View style={styles.favoriteStatsCard}>
                <MaterialIcons name="favorite-border" size={30} color={COLORS.red500} />
                <Text style={styles.favoriteCount}>{favoritesCount}</Text>
                <Text style={styles.favoriteLabel}>Favoritos</Text>
              </View>

              {canManageEvent ? (
                <View style={styles.manageCard}>
                  <View style={styles.manageEyebrowRow}>
                    <MaterialIcons name="verified-user" size={18} color="rgba(15, 23, 42, 0.7)" />
                    <Text style={styles.manageEyebrow}>
                      {eventData.id_empresario === currentUser?.id ? 'Organizador' : 'Admin'}
                    </Text>
                  </View>
                  <Text style={styles.manageTitle}>Gestionar evento</Text>
                  <Text style={styles.manageDescription}>
                    Accede al panel para editar detalles o elimina el evento si ya no debe mostrarse.
                  </Text>

                  <TouchableOpacity
                    style={styles.managePrimaryButton}
                    onPress={() => {
                      setIsInfoModalOpen(false);
                      router.push({
                        pathname: '/event/edit/[id]',
                        params: { id: String(eventData.id_evento) },
                      });
                    }}>
                    <Text style={styles.managePrimaryButtonText}>Acceder</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.manageDangerButton} onPress={handleDeleteEvent}>
                    <Text style={styles.manageDangerButtonText}>Eliminar evento</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingHorizontal: 28,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.midnightBlue,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
    color: COLORS.slate500,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: COLORS.lemonIcing,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: COLORS.midnightBlue,
    fontWeight: '700',
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
    flexShrink: 1,
  },
  backButtonText: {
    color: 'rgba(15, 23, 42, 0.7)',
    fontWeight: '600',
    fontSize: 14,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#047857',
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(246, 235, 200, 0.45)',
  },
  scrollContent: {
    paddingBottom: 28,
  },
  heroSection: {
    height: 400,
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  categoryBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '800',
    marginBottom: 16,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  organizerAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    position: 'relative',
  },
  organizerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  organizerOnlineDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: '#34d399',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  organizerTextWrap: {
    flexShrink: 1,
  },
  organizerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  organizerName: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  organizerHandle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 18,
  },
  deleteMessage: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 18,
    padding: 14,
    fontWeight: '600',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(213, 213, 216, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.formBg,
    marginBottom: 12,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'rgba(15, 23, 42, 0.5)',
    marginBottom: 4,
  },
  quickValue: {
    color: COLORS.midnightBlue,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  infoPanel: {
    backgroundColor: '#fdf9ed',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(246, 235, 200, 0.7)',
  },
  infoPanelEyebrow: {
    color: 'rgba(15, 23, 42, 0.7)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoPanelPrice: {
    color: COLORS.midnightBlue,
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 10,
  },
  infoPanelDescription: {
    color: 'rgba(15, 23, 42, 0.6)',
    fontSize: 13,
    lineHeight: 20,
  },
  capacityText: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(213, 213, 216, 0.45)',
    color: 'rgba(15, 23, 42, 0.82)',
    fontSize: 12,
    fontWeight: '700',
  },
  favoriteStatsCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(213, 213, 216, 0.3)',
    alignItems: 'center',
  },
  favoriteCount: {
    marginTop: 10,
    color: COLORS.midnightBlue,
    fontSize: 32,
    fontWeight: '800',
  },
  favoriteLabel: {
    marginTop: 2,
    color: 'rgba(15, 23, 42, 0.5)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  descriptionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(213, 213, 216, 0.3)',
  },
  descriptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  descriptionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.midnightBlue,
  },
  descriptionText: {
    color: 'rgba(15, 23, 42, 0.7)',
    fontSize: 15,
    lineHeight: 24,
  },
  favoriteButton: {
    minHeight: 62,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  favoriteButtonDefault: {
    backgroundColor: COLORS.lemonIcing,
  },
  favoriteButtonActive: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  favoriteButtonLoading: {
    opacity: 0.75,
  },
  favoriteButtonTextDefault: {
    color: COLORS.midnightBlue,
    fontSize: 17,
    fontWeight: '700',
  },
  favoriteButtonTextActive: {
    color: COLORS.red500,
    fontSize: 17,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '86%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(213, 213, 216, 0.3)',
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.midnightBlue,
  },
  bottomSheetClose: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetContent: {
    paddingTop: 18,
    gap: 18,
  },
  manageCard: {
    backgroundColor: 'rgba(240, 238, 233, 0.8)',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(213, 213, 216, 0.35)',
  },
  manageEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  manageEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(15, 23, 42, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  manageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.midnightBlue,
    marginBottom: 8,
  },
  manageDescription: {
    color: 'rgba(15, 23, 42, 0.6)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  managePrimaryButton: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.midnightBlue,
    marginBottom: 10,
  },
  managePrimaryButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  manageDangerButton: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  manageDangerButtonText: {
    color: COLORS.red500,
    fontWeight: '700',
  },
});
