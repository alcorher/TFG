
/**
 * Genera el contenido TXT de las estadísticas de un organizador.
 */
export function generateStatsTxt(stats) {
  const fecha = new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric'
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
      .forEach((ev, i) => {
        txt += `  ${i + 1}. ${ev.nombre} — ${ev.likes} like${ev.likes !== 1 ? 's' : ''}\n`;
      });
    txt += '\n';
  }

  txt += '=============================================\n';
  return txt;
}

/**
 * Descarga un string como archivo .txt en el navegador.
 */
export function downloadTxt(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Llama al endpoint de estadísticas y devuelve los datos.
 */
export async function fetchOrganizerStats(userId, token, apiUrl) {
  const res = await fetch(`${apiUrl}/api/estadisticas-organizador/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al obtener estadísticas');
  }
  return res.json();
}
