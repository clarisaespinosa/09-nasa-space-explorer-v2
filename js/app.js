document.addEventListener("DOMContentLoaded", () => {

  const gallery = document.getElementById('gallery');
  const loadBtn = document.getElementById('load-btn');
  const startDateInput = document.getElementById('start-date');

  const modal = document.getElementById('modal');
  const closeModal = document.getElementById('close-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDate = document.getElementById('modal-date');
  const modalImg = document.getElementById('modal-img');
  const modalVideo = document.getElementById('modal-video');
  const modalExplanation = document.getElementById('modal-explanation');

  // URL Base con la nueva API Key
  const BASE_URL = `https://api.nasa.gov/planetary/apod?api_key=Cw4QupJrjrwa8pDnTDBBOxldzUdseVU5kB8gYrHp`;

  // Función para obtener datos, ahora acepta una fecha de inicio
  async function fetchData(startDate) {
    let apiUrl = '';

    if (startDate) {
        // 1. Calcula la fecha final (8 días después = 9 días en total)
        const start = new Date(startDate);
        const endDateObj = new Date(start);
        endDateObj.setDate(start.getDate() + 8); 
        
        // Formatea la fecha de fin a 'YYYY-MM-DD'
        const endDateString = endDateObj.toISOString().split('T')[0];
        
        // 2. Construye la URL con el rango de fechas
        apiUrl = `${BASE_URL}&start_date=${startDate}&end_date=${endDateString}`;
    } else {
        // Opción de reserva: si no hay fecha, pide 9 imágenes recientes
        apiUrl = `${BASE_URL}&count=9`;
    }

    try {
      const res = await fetch(apiUrl);
      const data = await res.json();
      
      // Si la API devuelve un solo objeto, lo convertimos a un array.
      if (!Array.isArray(data)) {
          return [data].filter(item => item.media_type);
      }

      // Filtramos para asegurar que solo tenemos entradas válidas
      return data.filter(item => item.media_type);

    } catch (error) {
      console.error("Error fetching data from NASA APOD:", error);
      gallery.innerHTML = '<p style="color:red; text-align: center;">Error al cargar datos. Revisa la consola o intenta con otra fecha.</p>';
      return null;
    }
  }

  function renderGallery(items) {
    gallery.innerHTML = '';
    
    // Muestra los elementos más recientes primero
    items.slice().reverse().forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';
      let mediaHTML = '';

      if (item.media_type === 'image') {
        mediaHTML = `<img src="${item.url}" alt="${item.title}" />`;
      } else if (item.media_type === 'video') {
        const thumb = item.thumbnail_url || 'https://img.youtube.com/vi/' + extractYoutubeID(item.url) + '/hqdefault.jpg';
        mediaHTML = `<img src="${thumb}" alt="Video thumbnail"/>`;
      } else {
          // Ignorar otros tipos de media
          return; 
  
