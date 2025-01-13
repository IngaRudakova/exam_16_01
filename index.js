const apiUrl = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods';
const apiKey = '65f931a2-29e2-4ca0-b490-5a19bb332145';
let productsData = [];
let currentPage = 1;
let totalPages = 1;
let sortOrder = 'rating_asc'; // По умолчанию сортировка по возрастанию рейтинга
let categories = new Set();

// Объект для перевода категорий
const categoryTranslations = {
    'home & kitchen': 'Дом и кухня',
    'tv, audio & cameras': 'Телевизоры, аудио и камеры',
    'sports & fitness': 'Спорт и фитнес',
    'beauty & health': 'Красота и здоровье'
};

// Функция для получения продуктов с API
async function fetchProducts(page, perPage = 10, sortOrder) {
    try {
        const response = await fetch(`${apiUrl}?page=${page}&per_page=${perPage}&sort_order=${sortOrder}&api_key=${apiKey}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        totalPages = data._pagination ? Math.ceil(data._pagination.total_count / data._pagination.per_page) : 1;

        // Клиентская сортировка, если сортировка по цене
        if (sortOrder.includes('price')) {
            data.goods.sort((a, b) => {
                const priceA = a.discount_price ? a.discount_price : a.actual_price;
                const priceB = b.discount_price ? b.discount_price : b.actual_price;
                return sortOrder.includes('asc') ? priceA - priceB : priceB - priceA;
            });
        }

        return data.goods;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// Функция для отображения продуктов на странице
function displayProducts(products) {
    if (!Array.isArray(products)) {
        console.error('Expected an array of products but got:', products);
        return;
    }

    const productsContainer = document.getElementById('products');
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product';
        productElement.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}">
            <div class="name">${product.name}</div>
            <div class="rating">
                ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}
                <span class="rating-value">(${product.rating.toFixed(1)})</span>
            </div>
            <div class="price">
                ${product.discount_price ? `<span>${product.discount_price} руб.</span><span class="old-price">${product.actual_price} руб.</span>` : `<span>${product.actual_price} руб.</span>`}
            </div>
            <button onclick="addToCart(${product.id})">Добавить в корзину</button>
        `;
        productsContainer.appendChild(productElement);
    });
    console.log(`Displayed ${products.length} products`);
}

// Функция для отображения категорий фильтров
function displayCategories(categories) {
    const categoryFilters = document.getElementById('category-filters');
    categoryFilters.innerHTML = '';
    categories.forEach(category => {
        const label = document.createElement('label');
        const translatedCategory = categoryTranslations[category] || category;
        label.innerHTML = `
            <input type="checkbox" name="category" value="${category}"> ${translatedCategory}
        `;
        categoryFilters.appendChild(label);
    });
}

// Функция для загрузки дополнительных продуктов
async function loadMoreProducts() {
    if (currentPage >= totalPages) {
        console.log('No more products to load');
        document.getElementById('load-more-button').style.display = 'none';
        return;
    }
    currentPage++;
    const products = await fetchProducts(currentPage, 10, sortOrder);
    productsData = productsData.concat(products);
    displayProducts(products);
    updateCategories(products);
}

// Функция для применения фильтров к продуктам
function applyFilters() {
    const form = document.getElementById('filter-form');
    const formData = new FormData(form);
    const filters = {};

    formData.forEach((value, key) => {
        if (key === 'category' || key === 'discount') {
            if (!filters[key]) {
                filters[key] = [];
            }
            filters[key].push(value);
        } else {
            filters[key] = value;
        }
    });

    const filteredProducts = productsData.filter(product => {
        let matches = true;

        // Фильтрация по категории
        if (filters['category'] && !filters['category'].includes(product.main_category)) {
            matches = false;
        }

        // Фильтрация по цене
        const price = product.discount_price ? product.discount_price : product.actual_price;
        if (filters['min-price'] && price < parseFloat(filters['min-price'])) {
            matches = false;
        }

        if (filters['max-price'] && price > parseFloat(filters['max-price'])) {
            matches = false;
        }

        // Фильтрация по наличию скидки
        if (filters['discount'] && !product.discount_price) {
            matches = false;
        }

        return matches;
    });

    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';
    displayProducts(filteredProducts);
}

// Функция для сортировки продуктов
function sortProducts() {
    const sortSelect = document.getElementById('sort-select');
    sortOrder = sortSelect.value.replace('-', '_'); // Преобразуем значение для API
    currentPage = 1; // Сброс текущей страницы при изменении сортировки
    loadProducts();
}

// Функция для загрузки продуктов и отображения их на странице
async function loadProducts() {
    productsData = [];
    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';
    const initialProducts = await fetchProducts(currentPage, 10, sortOrder);
    if (Array.isArray(initialProducts)) {
        productsData = initialProducts;
        displayProducts(productsData);
        updateCategories(productsData);
    } else {
        console.error('Initial products data is not an array:', initialProducts);
    }
}

// Функция для обновления списка категорий
function updateCategories(products) {
    products.forEach(product => {
        categories.add(product.main_category);
    });
    displayCategories([...categories]);
}

// Функция для добавления товара в корзину
function addToCart(productId) {
    const product = productsData.find(p => p.id === productId);
    if (product) {
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        cartItems.push(product);
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        showNotification(`Товар "${product.name}" добавлен в корзину.`);
    }
}

// Функция для отображения уведомления
function showNotification(message) {
    const notifications = document.getElementById('notifications');
    notifications.innerHTML = `
        <div class="notification">
            ${message}
            <button class="close-button" onclick="closeNotification()">×</button>
        </div>
    `;
    notifications.style.display = 'block';
}

// Функция для закрытия уведомления
function closeNotification() {
    const notifications = document.getElementById('notifications');
    notifications.style.display = 'none';
}
// Функция для инициализации приложения
async function init() {
    const initialProducts = await fetchProducts(currentPage, 10, sortOrder);
    if (Array.isArray(initialProducts)) {
        productsData = initialProducts;
        displayProducts(productsData);
        updateCategories(productsData);
    } else {
        console.error('Initial products data is not an array:', initialProducts);
    }
}

init();