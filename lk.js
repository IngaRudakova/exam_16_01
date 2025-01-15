const apiUrl = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api';
const apiKey = '65f931a2-29e2-4ca0-b490-5a19bb332145';
let orders = [];
let products = [];

// Функция для загрузки продуктов с API
async function fetchProducts() {
    let allProducts = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
        try {
            const response = await fetch(`${apiUrl}/goods?page=${page}&api_key=${apiKey}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            const currentPageProducts = data.goods || [];
            if (currentPageProducts.length === 0) {
                hasMorePages = false;
            } else {
                allProducts = allProducts.concat(currentPageProducts);
                page++;
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            hasMorePages = false;
        }
    }

    console.log('Fetched products:', allProducts); // Логирование полученных данных
    return allProducts;
}

// Функция для загрузки заказов с API
async function fetchOrders() {
    try {
        const response = await fetch(`${apiUrl}/orders?api_key=${apiKey}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Fetched orders:', data); // Логирование полученных данных
        return data;
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

// Функция для получения информации о конкретном заказе по его ID
async function fetchOrderById(orderId) {
    try {
        const response = await fetch(`${apiUrl}/orders/${orderId}?api_key=${apiKey}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Fetched order by ID:', data); // Логирование полученных данных
        return data;
    } catch (error) {
        console.error('Error fetching order by ID:', error);
        return null;
    }
}

// Функция для получения названия продукта по его ID
function getProductName(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        console.error(`Product with ID ${productId} not found`);
    }
    return product ? product.name : 'Нет данных';
}

// Функция для получения цены продукта по его ID
function getProductPrice(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        console.error(`Product with ID ${productId} not found`);
    }
    return product ? (product.discount_price ? product.discount_price : product.actual_price) : 0;
}

// Функция для расчета общей суммы заказа
function calculateTotalAmount(goodIds) {
    return goodIds.reduce((total, goodId) => {
        return total + getProductPrice(goodId);
    }, 0);
}

// Функция для форматирования даты и времени
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Функция для форматирования даты
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// Функция для отображения заказов в таблице
function displayOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';

    orders.forEach((order, index) => {
        const goodIds = order.good_ids || [];
        const formattedDateTime = formatDateTime(order.created_at);
        const deliveryDate = formatDate(order.delivery_date);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formattedDateTime}</td>
            <td>${goodIds.map((goodId, idx) => `${idx + 1}. ${getProductName(goodId)}`).join('<br>')}</td>
            <td>${calculateTotalAmount(goodIds)} руб.</td>
            <td>
                <div class="delivery-date">${deliveryDate}</div>
                <div class="delivery-interval">${order.delivery_interval}</div>
            </td>
            <td class="order-actions">
                <button onclick="viewOrder(${order.id})" title="Просмотр"><i class="fas fa-eye"></i></button>
                <button onclick="editOrder(${order.id})" title="Редактировать"><i class="fas fa-edit"></i></button>
                <button onclick="deleteOrder(${order.id})" title="Удалить"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        ordersList.appendChild(row);
    });
}

// Функция для отображения деталей заказа в модальном окне
function viewOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const goodIds = order.good_ids || [];
    const viewModalContent = document.getElementById('viewModalContent');
    const formattedDateTime = formatDateTime(order.created_at);
    const deliveryDate = formatDate(order.delivery_date);
    const totalAmount = calculateTotalAmount(goodIds);

    viewModalContent.innerHTML = `
        <div class="order-details-row">
            <label>Дата оформления</label>
            <div>${formattedDateTime}</div>
        </div>
        <hr>
        <div class="user-info">
            <div class="order-details-row">
                <label>Имя получателя</label>
                <div>${order.full_name}</div>
            </div>
            <div class="order-details-row">
                <label>Адрес доставки</label>
                <div>${order.delivery_address}</div>
            </div>
            <div class="order-details-row">
                <label>Дата доставки</label>
                <div>${deliveryDate}</div>
            </div>
            <div class="order-details-row">
                <label>Время доставки</label>
                <div>${order.delivery_interval}</div>
            </div>
            <div class="order-details-row">
                <label>Телефон</label>
                <div>${order.phone}</div>
            </div>
            <div class="order-details-row">
                <label>Email</label>
                <div>${order.email}</div>
            </div>
        </div>
        <hr>
        <div class="order-details-row">
            <label>Комментарии</label>
            <div>${order.comment || 'Нет комментариев'}</div>
        </div>
        <hr>
        <div class="order-composition">
            <h3>Состав заказа:</h3>
                ${goodIds.map((goodId, index) => `
                <div class="order-composition-item">
                    ${index + 1}. ${getProductName(goodId)}
                </div>
            `).join('')}
        </div>
        <hr>
        <div class="total-amount">
            <label>Стоимость</label>
            <div>${totalAmount} руб.</div>
        </div>
    `;

    document.getElementById('viewModal').style.display = 'flex';
}

// Функция для сохранения изменений заказа
document.getElementById('editOrderForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const orderId = event.target.dataset.orderId;
    const formData = new FormData(event.target);
    const orderData = {};

    formData.forEach((value, key) => {
        if (value !== '') {
            orderData[key] = value;
        }
    });

    console.log('Updating order with ID:', orderId);
    console.log('Order data:', orderData);

    try {
        const response = await fetch(`${apiUrl}/orders/${orderId}?api_key=${apiKey}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const updatedOrder = await response.json();
        console.log('Updated order:', updatedOrder);

        // Повторно запрашиваем информацию о заказе
        const refreshedOrder = await fetchOrderById(orderId);
        if (refreshedOrder) {
            orders = orders.map(o => o.id === orderId ? refreshedOrder : o);
            console.log('Updated orders array:', orders);
            displayOrders(orders); // Обновляем отображение заказов сразу после сохранения
            showNotification('Заказ успешно обновлен!', 'success');
        } else {
            showNotification('Ошибка при обновлении заказа', 'error');
        }
    } catch (error) {
        console.error('Error updating order:', error);
        showNotification('Ошибка при обновлении заказа', 'error');
    }
    closeModal('editModal');
});

// Функция для редактирования заказа в модальном окне
function editOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const goodIds = order.good_ids || [];
    const editOrderForm = document.getElementById('editOrderForm');
    const formattedDateTime = formatDateTime(order.created_at);
    const totalAmount = calculateTotalAmount(goodIds);

    editOrderForm.dataset.orderId = orderId;
    document.getElementById('editName').value = order.full_name;
    document.getElementById('editAddress').value = order.delivery_address;
    document.getElementById('delivery_date').value = order.delivery_date;
    document.getElementById('editDeliveryInterval').value = order.delivery_interval;
    document.getElementById('editPhone').value = order.phone;
    document.getElementById('editEmail').value = order.email;
    document.getElementById('editComments').value = order.comment || '';

    const editOrderComposition = document.getElementById('editOrderComposition');
    editOrderComposition.innerHTML = `
        <div class="order-details-row">
            <label>Дата оформления</label>
            <div>${formattedDateTime}</div>
        </div>
        <hr>
        <h3>Состав заказа:</h3>
        ${goodIds.map(goodId => `
            <div class="order-composition-item">
                ${getProductName(goodId)}
            </div>
        `).join('')}
        <hr>
        <div class="total-amount">
            <label>Стоимость</label>
            <div>${totalAmount} руб.</div>
        </div>
    `;

    document.getElementById('editModal').style.display = 'flex';
}

// Функция для удаления заказа
function deleteOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    document.getElementById('deleteModal').style.display = 'flex';
    document.getElementById('deleteModalConfirm').onclick = async () => {
        try {
            const response = await fetch(`${apiUrl}/orders/${orderId}?api_key=${apiKey}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            orders = orders.filter(o => o.id !== orderId);
            console.log('Updated orders array after deletion:', orders);

            displayOrders(orders); // Обновляем отображение заказов сразу после удаления
            showNotification('Заказ успешно удален!', 'success');
        } catch (error) {
            console.error('Error deleting order:', error);
            showNotification('Ошибка при удалении заказа', 'error');
        }
        closeModal('deleteModal');
    };
}

// Функция для отображения уведомления
function showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');
    notifications.className = `notifications ${type}`;
    notifications.innerHTML = `
        <div class="notification">
            ${message}
            <button class="close-button" onclick="closeNotification()">×</button>
        </div>
    `;
    notifications.style.display = 'block';
    setTimeout(() => {
        closeNotification();
    }, 3000);
}

// Функция для закрытия уведомления
function closeNotification() {
    const notifications = document.getElementById('notifications');
    notifications.style.display = 'none';
}

// Функция для закрытия модального окна
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Обработчики для закрытия модальных окон
document.querySelectorAll('.close, .modal button').forEach(button => {
    button.onclick = function() {
        closeModal(button.closest('.modal').id);
    };
});

// Функция для инициализации приложения
async function init() {
    try {
        // Параллельная загрузка продуктов и заказов
        const [fetchedProducts, fetchedOrders] = await Promise.all([fetchProducts(), fetchOrders()]);
        products = fetchedProducts;
        orders = fetchedOrders;
        console.log('Loaded products:', products); // Логирование загруженных продуктов
        console.log('Loaded orders:', orders); // Логирование загруженных заказов

        // Проверка, что все продукты из заказов присутствуют в массиве products
        orders.forEach(order => {
            order.good_ids.forEach(goodId => {
                if (!products.find(p => p.id === goodId)) {
                    console.error(`Product with ID ${goodId} not found in products array`);
                }
            });
        });

        displayOrders(orders); // Отображаем заказы
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Инициализация приложения
init();

//доделать:
// понять почему только после перезагрузки показаны изменения
// стили адаптивности ( + поправить для первой страницы)
// добавить удаление товара

// исправить фильтрацию 
