import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { addDays, format, parseISO, isBefore } from 'date-fns';
import { COLORS } from '@/constants/theme';

// 1. Traducir el calendario al español (igual que import { es } de date-fns)
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

const toDayString = (value) => {
  if (!value) return null;

  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  return format(value, 'yyyy-MM-dd');
};

export function DateRangePicker({ style, value, onRangeChange }) {
  // react-native-calendars trabaja nativamente con strings 'YYYY-MM-DD'
  const [startDate, setStartDate] = useState(toDayString(value?.from));
  const [endDate, setEndDate] = useState(toDayString(value?.to));

  useEffect(() => {
    const nextStart = toDayString(value?.from);
    const nextEnd = toDayString(value?.to);

    setStartDate(nextStart);
    setEndDate(nextEnd);
  }, [value]);

  useEffect(() => {
    if (onRangeChange && startDate && endDate) {
      // Devolvemos objetos Date para mantener compatibilidad con tu lógica de la vista principal
      onRangeChange({
        from: parseISO(startDate),
        to: parseISO(endDate)
      });
    }
  }, [startDate, endDate, onRangeChange]);

  const onDayPress = (day) => {
    if (!startDate || (startDate && endDate)) {
      // Inicia un nuevo rango
      setStartDate(day.dateString);
      setEndDate(null);
    } else if (startDate && !endDate) {
      // Cierra el rango
      const start = parseISO(startDate);
      const end = parseISO(day.dateString);
      
      // Control de seguridad: Si el usuario toca un día anterior al inicio, reinicia
      if (isBefore(end, start)) {
        setStartDate(day.dateString);
      } else {
        setEndDate(day.dateString);
      }
    }
  };

  // 2. Generar el marcado visual (equivalente a day_selected y day_range_middle de Tailwind)
  const getMarkedDates = () => {
    const marked = {};
    const selectionColor = COLORS.lemonIcing;
    const middleColor = 'rgba(246, 235, 200, 0.4)'; // lemon-icing/40
    const textColor = COLORS.midnightBlue;

    if (startDate) {
      marked[startDate] = { startingDay: true, color: selectionColor, textColor };
    }
    
    if (endDate) {
      marked[endDate] = { endingDay: true, color: selectionColor, textColor };
    }
    
    if (startDate && endDate) {
      let currentDate = addDays(parseISO(startDate), 1);
      const end = parseISO(endDate);
      
      while (isBefore(currentDate, end)) {
        const dateString = format(currentDate, 'yyyy-MM-dd');
        marked[dateString] = { color: middleColor, textColor };
        currentDate = addDays(currentDate, 1);
      }
    }
    return marked;
  };

  return (
    <View style={[styles.container, style]}>
      <Calendar
        markingType={'period'}
        markedDates={getMarkedDates()}
        onDayPress={onDayPress}
        theme={{
          backgroundColor: 'transparent',
          calendarBackground: 'transparent',
          textSectionTitleColor: COLORS.slate500,
          todayTextColor: COLORS.midnightBlue,
          dayTextColor: COLORS.midnightBlue,
          textDisabledColor: COLORS.nimbusCloud,
          arrowColor: COLORS.midnightBlue,
          monthTextColor: COLORS.midnightBlue,
          textDayFontWeight: '500',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: 'bold',
          // Replicando "day_today" font-bold de tu web
          'stylesheet.day.period': {
            todayText: {
              fontWeight: 'bold',
              color: COLORS.midnightBlue,
            }
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  }
});