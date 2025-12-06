function detectDevice() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        document.body.classList.add('is-mobile');
        document.body.classList.remove('is-desktop');
        console.log("Device: Mobile");
    } else {
        document.body.classList.add('is-desktop');
        document.body.classList.remove('is-mobile');
        console.log("Device: Desktop (PC)");
    }
}

// Запускаем сразу при загрузке
detectDevice();
// === ЛОГИКА СТЕКЛА (ТЕКСТУРА И ПРЕЛОМЛЕНИЕ) ===
// Функция из статьи Habr для имитации background-attachment: fixed
const updateDataJSBackgroundAttachmentFixedElements = () => {
    const elements = document.querySelectorAll("[data-js-background-attachment-fixed]");
    for (const element of elements) {
        if (!(element instanceof HTMLElement)) continue;
        const clientRect = element.getBoundingClientRect();
        // Двигаем фон противоположно скроллу
        element.style.backgroundPositionX = `${(-clientRect.x).toString()}px`;
        element.style.backgroundPositionY = `${(-clientRect.y).toString()}px`;
    }
};

const initDataJSBackgroundAttachmentFixed = () => {
    requestAnimationFrame(() => {
        updateDataJSBackgroundAttachmentFixedElements();
        initDataJSBackgroundAttachmentFixed();
    });
};

// === НАСТРОЙКИ БАЗЫ ДАННЫХ ===
const BLOB_ID = '019ae59e-d6cd-78dc-9d94-edb43c4c2d9c'; 
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
    // Запускаем анимацию света из статьи
    initDataJSBackgroundAttachmentFixed();
});

// === ЗАГРУЗКА ДАННЫХ ===
async function loadData() {
    animeListEl.innerHTML = '<div style="text-align:center; margin-top:50px; color:#aaa;"><i class="fa-solid fa-cloud-arrow-down fa-bounce"></i> Загрузка...</div>';
    
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
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
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(animeData)
        });

        if (!response.ok) throw new Error('Ошибка сохранения');

    } catch (error) {
        alert('Не удалось сохранить в облако!');
        console.error(error);
    } finally {
        addBtn.innerHTML = oldText;
        addBtn.disabled = false;
    }
}

function renderList(data) {
    animeListEl.innerHTML = '';
    if(totalCountEl) totalCountEl.textContent = data.length;
    
    // Если пусто
    if (data.length === 0) {
        animeListEl.innerHTML = `
            <div style="text-align:center; color:#999; margin-top:50px;">
                <i class="fa-solid fa-ghost" style="font-size:3rem; margin-bottom:10px;"></i>
                <p>Пусто...</p>
            </div>`;
        return;
    }

    // Цикл создания карточек
    data.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'anime-card glass-panel';
        if(index < 20) card.style.animationDelay = `${index * 0.03}s`;
        
        card.onclick = () => openEditModal(item.id);

        const firstLetter = item.title ? item.title[0].toUpperCase() : '?';
        const hue = (item.id * 137) % 360; 

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
            <div class="glass-light" data-js-background-attachment-fixed></div>

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

    requestAnimationFrame(updateFisheyeEffect);
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

function resetData() {
    if(confirm('Перезагрузить страницу?')) {
        location.reload();
    }
}

function updateFisheyeEffect() {
    // getElementsByClassName возвращает "Живой список". 
    // Он работает мгновенно и сам знает, когда добавились новые карточки.
    const liveCards = document.getElementsByClassName('anime-card');

    // Если карточек нет — просто уходим, экономим ресурсы
    if (liveCards.length === 0) return;

    const height = window.innerHeight;
    const centerY = height / 2;
    const safeZone = height * 0.25;
    const maxDist = height * 0.6;
    
    // Используем обычный цикл for — это самый быстрый способ перебора в JS (быстрее forEach)
    // Это важно для 120 FPS
    for (let i = 0; i < liveCards.length; i++) {
        const card = liveCards[i];

        // === ИСПРАВЛЕНИЕ РЫВКА (ОСТАВЛЯЕМ КАК БЫЛО) ===
        if (document.body.classList.contains('is-desktop') && card.matches(':hover')) {
             continue; // Пропускаем эту итерацию цикла
        }

        const rect = card.getBoundingClientRect();
        const cardCenterY = rect.top + (rect.height / 2);
        const distance = Math.abs(centerY - cardCenterY);

        let scale = 1;

        if (distance > safeZone) {
            const activeDistance = distance - safeZone;
            const effectiveMax = maxDist - safeZone;
            let factor = activeDistance / effectiveMax;
            if (factor > 1) factor = 1;
            scale = 1 - (factor * 0.15);
        }

        card.style.transform = `scale(${scale})`;
    }
}

// Запускаем эффект при скролле (без проверок)
window.addEventListener('scroll', () => {
    window.requestAnimationFrame(updateFisheyeEffect);
});

let isScrolling;

window.addEventListener('scroll', function() {
    // 1. Добавляем класс, отключающий ховер
    document.body.classList.add('disable-hover');

    // 2. Очищаем предыдущий таймер (если скролл продолжается)
    window.clearTimeout(isScrolling);

    // 3. Запускаем новый таймер
    isScrolling = setTimeout(function() {
        // Этот код сработает через 200мс после ОСТАНОВКИ скролла
        document.body.classList.remove('disable-hover');
    }, 200);
}, false);