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

import EventCard from '@/components/events/EventCard';
import { COLORS } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://lebrijaleo-backend.onrender.com';

type UserRole = 'Cliente' | 'Empresario' | 'Administrador' | string;

type EventItem = {
  id?: string | number;
  id_evento?: string | number;
  [key: string]: unknown;
};

type PublicProfile = {
  id?: string;
  nombre?: string;
  username?: string;
  avatar_url?: string;
  banner_url?: string;
  biografia?: string;
  ubicacion?: string;
  rol?: UserRole;
  creado_por?: string | null;
};

export default function PublicProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [profileData, setProfileData] = useState<PublicProfile | null>(null);
  const [eventos, setEventos] = useState<EventItem[]>([]);
  const [favoritos, setFavoritos] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [esAmigo, setEsAmigo] = useState(false);
  const [conteoAmigos, setConteoAmigos] = useState(0);
  const [friendLoading, setFriendLoading] = useState(false);

  const [currentUserRol, setCurrentUserRol] = useState<UserRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [rolLoading, setRolLoading] = useState(false);
  const [removeRolLoading, setRemoveRolLoading] = useState(false);
  const [rolMessage, setRolMessage] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);

  useEffect(() => {
    async function loadPublicProfile() {
      if (!id) {
        setError('Perfil no encontrado.');
        setIsLoading(false);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session && session.user.id === id) {
          router.replace('/(tabs)/profile');
          return;
        }

        if (session) {
          setCurrentUserId(session.user.id);
        }

        const response = await fetch(`${API_URL}/api/perfil/${id}`);

        if (!response.ok) {
          throw new Error('Perfil no encontrado');
        }

        const data = (await response.json()) as {
          perfil: PublicProfile;
          eventos?: EventItem[];
          favoritos?: EventItem[];
        };

        setProfileData(data.perfil);
        setEventos(data.eventos || []);
        setFavoritos(data.favoritos || []);

        const headers: Record<string, string> = {};

        if (session) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const friendRes = await fetch(`${API_URL}/api/amigos/${id}/estado`, { headers });
        if (friendRes.ok) {
          const friendData = (await friendRes.json()) as {
            es_amigo: boolean;
            conteo_amigos: number;
          };
          setEsAmigo(friendData.es_amigo);
          setConteoAmigos(friendData.conteo_amigos);
        }

        if (session) {
          const profileRes = await fetch(`${API_URL}/api/perfil`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });

          if (profileRes.ok) {
            const myProfile = (await profileRes.json()) as { rol?: UserRole };
            setCurrentUserRol(myProfile.rol || null);
          }
        }
      } catch (loadError) {
        console.error('Error cargando perfil publico:', loadError);
        setError('No hemos podido encontrar este perfil.');
      } finally {
        setIsLoading(false);
      }
    }

    loadPublicProfile();
  }, [id, router]);

  const isOrganizer = profileData?.rol === 'Empresario';
  const isAdmin = currentUserRol === 'Administrador';
  const canMakeEmpresario = isAdmin && profileData?.rol === 'Cliente';
  const isAdminCreator = isAdmin && profileData?.creado_por === currentUserId;
  const canRemoveEmpresario = isAdminCreator && profileData?.rol === 'Empresario';
  const canDownloadStats = isOrganizer && isAdminCreator;

  const roleBadge = useMemo(() => {
    if (profileData?.rol === 'Administrador') return 'Administrador';
    if (profileData?.rol === 'Empresario') return 'Organizador';
    return 'Usuario';
  }, [profileData?.rol]);

  const handleToggleFriend = async () => {
    if (!id) return;

    setFriendLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/amigos/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = (await response.json()) as {
          es_amigo: boolean;
          conteo_amigos: number;
        };
        setEsAmigo(data.es_amigo);
        setConteoAmigos(data.conteo_amigos);
      }
    } catch (toggleError) {
      console.error('Error toggling friend:', toggleError);
      Alert.alert('Error', 'No se pudo actualizar la amistad.');
    } finally {
      setFriendLoading(false);
    }
  };

  const handleAsignarRol = async () => {
    if (!id) return;

    setRolLoading(true);
    setRolMessage('');
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch(`${API_URL}/api/admin/asignar-rol/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = (await response.json().catch(() => ({}))) as { mensaje?: string; detail?: string };

      if (!response.ok) {
        throw new Error(data.detail || 'Error al asignar rol');
      }

      setRolMessage(data.mensaje || 'Rol asignado con exito');
      setProfileData((prev) => (prev ? { ...prev, rol: 'Empresario' } : prev));
    } catch (assignError) {
      setRolMessage(assignError instanceof Error ? assignError.message : 'Error de conexion');
    } finally {
      setRolLoading(false);
    }
  };

  const handleQuitarRol = async () => {
    if (!id) return;

    setRemoveRolLoading(true);
    setRolMessage('');
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch(`${API_URL}/api/empresarios/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = (await response.json().catch(() => ({}))) as { mensaje?: string; detail?: string };

      if (!response.ok) {
        throw new Error(data.detail || 'Error al revocar el rol');
      }

      setRolMessage(data.mensaje || 'Rol de organizador revocado con exito');
      setProfileData((prev) => (prev ? { ...prev, rol: 'Cliente', creado_por: null } : prev));
      setEventos([]);
    } catch (removeError) {
      setRolMessage(removeError instanceof Error ? removeError.message : 'Error de conexion');
    } finally {
      setRemoveRolLoading(false);
    }
  };

  const handleDownloadStats = async () => {
    setShowActionPanel(false);
    Alert.alert(
      'Disponible solo en web',
      'La descarga de estadisticas solo se puede realizar desde la web: lebrijaleo.vercel.app',
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.midnightBlue} />
      </View>
    );
  }

  if (error || !profileData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialIcons name="info-outline" size={56} color={COLORS.slate400} />
        <Text style={styles.errorTitle}>Perfil no encontrado</Text>
        <Text style={styles.errorText}>{error || 'Este usuario no existe.'}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.primaryButtonText}>Volver a la cartelera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.nombre || 'U')}&background=F6EBC8&color=1e293b`;
  const defaultBanner = 'https://images.unsplash.com/photo-1518605368461-1ee46062f6b8?q=80&w=2093';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.midnightBlue} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isOrganizer ? 'Perfil de Organizador' : 'Perfil de Usuario'}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowActionPanel(true)} style={styles.iconBtn}>
          <MaterialIcons name="menu" size={24} color={COLORS.midnightBlue} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.coverSection}>
          <Image source={{ uri: profileData.banner_url || defaultBanner }} style={styles.bannerImage} />
          <View style={styles.bannerOverlay} />
          <View style={styles.profileInfoContainer}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: profileData.avatar_url || defaultAvatar }} style={styles.avatarImage} />
            </View>
            <View style={styles.textInfoWrapper}>
              <Text style={styles.userName}>{profileData.nombre || 'Usuario'}</Text>
              {profileData.username ? <Text style={styles.userHandle}>@{profileData.username}</Text> : null}
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{roleBadge}</Text>
              </View>
              {profileData.biografia ? <Text style={styles.userBio}>{profileData.biografia}</Text> : null}
            </View>
          </View>
        </View>

        <View style={styles.bodySection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: isOrganizer ? '#fff7ed' : '#fef2f2' }]}>
                <MaterialIcons
                  name={isOrganizer ? 'event-note' : 'bookmark'}
                  size={22}
                  color={isOrganizer ? '#ea580c' : COLORS.red500}
                />
              </View>
              <View>
                <Text style={styles.statLabel}>{isOrganizer ? 'Eventos publicados' : 'Eventos favoritos'}</Text>
                <Text style={styles.statValue}>{isOrganizer ? eventos.length : favoritos.length}</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#f5f3ff' }]}>
                <MaterialIcons name="group" size={22} color="#7c3aed" />
              </View>
              <View>
                <Text style={styles.statLabel}>Seguidores</Text>
                <Text style={styles.statValue}>{conteoAmigos}</Text>
              </View>
            </View>

            {profileData.ubicacion ? (
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}>
                  <MaterialIcons name="location-on" size={22} color="#2563eb" />
                </View>
                <View>
                  <Text style={styles.statLabel}>Ubicacion</Text>
                  <Text style={styles.statValue}>{profileData.ubicacion}</Text>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isOrganizer ? `Eventos de ${profileData.nombre}` : `Favoritos de ${profileData.nombre}`}
              </Text>
              <View style={styles.viewToggles}>
                <TouchableOpacity
                  onPress={() => setViewMode('grid')}
                  style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}>
                  <MaterialIcons
                    name="grid-view"
                    size={20}
                    color={viewMode === 'grid' ? COLORS.midnightBlue : COLORS.slate400}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setViewMode('list')}
                  style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}>
                  <MaterialIcons
                    name="view-list"
                    size={20}
                    color={viewMode === 'list' ? COLORS.midnightBlue : COLORS.slate400}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {(isOrganizer ? eventos : favoritos).length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons
                  name={isOrganizer ? 'event-note' : 'bookmark'}
                  size={48}
                  color={COLORS.slate400}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>
                  {isOrganizer
                    ? 'Este organizador aun no ha publicado eventos.'
                    : `${profileData.nombre || 'Este usuario'} aun no tiene eventos favoritos.`}
                </Text>
              </View>
            ) : (
              <View style={[styles.cardsContainer, viewMode === 'list' && styles.cardsContainerList]}>
                {(isOrganizer ? eventos : favoritos).map((evento) => (
                  <EventCard key={String(evento.id_evento || evento.id)} evento={evento} />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showActionPanel}
        animationType="slide"
        transparent
        onRequestClose={() => setShowActionPanel(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowActionPanel(false)} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Acciones</Text>
              <TouchableOpacity onPress={() => setShowActionPanel(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.midnightBlue} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetContent}>
              <TouchableOpacity
                style={[styles.actionBtn, esAmigo ? styles.actionBtnDangerSoft : styles.actionBtnPrimary]}
                onPress={handleToggleFriend}
                disabled={friendLoading}>
                {friendLoading ? (
                  <ActivityIndicator size="small" color={esAmigo ? COLORS.red500 : COLORS.midnightBlue} />
                ) : (
                  <>
                    <MaterialIcons
                      name={esAmigo ? 'person-remove' : 'person-add'}
                      size={20}
                      color={esAmigo ? COLORS.red500 : COLORS.midnightBlue}
                    />
                    <Text style={esAmigo ? styles.actionBtnTextDangerSoft : styles.actionBtnText}>
                      {esAmigo ? 'Eliminar Amigo' : 'Anadir Amigo'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {canMakeEmpresario ? (
                <TouchableOpacity style={styles.actionBtnOutline} onPress={handleAsignarRol} disabled={rolLoading}>
                  {rolLoading ? (
                    <ActivityIndicator size="small" color={COLORS.midnightBlue} />
                  ) : (
                    <>
                      <MaterialIcons name="admin-panel-settings" size={20} color={COLORS.slate600} />
                      <Text style={styles.actionBtnTextOutline}>Hacer Organizador</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}

              {canRemoveEmpresario ? (
                <TouchableOpacity
                  style={styles.actionBtnDanger}
                  onPress={handleQuitarRol}
                  disabled={removeRolLoading}>
                  {removeRolLoading ? (
                    <ActivityIndicator size="small" color={COLORS.red500} />
                  ) : (
                    <>
                      <MaterialIcons name="admin-panel-settings" size={20} color={COLORS.red500} />
                      <Text style={styles.actionBtnTextDanger}>Quitar Organizador</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}

              {canDownloadStats ? (
                <TouchableOpacity
                  style={styles.actionBtnOutline}
                  onPress={handleDownloadStats}
                  disabled={statsLoading}>
                  {statsLoading ? (
                    <ActivityIndicator size="small" color={COLORS.midnightBlue} />
                  ) : (
                    <>
                      <MaterialIcons name="download" size={20} color={COLORS.slate600} />
                      <Text style={styles.actionBtnTextOutline}>Descargar Estadisticas</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}

              {rolMessage ? (
                <View
                  style={[
                    styles.feedbackBox,
                    rolMessage.toLowerCase().includes('error') ? styles.feedbackError : styles.feedbackSuccess,
                  ]}>
                  <Text
                    style={[
                      styles.feedbackText,
                      rolMessage.toLowerCase().includes('error') ? styles.feedbackTextError : styles.feedbackTextSuccess,
                    ]}>
                    {rolMessage}
                  </Text>
                </View>
              ) : null}
            </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.formBg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.formBg,
    padding: 24,
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
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lemonIcing,
  },
  primaryButtonText: {
    fontWeight: '700',
    color: COLORS.midnightBlue,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(213, 213, 216, 0.4)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.midnightBlue,
    flexShrink: 1,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  coverSection: {
    height: 280,
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 20,
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  profileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.white,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  textInfoWrapper: {
    flex: 1,
    paddingBottom: 4,
  },
  userName: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
  },
  userHandle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  rolePill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  rolePillText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  userBio: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    marginTop: 8,
  },
  bodySection: {
    padding: 20,
  },
  statsGrid: {
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(213, 213, 216, 0.3)',
  },
  statIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.slate500,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 22,
    color: COLORS.midnightBlue,
    fontWeight: '700',
    marginTop: 2,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.midnightBlue,
    flex: 1,
    marginRight: 12,
  },
  viewToggles: {
    flexDirection: 'row',
    gap: 4,
  },
  toggleBtn: {
    padding: 6,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(213, 213, 216, 0.5)',
  },
  cardsContainer: {
    gap: 16,
  },
  cardsContainerList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(213, 213, 216, 0.3)',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.slate500,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.midnightBlue,
  },
  sheetContent: {
    gap: 12,
  },
  actionBtn: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.lemonIcing,
  },
  actionBtnText: {
    color: COLORS.midnightBlue,
    fontWeight: '700',
  },
  actionBtnOutline: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(213, 213, 216, 0.5)',
  },
  actionBtnTextOutline: {
    color: COLORS.slate600,
    fontWeight: '700',
  },
  actionBtnDanger: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  actionBtnTextDanger: {
    color: COLORS.red500,
    fontWeight: '700',
  },
  actionBtnDangerSoft: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  actionBtnTextDangerSoft: {
    color: COLORS.red500,
    fontWeight: '700',
  },
  feedbackBox: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  feedbackError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  feedbackText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackTextSuccess: {
    color: '#166534',
  },
  feedbackTextError: {
    color: '#b91c1c',
  },
});
