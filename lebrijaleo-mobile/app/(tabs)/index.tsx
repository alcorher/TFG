import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image,
  FlatList, ActivityIndicator, Modal, SafeAreaView 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { isBefore, isValid, isWithinInterval, parseISO, startOfDay } from 'date-fns';

// Componentes importados (asegúrate de adaptarlos también a React Native)
import Navbar from '@/components/layout/Sidebar'; 
import EventCard from '@/components/events/EventCard';
import { DateRangePicker } from '@/components/events/DateRangePicker';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const CATEGORIAS_DISPONIBLES = [
  'Flamenco', 'Gastronomía', 'Música', 'Cultura', 
  'Teatro', 'Deporte', 'Arte', 'Ocio Nocturno'
];

const COLORS = {
  midnightBlue: '#1e293b',
  lemonIcing: '#fef08a',
  cloudDancer: '#f8fafc',
  formBg: '#f1f5f9',
  nimbusCloud: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  white: '#ffffff',
  red500: '#ef4444',
  overlay: 'rgba(30, 41, 59, 0.5)'
};

export default function HomePage() {
  const insets = useSafeAreaInsets();

  const [eventos, setEventos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeFilters, setActiveFilters] = useState([]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    async function fetchEventos() {
      setFetchError('');

      try {
        const response = await fetch(`${API_URL}/api/eventos`);

        if (!response.ok) {
          setFetchError(`No se pudo cargar la cartelera (${response.status}).`);
          return;
        }

        const result = await response.json();
        const eventosData = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
          ? result.data
          : [];

        setEventos(eventosData);

        if (!Array.isArray(result?.data) && !Array.isArray(result)) {
          setFetchError('La respuesta de la API no tiene el formato esperado.');
        }
      } catch (error) {
        setFetchError(
          `Error de conexión con la API (${API_URL}). Comprueba que el backend esté activo y accesible desde el móvil/web.`
        );
        console.error("Error de conexión:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEventos();
  }, []);

  const toggleFilter = (categoria) => {
    if (activeFilters.includes(categoria)) {
      setActiveFilters(activeFilters.filter(f => f !== categoria));
    } else {
      setActiveFilters([...activeFilters, categoria]);
    }
  };

  const eventosFiltrados = eventos.filter((evento) => {
    const todayStart = startOfDay(new Date());
    const hasDateFilter = Boolean(dateRange?.from && dateRange?.to);
    const allowPastByDateFilter = hasDateFilter && isBefore(startOfDay(dateRange.from), todayStart);

    const coincideTexto = 
      (evento.nombre || evento.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evento.lugar || '').toLowerCase().includes(searchTerm.toLowerCase());

    const coincideCategoria = activeFilters.length === 0 || activeFilters.includes(evento.categoria);

    let coincideFecha = true;
    const fechaEvento = evento.fecha ? parseISO(evento.fecha) : null;

    if (!fechaEvento || !isValid(fechaEvento)) {
      return false;
    }

    // Por defecto no mostramos eventos pasados.
    // Solo los permitimos cuando el usuario filtra explícitamente desde una fecha pasada.
    if (!allowPastByDateFilter && isBefore(fechaEvento, todayStart)) {
      return false;
    }

    if (dateRange?.from && dateRange?.to && fechaEvento) {
      try {
        coincideFecha = isWithinInterval(fechaEvento, { start: dateRange.from, end: dateRange.to });
      } catch {
        coincideFecha = true;
      }
    }

    return coincideTexto && coincideCategoria && coincideFecha;
  });

  const renderFiltrosMobile = () => (
    <Modal
      visible={isMobileFiltersOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setIsMobileFiltersOpen(false)}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filtros y Búsqueda</Text>
            <TouchableOpacity onPress={() => setIsMobileFiltersOpen(false)} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={COLORS.slate400} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={[{ key: 'content' }]} // Truco para hacer scroll del contenido interno sin ScrollView conflictivo
            renderItem={() => (
              <View style={styles.sheetContent}>
                {/* Categorías */}
                <Text style={styles.sectionTitle}>Categorías</Text>
                <View style={styles.categoriesGrid}>
                  {CATEGORIAS_DISPONIBLES.map(categoria => {
                    const isActive = activeFilters.includes(categoria);
                    return (
                      <TouchableOpacity
                        key={categoria}
                        onPress={() => toggleFilter(categoria)}
                        style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                      >
                        <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                          {categoria}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Filtros Activos */}
                {activeFilters.length > 0 && (
                  <View style={styles.activeFiltersContainer}>
                    <View style={styles.activeFiltersHeader}>
                      <Text style={styles.sectionTitle}>Filtros activos</Text>
                      <TouchableOpacity onPress={() => setActiveFilters([])}>
                        <Text style={styles.clearText}>Limpiar</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.activeFiltersRow}>
                      {activeFilters.map(filter => (
                        <View key={filter} style={styles.activeFilterTag}>
                          <Text style={styles.activeFilterTagText}>{filter}</Text>
                          <TouchableOpacity onPress={() => toggleFilter(filter)}>
                            <MaterialIcons name="close" size={16} color={COLORS.midnightBlue} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Fechas */}
                <View style={styles.dateSectionHeader}>
                  <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Filtrar por fecha</Text>
                  {(dateRange?.from || dateRange?.to) ? (
                    <TouchableOpacity onPress={() => setDateRange({ from: null, to: null })}>
                      <Text style={[styles.clearText, { marginTop: 20 }]}>Limpiar fechas</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.datePickerContainer}>
                   <DateRangePicker value={dateRange} onRangeChange={setDateRange} />
                </View>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Navbar />

      <View style={styles.mainContent}>
        <View style={[styles.header, { paddingTop: Math.max(12, insets.top * 0.25) }]}> 
          <View style={styles.logoContainer}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={24} color={COLORS.nimbusCloud} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar eventos, lugares..."
              placeholderTextColor={COLORS.slate400}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setIsMobileFiltersOpen(true)}
          >
            <MaterialIcons name="filter-list" size={24} color={COLORS.slate400} />
            {(activeFilters.length > 0 || (dateRange?.from && dateRange?.to)) && (
              <View style={styles.badge} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Cartelera de Eventos</Text>
          <Text style={styles.pageSubtitle}>Descubre qué está pasando en Lebrija.</Text>
          {fetchError ? <Text style={styles.errorText}>{fetchError}</Text> : null}
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.midnightBlue} />
            <Text style={styles.loadingText}>Cargando la cartelera...</Text>
          </View>
        ) : (
          <FlatList
            data={eventosFiltrados}
            keyExtractor={(item, index) => String(item?.id_evento ?? item?.id ?? index)}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => <EventCard evento={item} />}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No se han encontrado eventos que coincidan con tu búsqueda.
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {renderFiltrosMobile()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cloudDancer,
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.formBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(203, 213, 225, 0.3)',
    gap: 12,
    zIndex: 1,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.nimbusCloud,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  logoContainer: {
    width: 42,
    height: 42,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.nimbusCloud,
  },
  logo: {
    width: 28,
    height: 28,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.midnightBlue,
    height: '100%',
  },
  filterButton: {
    padding: 10,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.nimbusCloud,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    backgroundColor: COLORS.red500,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  pageHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.midnightBlue,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.slate600,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.red500,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: COLORS.slate500,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(203, 213, 225, 0.3)',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyStateText: {
    color: COLORS.slate500,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(203, 213, 225, 0.3)',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.midnightBlue,
  },
  closeButton: {
    padding: 4,
  },
  sheetContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.midnightBlue,
    marginBottom: 12,
  },
  dateSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.4)',
    backgroundColor: COLORS.white,
    width: '48%', // Emular grid-cols-2
    alignItems: 'center',
  },
  categoryPillActive: {
    backgroundColor: COLORS.lemonIcing,
    borderColor: COLORS.lemonIcing,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.slate600,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: COLORS.midnightBlue,
    fontWeight: 'bold',
  },
  activeFiltersContainer: {
    marginTop: 24,
  },
  activeFiltersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 12,
    color: COLORS.slate500,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lemonIcing,
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.3)',
    gap: 4,
  },
  activeFilterTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.midnightBlue,
  },
  datePickerContainer: {
    backgroundColor: COLORS.formBg,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.4)',
    alignItems: 'center',
  }
});