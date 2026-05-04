import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import EventCard from '@/components/events/EventCard';
import { COLORS } from '@/constants/theme';
import { API_URL, type Evento } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function FavoritesScreen() {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const fetchMisFavoritos = async ({ refreshing = false }: { refreshing?: boolean } = {}) => {
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

      const response = await fetch(`${API_URL}/api/mis-favoritos`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        setFetchError(`No se pudieron cargar tus favoritos (${response.status}).`);
        setEventos([]);
        return;
      }

      const result = (await response.json()) as { data?: Evento[] } | Evento[];
      const data = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : [];
      setEventos(data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFetchError('No se ha podido conectar con el servidor para cargar tus favoritos.');
      setEventos([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMisFavoritos();
  }, []);

  const eventosFiltrados = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return eventos;

    return eventos.filter((evento) => {
      const nombre = String(evento?.nombre || evento?.titulo || '').toLowerCase();
      const lugar = String(evento?.lugar || '').toLowerCase();
      const categoria = String(evento?.categoria || '').toLowerCase();
      return nombre.includes(query) || lugar.includes(query) || categoria.includes(query);
    });
  }, [eventos, searchTerm]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color="rgba(15, 23, 42, 0.4)" />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Buscar en mis favoritos..."
            placeholderTextColor="rgba(15, 23, 42, 0.4)"
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchMisFavoritos({ refreshing: true })}
            tintColor={COLORS.midnightBlue}
          />
        }>
        <View style={styles.hero}>
          <Text style={styles.title}>Mis Favoritos</Text>
          <Text style={styles.subtitle}>
            Tienes {eventos.length} eventos guardados en LebriJaleo.
          </Text>
        </View>

        {fetchError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{fetchError}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={COLORS.midnightBlue} />
            <Text style={styles.centerStateText}>Cargando tus favoritos...</Text>
          </View>
        ) : eventosFiltrados.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="favorite-border" size={48} color={COLORS.slate400} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>
              {eventos.length === 0 ? 'Aún no tienes favoritos.' : 'No se encontraron eventos.'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {eventos.length === 0
                ? 'Guarda tus eventos favoritos para acceder a ellos rápidamente.'
                : 'Prueba con otro término de búsqueda.'}
            </Text>
            {eventos.length === 0 ? (
              <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/(tabs)')}>
                <Text style={styles.emptyButtonText}>Explorar eventos</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {eventosFiltrados.map((evento) => (
              <EventCard key={String(evento?.id_evento || evento?.id)} evento={evento} />
            ))}
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  hero: {
    marginBottom: 18,
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
    marginBottom: 12,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: '#b91c1c',
    fontWeight: '600',
    fontSize: 14,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 14,
  },
  centerStateText: {
    color: COLORS.slate500,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.slate500,
    textAlign: 'center',
    marginTop: 6,
  },
  emptyButton: {
    marginTop: 18,
    backgroundColor: COLORS.midnightBlue,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  cardsContainer: {
    gap: 16,
    paddingBottom: 16,
  },
});