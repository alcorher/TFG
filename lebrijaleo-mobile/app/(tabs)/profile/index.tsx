import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Share,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';

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

type UserProfile = {
  id: string;
  nombre: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  username: string;
  ubicacion: string;
  rol: UserRole;
};

type OrganizerStats = {
  nombre: string;
  username?: string;
  seguidores_totales: number;
  likes_totales: number;
  num_eventos: number;
  evento_top?: {
    nombre?: string;
    likes?: number;
  };
  eventos?: Array<{
    nombre: string;
    likes: number;
  }>;
};

type StatCardProps = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
};

function generateStatsTxt(stats: OrganizerStats) {
  const fecha = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  let txt = '';
  txt += '=============================================\n';
  txt += '  ESTADÍSTICAS DE ORGANIZADOR — LebriJaleo\n';
  txt += '=============================================\n';
  txt += `Organizador : ${stats.nombre}\n`;
  if (stats.username) txt += `Usuario     : @${stats.username}\n`;
  txt += `Fecha       : ${fecha}\n`;
  txt += '\n';
  txt += '--- RESUMEN ---\n';
  txt += `Seguidores totales   : ${stats.seguidores_totales}\n`;
  txt += `Likes totales        : ${stats.likes_totales}\n`;
  txt += `Eventos publicados   : ${stats.num_eventos}\n`;
  txt += '\n';

  if (stats.evento_top && stats.evento_top.nombre) {
    txt += '--- EVENTO ESTRELLA ---\n';
    txt += `Nombre : ${stats.evento_top.nombre}\n`;
    txt += `Likes  : ${stats.evento_top.likes}\n`;
    txt += '\n';
  } else {
    txt += '--- EVENTO ESTRELLA ---\n';
    txt += 'Sin eventos publicados aún.\n';
    txt += '\n';
  }

  if (stats.eventos && stats.eventos.length > 0) {
    txt += '--- DESGLOSE POR EVENTO ---\n';
    stats.eventos
      .sort((a, b) => b.likes - a.likes)
      .forEach((ev, index) => {
        txt += `  ${index + 1}. ${ev.nombre} — ${ev.likes} like${ev.likes !== 1 ? 's' : ''}\n`;
      });
    txt += '\n';
  }

  txt += '=============================================\n';
  return txt;
}

