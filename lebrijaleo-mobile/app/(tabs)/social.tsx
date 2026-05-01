import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { LebrijaColors, LebrijaRadius, LebrijaSpacing } from '@/constants/lebrijaleo-theme';
import { API_URL } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { formatDateES } from '@/lib/utils';

type UserRole = 'Cliente' | 'Empresario' | 'Administrador' | string;
type ViewMode = 'grid' | 'list';
type SortMode = 'recent' | 'az';

type FriendUser = {
  id_usuario: string;
  nombre?: string;
  username?: string;
  avatar_url?: string;
  amigo_desde?: string;
  rol?: UserRole;
  es_amigo?: boolean;
};

type FriendCardProps = {
  friend: FriendUser;
  viewMode: ViewMode;
  togglingId: string | null;
  onToggleFriend: (userId: string) => Promise<void>;
  onOpenProfile: (userId: string) => void;
  formatDate: (dateStr?: string) => string;
  getAvatar: (user: FriendUser) => string;
};

function FriendCard({
  friend,
  viewMode,
  togglingId,
  onToggleFriend,
  onOpenProfile,
  formatDate,
  getAvatar,
}: FriendCardProps) {
  const isToggling = togglingId === friend.id_usuario;
  const isOrganizer = friend.rol === 'Empresario';

  if (viewMode === 'list') {
    return (
      <View style={styles.listCard}>
        <Pressable onPress={() => onOpenProfile(friend.id_usuario)}>
          <Image source={{ uri: getAvatar(friend) }} style={styles.listAvatar} />
        </Pressable>

        <View style={styles.listInfo}>
          <Pressable onPress={() => onOpenProfile(friend.id_usuario)}>
            <Text style={styles.listName} numberOfLines={1}>
              {friend.nombre || 'Usuario'}
            </Text>
          </Pressable>

          <View style={styles.listMetaRow}>
            <Text style={styles.listMeta} numberOfLines={1}>
              {friend.username ? `@${friend.username} · ` : ''}
              {formatDate(friend.amigo_desde)}
            </Text>
            {isOrganizer ? (
              <View style={styles.organizerBadge}>
                <Text style={styles.organizerBadgeText}>Organizador</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.listActions}>
          <Pressable
            disabled={isToggling}
            onPress={() => onToggleFriend(friend.id_usuario)}
            style={[styles.smallDangerButton, isToggling && styles.disabledButton]}>
            {isToggling ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <MaterialIcons name="person-remove" size={16} color="#DC2626" />
                <Text style={styles.smallDangerButtonText}>Quitar</Text>
              </>
            )}
          </Pressable>

          <Pressable onPress={() => onOpenProfile(friend.id_usuario)} style={styles.smallPrimaryButton}>
            <Text style={styles.smallPrimaryButtonText}>Ver perfil</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gridCard}>
      <Pressable onPress={() => onOpenProfile(friend.id_usuario)} style={styles.gridAvatarWrapper}>
        <Image source={{ uri: getAvatar(friend) }} style={styles.gridAvatar} />
      </Pressable>

      <Text style={styles.gridName}>{friend.nombre || 'Usuario'}</Text>
      <Text style={styles.gridHandle}>{friend.username ? `@${friend.username}` : ' '}</Text>

      <View style={styles.gridBadgeSlot}>
        {isOrganizer ? (
          <View style={styles.organizerBadge}>
            <Text style={styles.organizerBadgeText}>Organizador</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.friendSinceCard}>
        <MaterialIcons name="groups" size={16} color="rgba(15,23,42,0.55)" />
        <Text style={styles.friendSinceText}>Amigos {formatDate(friend.amigo_desde)}</Text>
      </View>

      <View style={styles.gridActions}>
        <Pressable
          disabled={isToggling}
          onPress={() => onToggleFriend(friend.id_usuario)}
          style={[styles.dangerButton, isToggling && styles.disabledButton]}>
          {isToggling ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <>
              <MaterialIcons name="person-remove" size={18} color="#DC2626" />
              <Text style={styles.dangerButtonText}>Quitar</Text>
            </>
          )}
        </Pressable>

        <Pressable onPress={() => onOpenProfile(friend.id_usuario)} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Ver perfil</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SocialScreen() {
  const router = useRouter();

  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortMode>('recent');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const getSession = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace('/login');
      return null;
    }

    return session;
  }, [router]);

  const loadFriends = useCallback(async () => {
    const session = await getSession();
    if (!session) return false;

    const response = await fetch(`${API_URL}/api/mis-amigos`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) {
      throw new Error('No se pudieron cargar los amigos.');
    }

    const data = (await response.json()) as { data?: FriendUser[] };
    setFriends(data.data || []);
    return true;
  }, [getSession]);

  useEffect(() => {
    async function bootstrap() {
      try {
        await loadFriends();
      } catch (error) {
        console.error('Error cargando amigos:', error);
        Alert.alert('Error', 'No se pudieron cargar tus amigos.');
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();
  }, [loadFriends]);

  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const session = await getSession();
        if (!session) return;

        const response = await fetch(
          `${API_URL}/api/usuarios/buscar?q=${encodeURIComponent(searchTerm.trim())}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          },
        );

        if (!response.ok) {
          throw new Error('No se pudo realizar la búsqueda.');
        }

        const data = (await response.json()) as { data?: FriendUser[] };
        setSearchResults(data.data || []);
      } catch (error) {
        console.error('Error buscando usuarios:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [getSession, searchTerm]);

  const handleToggleFriend = useCallback(
    async (userId: string) => {
      setTogglingId(userId);

      try {
        const session = await getSession();
        if (!session) return;

        const response = await fetch(`${API_URL}/api/amigos/${userId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!response.ok) {
          throw new Error('No se pudo actualizar la amistad.');
        }

        const data = (await response.json()) as { es_amigo?: boolean };

        setSearchResults((prev) =>
          prev.map((user) =>
            user.id_usuario === userId ? { ...user, es_amigo: !!data.es_amigo } : user,
          ),
        );

        if (data.es_amigo) {
          await loadFriends();
        } else {
          setFriends((prev) => prev.filter((friend) => friend.id_usuario !== userId));
        }
      } catch (error) {
        console.error('Error toggling friend:', error);
        Alert.alert('Error', 'No se pudo actualizar la amistad.');
      } finally {
        setTogglingId(null);
      }
    },
    [getSession, loadFriends],
  );

  const filteredFriends = useMemo(() => {
    return [...friends]
      .filter((friend) => {
        if (!filterTerm.trim()) return true;
        const term = filterTerm.trim().toLowerCase();
        return (
          (friend.nombre || '').toLowerCase().includes(term) ||
          (friend.username || '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'az') {
          return (a.nombre || '').localeCompare(b.nombre || '');
        }

        return new Date(b.amigo_desde || 0).getTime() - new Date(a.amigo_desde || 0).getTime();
      });
  }, [filterTerm, friends, sortBy]);

  const getAvatar = useCallback((user: FriendUser) => {
    return (
      user.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre || 'U')}&background=F6EBC8&color=1e293b`
    );
  }, []);

  const formatDate = useCallback((dateStr?: string) => {
    if (!dateStr) return '';

    return formatDateES(dateStr, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  const openProfile = useCallback(
    (userId: string) => {
      router.push(`/(tabs)/profile/${userId}`);
    },
    [router],
  );

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={LebrijaColors.midnightBlue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Mis Amigos</Text>
            <Text style={styles.subtitle}>Gestiona tus conexiones en Lebrija</Text>
          </View>

          <View style={styles.filterInputWrap}>
            <MaterialIcons name="person-search" size={20} color="rgba(15,23,42,0.4)" />
            <TextInput
              placeholder="Filtrar amigos..."
              placeholderTextColor="rgba(15,23,42,0.4)"
              style={styles.filterInput}
              value={filterTerm}
              onChangeText={setFilterTerm}
            />
          </View>
        </View>

        <View style={styles.banner}>
          <View style={styles.bannerGlow} />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>¿Buscas a alguien?</Text>
            <Text style={styles.bannerDescription}>
              Encuentra a tus amigos de siempre o conoce gente nueva con tus mismos
              intereses culturales y de ocio en Lebrija.
            </Text>

            <View style={styles.searchInputWrap}>
              <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.55)" />
              <TextInput
                placeholder="Buscar personas por nombre o username..."
                placeholderTextColor="rgba(255,255,255,0.55)"
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={(value) => {
                  setSearchTerm(value);
                  setShowSearch(true);
                }}
              />

              {searchTerm ? (
                <Pressable
                  onPress={() => {
                    setSearchTerm('');
                    setSearchResults([]);
                    setShowSearch(false);
                  }}>
                  <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.7)" />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        {showSearch && searchTerm.trim().length >= 2 ? (
          <View style={styles.searchResultsCard}>
            <View style={styles.searchResultsHeader}>
              <View style={styles.searchResultsTitleWrap}>
                <MaterialIcons name="search" size={18} color="rgba(15,23,42,0.5)" />
                <Text style={styles.searchResultsTitle}>
                  Resultados para «{searchTerm.trim()}»
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  setShowSearch(false);
                  setSearchTerm('');
                  setSearchResults([]);
                }}>
                <Text style={styles.closeSearchText}>Cerrar</Text>
              </Pressable>
            </View>

            {isSearching ? (
              <View style={styles.centeredState}>
                <ActivityIndicator size="small" color={LebrijaColors.midnightBlue} />
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.emptySearchState}>
                <MaterialIcons name="person-off" size={36} color="rgba(15,23,42,0.2)" />
                <Text style={styles.emptySearchText}>
                  No se encontraron usuarios con ese nombre.
                </Text>
              </View>
            ) : (
              <View>
                {searchResults.map((user, index) => {
                  const isToggling = togglingId === user.id_usuario;
                  const isFriend = !!user.es_amigo;
                  const isOrganizer = user.rol === 'Empresario';

                  return (
                    <View
                      key={user.id_usuario}
                      style={[
                        styles.searchResultRow,
                        index < searchResults.length - 1 && styles.searchResultDivider,
                      ]}>
                      <Pressable onPress={() => openProfile(user.id_usuario)}>
                        <Image source={{ uri: getAvatar(user) }} style={styles.searchAvatar} />
                      </Pressable>

                      <View style={styles.searchUserInfo}>
                        <Pressable onPress={() => openProfile(user.id_usuario)}>
                          <Text style={styles.searchUserName} numberOfLines={1}>
                            {user.nombre || 'Usuario'}
                          </Text>
                        </Pressable>

                        <View style={styles.searchMetaRow}>
                          <Text style={styles.searchUserMeta} numberOfLines={1}>
                            {user.username ? `@${user.username}` : ''}
                          </Text>
                          {isOrganizer ? (
                            <View style={styles.organizerBadge}>
                              <Text style={styles.organizerBadgeText}>Organizador</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.searchActions}>
                        <Pressable onPress={() => openProfile(user.id_usuario)} style={styles.profileIconButton}>
                          <MaterialIcons
                            name="open-in-new"
                            size={18}
                            color={LebrijaColors.midnightBlue}
                          />
                        </Pressable>

                        <Pressable
                          disabled={isToggling}
                          onPress={() => handleToggleFriend(user.id_usuario)}
                          style={[
                            styles.searchFriendButton,
                            isFriend ? styles.searchFriendButtonRemove : styles.searchFriendButtonAdd,
                            isToggling && styles.disabledButton,
                          ]}>
                          {isToggling ? (
                            <ActivityIndicator
                              size="small"
                              color={isFriend ? '#DC2626' : LebrijaColors.midnightBlue}
                            />
                          ) : (
                            <>
                              <MaterialIcons
                                name={isFriend ? 'person-remove' : 'person-add'}
                                size={16}
                                color={isFriend ? '#DC2626' : LebrijaColors.midnightBlue}
                              />
                              <Text
                                style={
                                  isFriend
                                    ? styles.searchFriendButtonRemoveText
                                    : styles.searchFriendButtonAddText
                                }>
                                {isFriend ? 'Quitar' : 'Añadir'}
                              </Text>
                            </>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.friendsHeader}>
          <View style={styles.friendsTitleWrap}>
            <Text style={styles.friendsTitle}>Todos mis amigos</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{friends.length}</Text>
            </View>
          </View>

          <View style={styles.controlsWrap}>
            <View style={styles.sortGroup}>
              <Pressable
                onPress={() => setSortBy('recent')}
                style={[styles.sortButton, sortBy === 'recent' && styles.sortButtonActive]}>
                <Text
                  style={[styles.sortButtonText, sortBy === 'recent' && styles.sortButtonTextActive]}>
                  Recientes
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSortBy('az')}
                style={[styles.sortButton, sortBy === 'az' && styles.sortButtonActive]}>
                <Text style={[styles.sortButtonText, sortBy === 'az' && styles.sortButtonTextActive]}>
                  A-Z
                </Text>
              </Pressable>
            </View>

            <View style={styles.viewToggleGroup}>
              <Pressable
                onPress={() => setViewMode('grid')}
                style={[styles.viewToggleButton, viewMode === 'grid' && styles.viewToggleButtonActive]}>
                <MaterialIcons
                  name="grid-view"
                  size={20}
                  color={
                    viewMode === 'grid'
                      ? LebrijaColors.midnightBlue
                      : 'rgba(15,23,42,0.45)'
                  }
                />
              </Pressable>

              <Pressable
                onPress={() => setViewMode('list')}
                style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleButtonActive]}>
                <MaterialIcons
                  name="view-list"
                  size={20}
                  color={
                    viewMode === 'list'
                      ? LebrijaColors.midnightBlue
                      : 'rgba(15,23,42,0.45)'
                  }
                />
              </Pressable>
            </View>
          </View>
        </View>

        {filteredFriends.length === 0 ? (
          <View style={styles.emptyFriendsState}>
            <MaterialIcons name="groups" size={48} color="rgba(15,23,42,0.2)" />
            <Text style={styles.emptyFriendsText}>
              {friends.length === 0
                ? 'Aún no tienes amigos. Usa el buscador para encontrar gente.'
                : 'No se encontraron amigos con ese filtro.'}
            </Text>
          </View>
        ) : (
          <View style={viewMode === 'grid' ? styles.gridList : styles.listWrap}>
            {filteredFriends.map((friend) => (
              <FriendCard
                key={friend.id_usuario}
                friend={friend}
                viewMode={viewMode}
                togglingId={togglingId}
                onToggleFriend={handleToggleFriend}
                onOpenProfile={openProfile}
                formatDate={formatDate}
                getAvatar={getAvatar}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: LebrijaColors.formBg,
  },
  scrollContent: {
    paddingHorizontal: LebrijaSpacing.md,
    paddingTop: LebrijaSpacing.md,
    paddingBottom: LebrijaSpacing.xl * 2,
    gap: LebrijaSpacing.md,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LebrijaColors.cloudDancer,
  },
  header: {
    gap: LebrijaSpacing.md,
  },
  title: {
    color: LebrijaColors.midnightBlue,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    color: 'rgba(15,23,42,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  filterInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LebrijaSpacing.sm,
    backgroundColor: LebrijaColors.white,
    borderRadius: LebrijaRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(213,213,216,0.65)',
    paddingHorizontal: LebrijaSpacing.md,
    paddingVertical: 2,
  },
  filterInput: {
    flex: 1,
    minHeight: 44,
    color: LebrijaColors.midnightBlue,
    fontSize: 14,
  },
  banner: {
    backgroundColor: LebrijaColors.midnightBlue,
    borderRadius: LebrijaRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    padding: LebrijaSpacing.lg,
  },
  bannerGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(246,235,200,0.18)',
    top: -60,
    right: -40,
  },
  bannerContent: {
    gap: LebrijaSpacing.md,
  },
  bannerTitle: {
    color: LebrijaColors.white,
    fontSize: 24,
    fontWeight: '800',
  },
  bannerDescription: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    lineHeight: 22,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LebrijaSpacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: LebrijaRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: LebrijaSpacing.md,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    color: LebrijaColors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  searchResultsCard: {
    backgroundColor: LebrijaColors.white,
    borderRadius: LebrijaRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(213,213,216,0.5)',
    overflow: 'hidden',
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: LebrijaSpacing.lg,
    paddingVertical: LebrijaSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(213,213,216,0.35)',
  },
  searchResultsTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LebrijaSpacing.xs,
    flex: 1,
    marginRight: LebrijaSpacing.md,
  },
  searchResultsTitle: {
    color: LebrijaColors.midnightBlue,
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
  },
  closeSearchText: {
    color: 'rgba(15,23,42,0.55)',
    fontSize: 12,
    fontWeight: '800',
  },
  centeredState: {
    paddingVertical: LebrijaSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySearchState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: LebrijaSpacing.xl,
    paddingHorizontal: LebrijaSpacing.lg,
    gap: LebrijaSpacing.sm,
  },
  emptySearchText: {
    color: 'rgba(15,23,42,0.5)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: LebrijaSpacing.lg,
    paddingVertical: LebrijaSpacing.md,
    gap: LebrijaSpacing.md,
  },
  searchResultDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(213,213,216,0.2)',
  },
  searchAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: LebrijaColors.cloudDancer,
  },
  searchUserInfo: {
    flex: 1,
    gap: 4,
  },
  searchUserName: {
    color: LebrijaColors.midnightBlue,
    fontSize: 14,
    fontWeight: '800',
  },
  searchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LebrijaSpacing.xs,
    flexWrap: 'wrap',
  },
  searchUserMeta: {
    color: 'rgba(15,23,42,0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
  searchActions: {
    alignItems: 'flex-end',
    gap: LebrijaSpacing.sm,
  },
  profileIconButton: {
    padding: 8,
    borderRadius: LebrijaRadius.md,
    backgroundColor: 'rgba(246,235,200,0.85)',
    borderWidth: 1,
    borderColor: LebrijaColors.lemonIcing,
  },
  searchFriendButton: {
    minHeight: 38,
    minWidth: 94,
    borderRadius: LebrijaRadius.lg,
    paddingHorizontal: LebrijaSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  searchFriendButtonAdd: {
    backgroundColor: LebrijaColors.lemonIcing,
  },
  searchFriendButtonRemove: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  searchFriendButtonAddText: {
    color: LebrijaColors.midnightBlue,
    fontSize: 12,
    fontWeight: '800',
  },
  searchFriendButtonRemoveText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
  friendsHeader: {
    gap: LebrijaSpacing.md,
  },
  friendsTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LebrijaSpacing.sm,
  },
  friendsTitle: {
    color: LebrijaColors.midnightBlue,
    fontSize: 20,
    fontWeight: '800',
  },
  countBadge: {
    backgroundColor: LebrijaColors.white,
    borderRadius: LebrijaRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(213,213,216,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: {
    color: 'rgba(15,23,42,0.65)',
    fontSize: 13,
    fontWeight: '800',
  },
  controlsWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: LebrijaSpacing.sm,
  },
  sortGroup: {
    flexDirection: 'row',
    gap: LebrijaSpacing.sm,
    flexWrap: 'wrap',
    flex: 1,
  },
  sortButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: LebrijaRadius.md,
  },
  sortButtonActive: {
    backgroundColor: LebrijaColors.white,
    borderWidth: 1,
    borderColor: 'rgba(213,213,216,0.65)',
  },
  sortButtonText: {
    color: 'rgba(15,23,42,0.5)',
    fontSize: 13,
    fontWeight: '800',
  },
  sortButtonTextActive: {
    color: LebrijaColors.midnightBlue,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    gap: LebrijaSpacing.xs,
  },
  viewToggleButton: {
    width: 38,
    height: 38,
    borderRadius: LebrijaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleButtonActive: {
    backgroundColor: LebrijaColors.white,
    borderWidth: 1,
    borderColor: 'rgba(213,213,216,0.65)',
  },
  emptyFriendsState: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(213,213,216,0.45)',
    paddingVertical: LebrijaSpacing.xl * 2,
    paddingHorizontal: LebrijaSpacing.lg,
    alignItems: 'center',
    gap: LebrijaSpacing.sm,
  },
  emptyFriendsText: {
    color: '#64748B',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
  gridList: {
    gap: LebrijaSpacing.md,
  },
  listWrap: {
    backgroundColor: LebrijaColors.white,
    borderRadius: LebrijaRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(213,213,216,0.5)',
    overflow: 'hidden',
  },
  gridCard: {
    backgroundColor: LebrijaColors.white,
    borderRadius: 24,
    padding: LebrijaSpacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(213,213,216,0.4)',
    alignItems: 'center',
  },
  gridAvatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: LebrijaColors.cloudDancer,
    marginBottom: LebrijaSpacing.md,
  },
  gridAvatar: {
    width: '100%',
    height: '100%',
  },
  gridName: {
    color: LebrijaColors.midnightBlue,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  gridHandle: {
    color: 'rgba(15,23,42,0.5)',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  gridBadgeSlot: {
    minHeight: 26,
    justifyContent: 'center',
    marginTop: LebrijaSpacing.sm,
  },
  organizerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: LebrijaRadius.pill,
    backgroundColor: 'rgba(246,235,200,0.75)',
    borderWidth: 1,
    borderColor: LebrijaColors.lemonIcing,
  },
  organizerBadgeText: {
    color: LebrijaColors.midnightBlue,
    fontSize: 10,
    fontWeight: '800',
  },
  friendSinceCard: {
    width: '100%',
    backgroundColor: LebrijaColors.cloudDancer,
    borderRadius: LebrijaRadius.lg,
    paddingHorizontal: LebrijaSpacing.md,
    paddingVertical: LebrijaSpacing.sm,
    marginTop: LebrijaSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: LebrijaSpacing.xs,
  },
  friendSinceText: {
    color: 'rgba(15,23,42,0.55)',
    fontSize: 12,
    fontWeight: '800',
  },
  gridActions: {
    flexDirection: 'row',
    width: '100%',
    gap: LebrijaSpacing.sm,
    marginTop: LebrijaSpacing.lg,
  },
  dangerButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: LebrijaRadius.lg,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dangerButtonText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: LebrijaRadius.lg,
    backgroundColor: LebrijaColors.lemonIcing,
    borderWidth: 1,
    borderColor: 'rgba(246,235,200,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: LebrijaColors.midnightBlue,
    fontSize: 13,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.6,
  },
  listCard: {
    paddingHorizontal: LebrijaSpacing.lg,
    paddingVertical: LebrijaSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: LebrijaSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(213,213,216,0.2)',
  },
  listAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: LebrijaColors.cloudDancer,
  },
  listInfo: {
    flex: 1,
    gap: 4,
  },
  listName: {
    color: LebrijaColors.midnightBlue,
    fontSize: 14,
    fontWeight: '800',
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LebrijaSpacing.xs,
    flexWrap: 'wrap',
  },
  listMeta: {
    color: 'rgba(15,23,42,0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
  listActions: {
    width: 96,
    gap: LebrijaSpacing.sm,
  },
  smallDangerButton: {
    minHeight: 34,
    borderRadius: LebrijaRadius.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  smallDangerButtonText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
  },
  smallPrimaryButton: {
    minHeight: 34,
    borderRadius: LebrijaRadius.md,
    backgroundColor: LebrijaColors.lemonIcing,
    borderWidth: 1,
    borderColor: 'rgba(246,235,200,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallPrimaryButtonText: {
    color: LebrijaColors.midnightBlue,
    fontSize: 11,
    fontWeight: '800',
  },
});
