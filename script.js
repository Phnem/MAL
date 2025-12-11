function detectDevice() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        document.body.classList.add('is-mobile');
        document.body.classList.remove('is-desktop');
    } else {
        document.body.classList.add('is-desktop');
        document.body.classList.remove('is-mobile');
    }
}
detectDevice();

// === ФОН ===
const updateDataJSBackgroundAttachmentFixedElements = () => {
    const elements = document.querySelectorAll("[data-js-background-attachment-fixed]");
    for (const element of elements) {
        if (!(element instanceof HTMLElement)) continue;
        if (element.closest('.anime-card:hover')) continue;
        const clientRect = element.getBoundingClientRect();
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

// === ДАННЫЕ ===
const BLOB_ID = '019ae59e-d6cd-78dc-9d94-edb43c4c2d9c'; 
const API_URL = 'https://jsonblob.com/api/jsonBlob/' + BLOB_ID;
let animeData = [];

const animeListEl = document.getElementById('animeList');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const modal = document.getElementById('modal');
const animeForm = document.getElementById('animeForm');
const addBtn = document.getElementById('addBtn');
const closeModalBtn = document.getElementById('closeModal');
const deleteBtn = document.getElementById('deleteBtn');
const totalCountEl = document.getElementById('totalCount');

// === ЗАПУСК ===
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initDataJSBackgroundAttachmentFixed();
    
    // Инициализируем ОБА селекта
    setupCustomSelect('sortCustom', 'sortSelect');   // Сортировка
    setupCustomSelect('ratingCustom', 'ratingInput'); // Рейтинг
});

// === ЗАГРУЗКА ===
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
       animeListEl.innerHTML = '<div style="text-align:center; color:#ff5e57; margin-top:50px;">Сервер недоступен.<br>Попробуй позже.</div>';
    }
}

// === СОХРАНЕНИЕ ===
async function saveToCloud() {
    const oldText = addBtn.innerHTML;
    addBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    addBtn.disabled = true;
    try {
        await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(animeData)
        });
    } catch (error) {
        alert('Ошибка сохранения!');
    } finally {
        addBtn.innerHTML = oldText;
        addBtn.disabled = false;
    }
}

function renderList(data) {
    animeListEl.innerHTML = '';
    if(totalCountEl) totalCountEl.textContent = data.length;
    
    if (data.length === 0) {
        animeListEl.innerHTML = `<div style="text-align:center; color:#999; margin-top:50px;"><i class="fa-solid fa-ghost" style="font-size:3rem;"></i><p>Пусто...</p></div>`;
        return;
    }

    data.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'anime-card glass-panel';
        if(index < 20) card.style.animationDelay = `${index * 0.03}s`;
        card.onclick = () => openEditModal(item.id);

        let finalImage = item.image;
        if (finalImage) {
            finalImage = finalImage.trim();
            if (finalImage.toLowerCase().includes('imgur.com') && !finalImage.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                const parts = finalImage.split('/');
                finalImage = `https://i.imgur.com/${parts[parts.length - 1]}.jpg`;
            }
        }
        
        const hue = (item.id * 137) % 360;
        const bgStyle = finalImage ? `background-image: url('${finalImage}'); background-size: cover;` : `background-color: hsl(${hue}, 70%, 85%); color: hsl(${hue}, 60%, 40%); font-weight:bold; font-size:1.2rem;`;
        const imgContent = finalImage ? '' : (item.title ? item.title[0].toUpperCase() : '?');

        card.innerHTML = `
            <div class="glass-light" data-js-background-attachment-fixed></div>
            <div class="card-img" style="${bgStyle}">${imgContent}</div>
            <div class="card-info">
                <div class="card-title">${item.title}</div>
                <div class="card-meta"><span class="tag">${item.episodes} серий</span></div>
            </div>
            <div class="card-rating">
                <i class="fa-solid fa-star star"></i><span class="rating-num">${item.rating}</span>
            </div>
        `;
        animeListEl.appendChild(card);
    });
    requestAnimationFrame(updateFisheyeEffect);
}

// === ПОИСК ===
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

// === СОРТИРОВКА (Обработчик реального селекта) ===
// Когда наш кастомный селект меняет реальный, срабатывает это событие
document.getElementById('sortSelect').addEventListener('change', (e) => {
    const sortType = e.target.value;
    let sortedData = [...animeData]; // Копия массива
    
    if (sortType === 'rating_desc') sortedData.sort((a, b) => b.rating - a.rating);
    else if (sortType === 'rating_asc') sortedData.sort((a, b) => a.rating - b.rating);
    else if (sortType === 'episodes_desc') sortedData.sort((a, b) => b.episodes - a.episodes);
    else sortedData.sort((a, b) => b.id - a.id); // По умолчанию - новые сверху
    
    renderList(sortedData);
});