async function fetchOrganizerStats(userId: string, token: string) {
  const response = await fetch(`${API_URL}/api/estadisticas-organizador/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => ({}))) as { detail?: string };
    throw new Error(errorPayload.detail || 'Error al obtener estadisticas');
  }

  return (await response.json()) as OrganizerStats;
}

function StatCard({ icon, label, value, iconBg, iconColor }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<EventItem[]>([]);
  const [myEvents, setMyEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    async function loadProfileAndData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace('/login');
          return;
        }

        const token = session.access_token;

        const profileRes = await fetch(`${API_URL}/api/perfil`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let profileData: Record<string, unknown> = {};
        if (profileRes.ok) {
          profileData = (await profileRes.json()) as Record<string, unknown>;
        }

        const profile: UserProfile = {
          id: session.user.id,
          nombre: (profileData.nombre as string) || session.user.email?.split('@')[0] || 'Usuario',
          bio: (profileData.biografia as string) || '',
          avatar_url: (profileData.avatar_url as string) || '',
          banner_url: (profileData.banner_url as string) || '',
          username: (profileData.username as string) || '',
          ubicacion: (profileData.ubicacion as string) || '',
          rol: (profileData.rol as UserRole) || 'Cliente',
        };

        setUserProfile(profile);

        const favRes = await fetch(`${API_URL}/api/mis-favoritos`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (favRes.ok) {
          const favData = (await favRes.json()) as { data?: EventItem[] };
          setFavorites(favData.data || []);
        }

        if (profile.rol === 'Empresario' || profile.rol === 'Administrador') {
          const eventsRes = await fetch(`${API_URL}/api/mis-eventos`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (eventsRes.ok) {
            const eventsData = (await eventsRes.json()) as { data?: EventItem[] };
            setMyEvents(eventsData.data || []);
          }
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
        Alert.alert('Error', 'No se pudo cargar el perfil.');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfileAndData();
  }, [router]);

  const handleLogout = async () => {
    setShowActionPanel(false);
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleDownloadStats = async () => {
    setStatsLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !userProfile) {
        router.replace('/login');
        return;
      }

      const stats = await fetchOrganizerStats(userProfile.id, session.access_token);
      const txtContent = generateStatsTxt(stats);
      const safeName = (stats.nombre || 'organizador')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+/g, '_');

      if (!FileSystem.documentDirectory) {
        throw new Error('No hay un directorio de documentos disponible');
      }

      const fileUri = `${FileSystem.documentDirectory}estadisticas_${safeName}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, txtContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const shareUri = await FileSystem.getContentUriAsync(fileUri);

      await Share.share({
        url: shareUri,
        message: 'Comparte o guarda tus estadísticas de organizador.',
        title: `estadisticas_${safeName}.txt`,
      });

      Alert.alert('Estadísticas generadas', 'El archivo se ha creado y se ha abierto el panel para compartirlo.');
    } catch (error) {
      console.error('Error descargando estadisticas:', error);
      Alert.alert('Error', 'No se pudieron descargar las estadísticas.');
    } finally {
      setStatsLoading(false);
      setShowActionPanel(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.midnightBlue} />
      </View>
    );
  }

  if (!userProfile) {
    return null;
  }

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.nombre)}&background=F6EBC8&color=1e293b`;
  const defaultBanner = 'https://images.unsplash.com/photo-1518605368461-1ee46062f6b8?q=80&w=2093';
  const isAdmin = userProfile.rol === 'Administrador';
  const isOrganizer = userProfile.rol === 'Empresario';
  const showOrganizerTools = isOrganizer || isAdmin;
  const profileTitle = isAdmin
    ? 'Perfil de Administrador'
    : isOrganizer
      ? 'Perfil de Organizador'
      : 'Perfil de Usuario';
  const roleBadge = isAdmin ? 'Administrador' : isOrganizer ? 'Organizador' : 'Usuario';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.midnightBlue} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{profileTitle}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowActionPanel(true)} style={styles.iconBtn}>
          <MaterialIcons name="menu" size={24} color={COLORS.midnightBlue} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.coverSection}>
          <Image source={{ uri: userProfile.banner_url || defaultBanner }} style={styles.bannerImage} />
          <View style={styles.bannerOverlay} />

          <View style={styles.profileInfoContainer}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: userProfile.avatar_url || defaultAvatar }} style={styles.avatarImage} />
            </View>
            <View style={styles.textInfoWrapper}>
              <Text style={styles.userName}>{userProfile.nombre}</Text>
              {userProfile.username ? <Text style={styles.userHandle}>@{userProfile.username}</Text> : null}
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{roleBadge}</Text>
              </View>
              {userProfile.bio ? <Text style={styles.userBio}>{userProfile.bio}</Text> : null}
            </View>
          </View>
        </View>

        <View style={styles.bodySection}>
          <View style={styles.statsGrid}>
            <StatCard
              icon="bookmark"
              label={showOrganizerTools ? 'Favoritos guardados' : 'Favoritos guardados'}
              value={favorites.length}
              iconBg="#fef2f2"
              iconColor={COLORS.red500}
            />

            {showOrganizerTools ? (
              <StatCard
                icon="event-note"
                label={isAdmin ? 'Eventos visibles' : 'Eventos creados'}
                value={myEvents.length}
                iconBg="#fff7ed"
                iconColor="#ea580c"
              />
            ) : null}

            {userProfile.ubicacion ? (
              <StatCard
                icon="group"
                label="Ubicacion"
                value={userProfile.ubicacion}
                iconBg="#eff6ff"
                iconColor="#2563eb"
              />
            ) : null}
          </View>

          {showOrganizerTools ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{isAdmin ? 'Eventos gestionados' : 'Mis Eventos'}</Text>
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

              {myEvents.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="event-note" size={48} color={COLORS.slate400} style={styles.emptyIcon} />
                  <Text style={styles.emptyTitle}>
                    {isAdmin ? 'No hay eventos disponibles para mostrar.' : 'Aun no has creado ningun evento.'}
                  </Text>
                  <Text style={styles.emptySub}>
                    {isAdmin ? 'Cuando haya eventos asociados apareceran aqui.' : 'Crea tu primer evento y compartelo.'}
                  </Text>
                </View>
              ) : (
                <View style={[styles.cardsContainer, viewMode === 'list' && styles.cardsContainerList]}>
                  {myEvents.map((evento) => (
                    <EventCard key={String(evento.id_evento || evento.id)} evento={evento} />
                  ))}
                </View>
              )}
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mis Favoritos</Text>
            </View>

            {favorites.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="bookmark" size={48} color={COLORS.slate400} style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>Aun no tienes eventos favoritos.</Text>
                <Text style={styles.emptySub}>Explora la cartelera y guarda los que mas te gusten.</Text>
              </View>
            ) : (
              <View style={styles.cardsContainer}>
                {favorites.map((evento) => (
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
                style={[styles.actionBtn, { backgroundColor: COLORS.lemonIcing }]}
                onPress={() => {
                  setShowActionPanel(false);
                  router.push('/(tabs)/profile/edit');
                }}>
                <MaterialIcons name="edit" size={20} color={COLORS.midnightBlue} />
                <Text style={styles.actionBtnText}>Editar Perfil</Text>
              </TouchableOpacity>

              {showOrganizerTools ? (
                <>
                  <TouchableOpacity
                    style={styles.actionBtnOutline}
                    onPress={() => {
                      setShowActionPanel(false);
                      router.push('/(tabs)/create-event');
                    }}>
                    <MaterialIcons name="event-note" size={20} color={COLORS.slate600} />
                    <Text style={styles.actionBtnTextOutline}>
                      {isAdmin ? 'Gestionar Publicacion' : 'Crear Evento'}
                    </Text>
                  </TouchableOpacity>

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
                </>
              ) : null}

              <TouchableOpacity style={styles.actionBtnDanger} onPress={handleLogout}>
                <MaterialIcons name="logout" size={20} color={COLORS.red500} />
                <Text style={styles.actionBtnTextDanger}>Cerrar Sesion</Text>
              </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cloudDancer,
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
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    width: '100%',
    height: '100%',
    opacity: 0.8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rolePillText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  userBio: {
    color: 'rgba(255,255,255,0.9)',
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
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(213, 213, 216, 0.3)',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.slate500,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.midnightBlue,
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
    fontWeight: 'bold',
    color: COLORS.midnightBlue,
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
  emptySub: {
    fontSize: 14,
    color: COLORS.slate400,
    textAlign: 'center',
    marginTop: 4,
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
    fontWeight: 'bold',
    color: COLORS.midnightBlue,
  },
  sheetContent: {
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.midnightBlue,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(213, 213, 216, 0.5)',
  },
  actionBtnTextOutline: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.slate600,
  },
  actionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    marginTop: 8,
  },
  actionBtnTextDanger: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.red500,
  },
});
