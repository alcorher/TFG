import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';

import { COLORS } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://lebrijaleo-backend.onrender.com';

type Empresario = {
  id_usuario: string;
  nombre: string;
  email?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  username?: string | null;
  biografia?: string | null;
  ubicacion?: string | null;
  num_eventos?: number | null;
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
  eventos?: {
    nombre: string;
    likes: number;
  }[];
};

type ToastState = {
  type: 'success' | 'error';
  message: string;
};

function generateStatsTxt(stats: OrganizerStats) {
  const fecha = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  let txt = '';
  txt += '=============================================\n';
  txt += '  ESTADISTICAS DE ORGANIZADOR - LebriJaleo\n';
  txt += '=============================================\n';
  txt += `Organizador : ${stats.nombre}\n`;
  if (stats.username) txt += `Usuario     : @${stats.username}\n`;
  txt += `Fecha       : ${fecha}\n\n`;
  txt += '--- RESUMEN ---\n';
  txt += `Seguidores totales   : ${stats.seguidores_totales}\n`;
  txt += `Likes totales        : ${stats.likes_totales}\n`;
  txt += `Eventos publicados   : ${stats.num_eventos}\n\n`;

  if (stats.evento_top?.nombre) {
    txt += '--- EVENTO ESTRELLA ---\n';
    txt += `Nombre : ${stats.evento_top.nombre}\n`;
    txt += `Likes  : ${stats.evento_top.likes ?? 0}\n\n`;
  } else {
    txt += '--- EVENTO ESTRELLA ---\n';
    txt += 'Sin eventos publicados aún.\n\n';
  }

  if (stats.eventos && stats.eventos.length > 0) {
    txt += '--- DESGLOSE POR EVENTO ---\n';
    [...stats.eventos]
      .sort((a, b) => b.likes - a.likes)
      .forEach((evento, index) => {
        txt += `  ${index + 1}. ${evento.nombre} - ${evento.likes} like${evento.likes !== 1 ? 's' : ''}\n`;
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
    throw new Error(errorPayload.detail || 'No se pudieron obtener las estadísticas');
  }

  return (await response.json()) as OrganizerStats;
}

function OrganizerCard({
  empresario,
  onViewProfile,
  onDelete,
  isDeleting,
}: {
  empresario: Empresario;
  onViewProfile: (id: string) => void;
  onDelete: (empresario: Empresario) => void;
  isDeleting: boolean;
}) {
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(empresario.nombre)}&background=F6EBC8&color=1e293b&size=128`;
  const avatarUri = empresario.avatar_url || defaultAvatar;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}
>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {empresario.nombre}
          </Text>
          {empresario.username ? (
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              @{empresario.username}
            </Text>
          ) : null}
        </View>
        <View style={styles.eventBadge}>
          <MaterialIcons name="event" size={16} color={COLORS.midnightBlue} />
          <Text style={styles.eventBadgeText}>{empresario.num_eventos ?? 0}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <MaterialIcons name="mail" size={18} color="rgba(15, 23, 42, 0.35)" />
          <Text style={styles.detailText} numberOfLines={1}>
            {empresario.email || 'Sin email disponible'}
          </Text>
        </View>
        {empresario.ubicacion ? (
          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={18} color="rgba(15, 23, 42, 0.35)" />
            <Text style={styles.detailText} numberOfLines={1}>
              {empresario.ubicacion}
            </Text>
          </View>
        ) : null}
        {empresario.biografia ? (
          <Text style={styles.bio} numberOfLines={3}>
            {empresario.biografia}
          </Text>
        ) : null}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => onViewProfile(empresario.id_usuario)}>
          <Text style={styles.primaryButtonText}>Ver perfil</Text>
          <MaterialIcons name="arrow-forward" size={18} color={COLORS.midnightBlue} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onDelete(empresario)}
          disabled={isDeleting}
        >
          <MaterialIcons name="delete" size={20} color={COLORS.red500} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ConfirmDialog({
  empresario,
  onCancel,
  onConfirm,
  isLoading,
}: {
  empresario: Empresario | null;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  if (!empresario) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onCancel} activeOpacity={1} />
        <View style={styles.modalCard}>
          <View style={styles.modalIconWrap}>
            <MaterialIcons name="warning-amber" size={28} color={COLORS.red500} />
          </View>
          <Text style={styles.modalTitle}>¿Eliminar empresario?</Text>
          <Text style={styles.modalDescription}>
            Se revocará el rol de empresario a{' '}
            <Text style={styles.modalDescriptionStrong}>{empresario.nombre}</Text>. Su cuenta volverá a ser Cliente y
            sus eventos activos se cancelarán.
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onCancel} disabled={isLoading}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerButton} onPress={onConfirm} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.dangerButtonText}>Sí, eliminar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function MyOrganizersScreen() {
  const router = useRouter();

  const [empresarios, setEmpresarios] = useState<Empresario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [token, setToken] = useState('');
  const [empToDelete, setEmpToDelete] = useState<Empresario | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEmpresarios = useCallback(async ({ refreshing = false }: { refreshing?: boolean } = {}) => {
    try {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setFetchError('');

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      setToken(session.access_token);

      const perfilResponse = await fetch(`${API_URL}/api/perfil`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!perfilResponse.ok) {
        router.replace('/(tabs)');
        return;
      }

      const perfil = (await perfilResponse.json()) as { rol?: string };
      if (perfil.rol !== 'Administrador') {
        router.replace('/(tabs)');
        return;
      }

      const response = await fetch(`${API_URL}/api/empresarios`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => ({}))) as { detail?: string };
        setFetchError(errorPayload.detail || `No se pudieron cargar los organizadores (${response.status}).`);
        setEmpresarios([]);
        return;
      }

      const result = (await response.json()) as { data?: Empresario[] } | Empresario[];
      const data = Array.isArray(result) ? result : Array.isArray(result.data) ? result.data : [];

      setEmpresarios(data);
    } catch (error) {
      console.error('Error fetching organizers:', error);
      setFetchError('No se ha podido conectar con el servidor para cargar los organizadores.');
      setEmpresarios([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchEmpresarios();
  }, [fetchEmpresarios]);

  const empresariosFiltrados = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return empresarios;

    return empresarios.filter((empresario) => {
      const nombre = String(empresario.nombre || '').toLowerCase();
      const email = String(empresario.email || '').toLowerCase();
      const username = String(empresario.username || '').toLowerCase();
      const ubicacion = String(empresario.ubicacion || '').toLowerCase();

      return nombre.includes(query) || email.includes(query) || username.includes(query) || ubicacion.includes(query);
    });
  }, [empresarios, searchTerm]);

  const handleConfirmDelete = async () => {
    if (!empToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_URL}/api/empresarios/${empToDelete.id_usuario}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => ({}))) as { detail?: string };
        throw new Error(errorPayload.detail || 'No se pudo revocar el rol.');
      }

      setEmpresarios((current) => current.filter((item) => item.id_usuario !== empToDelete.id_usuario));
      showToast('success', `Rol de "${empToDelete.nombre}" revocado correctamente.`);
      setEmpToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de conexión. Inténtalo de nuevo.';
      showToast('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportAll = async () => {
    if (!token) {
      showToast('error', 'No se pudo obtener la sesión del usuario.');
      return;
    }

    setExportLoading(true);
    try {
      const results = await Promise.allSettled(
        empresarios.map((empresario) => fetchOrganizerStats(empresario.id_usuario, token)),
      );

      const stats = results
        .map((result) => (result.status === 'fulfilled' ? result.value : null))
        .filter((value): value is OrganizerStats => value !== null);

      if (stats.length === 0) {
        showToast('error', 'No se pudieron obtener estadísticas de ningún organizador.');
        return;
      }

      let content = '';
      content += '=============================================\n';
      content += '  ESTADISTICAS DE ORGANIZADORES - LebriJaleo\n';
      content += '=============================================\n\n';

      stats.forEach((stat, index) => {
        content += `=== ORGANIZADOR ${index + 1} ===\n`;
        content += generateStatsTxt(stat);
        content += '\n';
      });

      if (!FileSystem.documentDirectory) {
        throw new Error('No hay un directorio de documentos disponible');
      }

      const fecha = new Date().toISOString().split('T')[0];
      const fileUri = `${FileSystem.documentDirectory}estadisticas_organizadores_${fecha}.txt`;

      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const shareUri = await FileSystem.getContentUriAsync(fileUri);

      await Share.share({
        url: shareUri,
        message: 'Comparte o guarda las estadísticas de los organizadores.',
        title: `estadisticas_organizadores_${fecha}.txt`,
      });

      showToast('success', `Exportadas estadísticas de ${stats.length} organizador${stats.length !== 1 ? 'es' : ''}.`);
    } catch (error) {
      console.error('Error exporting organizers stats:', error);
      showToast('error', error instanceof Error ? error.message : 'Error al exportar las estadísticas.');
    } finally {
      setExportLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.midnightBlue} />
          <Text style={styles.loadingText}>Cargando organizadores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color="rgba(15, 23, 42, 0.4)" />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Buscar organizadores..."
            placeholderTextColor="rgba(15, 23, 42, 0.4)"
            style={styles.searchInput}
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton}>
              <MaterialIcons name="close" size={18} color="rgba(15, 23, 42, 0.4)" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchEmpresarios({ refreshing: true })}
            tintColor={COLORS.midnightBlue}
          />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.title}>Gestión de Organizadores</Text>
              <Text style={styles.subtitle}>
                {empresarios.length} organizador{empresarios.length !== 1 ? 'es' : ''} registrado{empresarios.length !== 1 ? 's' : ''} en la plataforma.
              </Text>
            </View>

            {empresarios.length > 0 ? (
              <TouchableOpacity style={styles.exportButton} onPress={handleExportAll} disabled={exportLoading}>
                {exportLoading ? (
                  <ActivityIndicator size="small" color={COLORS.midnightBlue} />
                ) : (
                  <MaterialIcons name="download" size={20} color={COLORS.midnightBlue} />
                )}
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/(tabs)')}>
            <MaterialIcons name="dashboard" size={18} color={COLORS.midnightBlue} />
            <Text style={styles.heroButtonText}>Volver a la cartelera</Text>
          </TouchableOpacity>
        </View>

        {fetchError ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={20} color="#b91c1c" />
            <Text style={styles.errorText}>{fetchError}</Text>
          </View>
        ) : null}

        {empresariosFiltrados.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="storefront" size={48} color={COLORS.slate400} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>
              {searchTerm ? 'Sin resultados para tu búsqueda.' : 'No hay organizadores registrados aún.'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchTerm
                ? 'Prueba con otro nombre, email o usuario.'
                : 'Cuando el administrador cree organizadores, aparecerán aquí.'}
            </Text>
            {searchTerm ? (
              <TouchableOpacity style={styles.emptyButton} onPress={() => setSearchTerm('')}>
                <Text style={styles.emptyButtonText}>Limpiar búsqueda</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {empresariosFiltrados.map((empresario) => (
              <OrganizerCard
                key={empresario.id_usuario}
                empresario={empresario}
                onViewProfile={(id) => router.push({ pathname: '/(tabs)/profile/[id]', params: { id } })}
                onDelete={setEmpToDelete}
                isDeleting={isDeleting}
              />
            ))}

            <Text style={styles.footerText}>
              Mostrando <Text style={styles.footerTextStrong}>{empresariosFiltrados.length}</Text> de{' '}
              <Text style={styles.footerTextStrong}>{empresarios.length}</Text> organizadores
            </Text>
          </View>
        )}
      </ScrollView>

      <ConfirmDialog
        empresario={empToDelete}
        onCancel={() => setEmpToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />

      {toast ? (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <MaterialIcons
            name={toast.type === 'success' ? 'check-circle' : 'warning'}
            size={20}
            color={COLORS.white}
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.formBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(213, 213, 216, 0.35)',
  },
  searchWrap: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(213, 213, 216, 0.5)',
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: COLORS.midnightBlue,
    fontSize: 14,
    minHeight: 46,
  },
  clearButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  hero: {
    marginBottom: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.midnightBlue,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.slate600,
  },
  exportButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.lemonIcing,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.lemonIcing,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 16,
  },
  heroButtonText: {
    color: COLORS.midnightBlue,
    fontWeight: '800',
    fontSize: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: '#b91c1c',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(213, 213, 216, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(213, 213, 216, 0.25)',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.cloudDancer,
  },
  cardHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: COLORS.midnightBlue,
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubtitle: {
    marginTop: 2,
    color: 'rgba(15, 23, 42, 0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.formBg,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  eventBadgeText: {
    color: COLORS.midnightBlue,
    fontSize: 13,
    fontWeight: '800',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    color: 'rgba(15, 23, 42, 0.74)',
    fontSize: 14,
    fontWeight: '500',
  },
  bio: {
    color: 'rgba(15, 23, 42, 0.68)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    paddingTop: 0,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.lemonIcing,
    borderRadius: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: COLORS.midnightBlue,
    fontWeight: '800',
    fontSize: 14,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(213, 213, 216, 0.3)',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    marginBottom: 12,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.slate600,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.slate500,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: COLORS.lemonIcing,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: COLORS.midnightBlue,
    fontWeight: '800',
    fontSize: 14,
  },
  footerText: {
    marginTop: 4,
    color: COLORS.slate500,
    fontSize: 12,
    fontWeight: '600',
  },
  footerTextStrong: {
    color: COLORS.midnightBlue,
    fontWeight: '800',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: {
    color: COLORS.slate500,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 22,
    gap: 14,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  modalTitle: {
    color: COLORS.midnightBlue,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalDescription: {
    color: 'rgba(15, 23, 42, 0.68)',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  modalDescriptionStrong: {
    color: COLORS.midnightBlue,
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(213, 213, 216, 0.7)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: 'rgba(15, 23, 42, 0.74)',
    fontWeight: '800',
    fontSize: 14,
  },
  dangerButton: {
    flex: 1,
    backgroundColor: COLORS.red500,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  toastSuccess: {
    backgroundColor: COLORS.midnightBlue,
  },
  toastError: {
    backgroundColor: COLORS.red500,
  },
  toastText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});