// === МОДАЛЬНОЕ ОКНО ===
function openModal(isEdit = false) {
    modal.classList.add('active');
    document.getElementById('modalTitle').textContent = isEdit ? 'Редактировать' : 'Новое аниме';
    deleteBtn.style.display = isEdit ? 'block' : 'none';
    
    // Сброс текста селекта рейтинга при создании нового
    if(!isEdit) {
        updateCustomSelectView('ratingCustom', '5');
        document.getElementById('ratingInput').value = '5';
    }
}

function closeModal() {
    modal.classList.remove('active');
    // Закрываем все открытые селекты
    document.querySelectorAll('.custom-select.open').forEach(el => el.classList.remove('open'));
    
    setTimeout(() => {
        animeForm.reset();
        document.getElementById('animeId').value = '';
    }, 300);
}

addBtn.addEventListener('click', () => openModal(false));
closeModalBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// === РЕДАКТИРОВАНИЕ ===
function openEditModal(id) {
    const item = animeData.find(a => a.id === id);
    if (!item) return;
    document.getElementById('animeId').value = item.id;
    document.getElementById('titleInput').value = item.title;
    document.getElementById('imageInput').value = item.image || '';
    document.getElementById('episodesInput').value = item.episodes;
    
    // Обновляем скрытый инпут и красивый селект
    document.getElementById('ratingInput').value = item.rating;
    updateCustomSelectView('ratingCustom', item.rating);

    openModal(true);
}

animeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('animeId').value;
    const title = document.getElementById('titleInput').value;
    const image = document.getElementById('imageInput').value;
    const episodes = Number(document.getElementById('episodesInput').value);
    const rating = Number(document.getElementById('ratingInput').value);

    if (id) {
        const index = animeData.findIndex(a => a.id == id);
        if (index !== -1) animeData[index] = { ...animeData[index], title, image, episodes, rating };
    } else {
        animeData.push({ id: Date.now(), title, image, episodes, rating });
    }
    // После сохранения сортируем заново, если нужно (берем текущую сортировку)
    const currentSort = document.getElementById('sortSelect').value;
    // ... можно вызвать сортировку, но renderList покажет как есть
    renderList(animeData);
    
    closeModal();
    await saveToCloud();
});

deleteBtn.addEventListener('click', async () => {
    const id = document.getElementById('animeId').value;
    if (confirm('Удалить?')) {
        animeData = animeData.filter(a => a.id != id);
        renderList(animeData);
        closeModal();
        await saveToCloud();
    }
});

function resetData() {
    if(confirm('Перезагрузить страницу?')) location.reload();
}

// === УНИВЕРСАЛЬНАЯ ЛОГИКА КАСТОМНЫХ СЕЛЕКТОВ ===
function setupCustomSelect(wrapperId, realSelectId) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    
    const realSelect = document.getElementById(realSelectId);
    const trigger = wrapper.querySelector('.select-trigger');
    const triggerText = wrapper.querySelector('.trigger-text');
    const options = wrapper.querySelectorAll('.option');

    // 1. Клик по кнопке
    trigger.addEventListener('click', (e) => {
        // Закрываем другие селекты, если есть
        document.querySelectorAll('.custom-select').forEach(el => {
            if (el !== wrapper) el.classList.remove('open');
        });
        wrapper.classList.toggle('open');
        e.stopPropagation();
    });

    // 2. Выбор опции
    options.forEach(option => {
        option.addEventListener('click', (e) => {
            const value = option.getAttribute('data-value');
            
            // Обновляем текст кнопки (HTML из опции)
            triggerText.innerHTML = option.innerHTML;
            
            // Обновляем скрытый селект
            realSelect.value = value;
            
            // ВАЖНО: Сообщаем системе, что значение изменилось
            // Это нужно, чтобы сработал "change" у сортировки
            realSelect.dispatchEvent(new Event('change'));
            
            wrapper.classList.remove('open');
            e.stopPropagation();
        });
    });

    // 3. Клик мимо закрывает всё
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
    });
}

// Вспомогательная функция для обновления вида (когда открываем редактирование)
function updateCustomSelectView(wrapperId, value) {
    const wrapper = document.getElementById(wrapperId);
    if(!wrapper) return;
    const option = wrapper.querySelector(`.option[data-value="${value}"]`);
    if(option) {
        wrapper.querySelector('.trigger-text').innerHTML = option.innerHTML;
    }
}

// === FISHEYE EFFECT ===
function updateFisheyeEffect() {
    const liveCards = document.getElementsByClassName('anime-card');
    if (liveCards.length === 0) return;
    const height = window.innerHeight;
    const centerY = height / 2;
    const safeZone = height * 0.25;
    const maxDist = height * 0.6;
    
    for (let i = 0; i < liveCards.length; i++) {
        const card = liveCards[i];
        if (document.body.classList.contains('is-desktop') && card.matches(':hover')) continue;

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
window.addEventListener('scroll', () => window.requestAnimationFrame(updateFisheyeEffect));
let isScrolling;
window.addEventListener('scroll', function() {
    document.body.classList.add('disable-hover');
    window.clearTimeout(isScrolling);
    isScrolling = setTimeout(function() {
        document.body.classList.remove('disable-hover');
    }, 200);
}, false);