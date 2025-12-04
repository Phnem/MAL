// === ЛОГИКА СТЕКЛА (ТЕКСТУРА) ===
const svgImage = document.getElementById("displacement-map-image");
if (svgImage) {
    // Эта картинка создает эффект искажения на стекле
    fetch("https://raw.githubusercontent.com/essykings/JavaScript/main/map.png")
      .then((response) => response.blob())
      .then((blob) => {
        const objURL = URL.createObjectURL(blob);
        svgImage.setAttribute("href", objURL);
      })
      .catch(e => console.log("Ошибка загрузки текстуры стекла:", e));
}

// === НАСТРОЙКИ БАЗЫ ДАННЫХ ===
const BLOB_ID = '019ae59e-d6cd-78dc-9d94-edb43c4c2d9c'; 
// Используем прокси для обхода CORS на хостинге
const API_URL = 'https://corsproxy.io/?' + encodeURIComponent('https://jsonblob.com/api/jsonBlob/' + BLOB_ID);

let animeData = [];

// === DOM ЭЛЕМЕНТЫ ===
const animeListEl = document.getElementById('animeList');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const sortSelect = document.getElementById('sortSelect');
const modal = document.getElementById('modal');
const animeForm = document.getElementById('animeForm');
const addBtn = document.getElementById('addBtn');
const closeModalBtn = document.getElementById('closeModal');
const deleteBtn = document.getElementById('deleteBtn');
const totalCountEl = document.getElementById('totalCount');

// === ЗАПУСК ===
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

// === ЗАГРУЗКА ДАННЫХ ===
async function loadData() {
    animeListEl.innerHTML = '<div style="text-align:center; margin-top:50px; color:#aaa;"><i class="fa-solid fa-cloud-arrow-down fa-bounce"></i> Загрузка...</div>';
    
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки');
        
        animeData = await response.json();
        if(!Array.isArray(animeData)) animeData = [];
        
        renderList(animeData);
        
    } catch (error) {
        console.error(error);
        animeListEl.innerHTML = '<div style="text-align:center; color:#ff5e57; margin-top:50px;">Ошибка связи с облаком.<br>Попробуй отключить AdBlock.</div>';
    }
}

// === СОХРАНЕНИЕ ДАННЫХ ===
async function saveToCloud() {
    const oldText = addBtn.innerHTML;
    addBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    addBtn.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(animeData)
        });

        if (!response.ok) throw new Error('Ошибка сохранения');

    } catch (error) {
        alert('Не удалось сохранить в облако! Проверь интернет.');
        console.error(error);
    } finally {
        addBtn.innerHTML = oldText;
        addBtn.disabled = false;
    }
}

// === ОТРИСОВКА СПИСКА ===
function renderList(data) {
    animeListEl.innerHTML = '';
    if(totalCountEl) totalCountEl.textContent = data.length;
    
    if (data.length === 0) {
        animeListEl.innerHTML = `
            <div style="text-align:center; color:#999; margin-top:50px;">
                <i class="fa-solid fa-ghost" style="font-size:3rem; margin-bottom:10px;"></i>
                <p>Пусто...</p>
            </div>`;
        return;
    }

    data.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        // Небольшая задержка анимации
        if(index < 20) card.style.animationDelay = `${index * 0.03}s`;
        
        card.onclick = () => openEditModal(item.id);

        const firstLetter = item.title ? item.title[0].toUpperCase() : '?';
        const hue = (item.id * 137) % 360; 

        // АВТО-ИСПРАВЛЕНИЕ ССЫЛОК IMGUR
        let finalImage = item.image;
        if (finalImage && finalImage.toLowerCase().includes('imgur.com') && !finalImage.match(/\.(jpeg|jpg|gif|png)$/i)) {
             const code = finalImage.split('/').pop();
             finalImage = `https://i.imgur.com/${code}.jpg`;
        }

        const bgStyle = finalImage ? 
            `background-image: url('${finalImage}'); background-size: cover;` : 
            `background-color: hsl(${hue}, 70%, 85%); color: hsl(${hue}, 60%, 40%); font-weight:bold; font-size:1.2rem;`;
        
        const imgContent = finalImage ? '' : firstLetter;

        card.innerHTML = `
            <div class="card-img" style="${bgStyle}">
                ${imgContent}
            </div>
            <div class="card-info">
                <div class="card-title">${item.title}</div>
                <div class="card-meta">
                    <span class="tag">${item.episodes} серий</span>
                </div>
            </div>
            <div class="card-rating">
                <i class="fa-solid fa-star star"></i>
                <span class="rating-num">${item.rating}</span>
            </div>
        `;
        animeListEl.appendChild(card);
    });
}

// === ПОИСК И СОРТИРОВКА ===
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    clearSearchBtn.style.display = term ? 'block' : 'none';
    const filtered = animeData.filter(item => item.title.toLowerCase().includes(term));
    renderList(filtered);
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    renderList(animeData);
});

sortSelect.addEventListener('change', () => {
    const sortType = sortSelect.value;
    let sortedData = [...animeData];
    if (sortType === 'rating_desc') sortedData.sort((a, b) => b.rating - a.rating);
    else if (sortType === 'rating_asc') sortedData.sort((a, b) => a.rating - b.rating);
    else if (sortType === 'episodes_desc') sortedData.sort((a, b) => b.episodes - a.episodes);
    else sortedData.sort((a, b) => a.id - b.id);
    renderList(sortedData);
});

// === МОДАЛЬНОЕ ОКНО ===
function openModal(isEdit = false) {
    modal.classList.add('active');
    document.getElementById('modalTitle').textContent = isEdit ? 'Редактировать' : 'Новое аниме';
    deleteBtn.style.display = isEdit ? 'block' : 'none';
}

function closeModal() {
    modal.classList.remove('active');
    setTimeout(() => {
        animeForm.reset();
        document.getElementById('animeId').value = '';
    }, 300);
}

addBtn.addEventListener('click', () => openModal(false));
closeModalBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

function openEditModal(id) {
    const item = animeData.find(a => a.id === id);
    if (!item) return;
    document.getElementById('animeId').value = item.id;
    document.getElementById('titleInput').value = item.title;
    document.getElementById('imageInput').value = item.image || '';
    document.getElementById('episodesInput').value = item.episodes;
    document.getElementById('ratingInput').value = item.rating;
    openModal(true);
}

// === ОБРАБОТКА ФОРМЫ (СОХРАНЕНИЕ) ===
animeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('animeId').value;
    const title = document.getElementById('titleInput').value;
    const image = document.getElementById('imageInput').value;
    const episodes = Number(document.getElementById('episodesInput').value);
    const rating = Number(document.getElementById('ratingInput').value);

    if (id) {
        const index = animeData.findIndex(a => a.id == id);
        if (index !== -1) {
            animeData[index] = { ...animeData[index], title, image, episodes, rating };
        }
    } else {
        const newItem = { id: Date.now(), title, image, episodes, rating };
        animeData.push(newItem);
    }

    renderList(animeData);
    closeModal();
    await saveToCloud();
});

// === УДАЛЕНИЕ ===
deleteBtn.addEventListener('click', async () => {
    const id = document.getElementById('animeId').value;
    if (confirm('Удалить из списка?')) {
        animeData = animeData.filter(a => a.id != id);
        renderList(animeData);
        closeModal();
        await saveToCloud();
    }
});

// === СБРОС (ДЛЯ КНОПКИ В ХЕДЕРЕ) ===
function resetData() {
    if(confirm('Перезагрузить страницу?')) {
        location.reload();
    }
}