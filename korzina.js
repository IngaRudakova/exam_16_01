const apiUrl = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders';
const apiKey = '65f931a2-29e2-4ca0-b490-5a19bb332145';
let cartItems = [];

// Функция для отображения товаров в корзине
function displayCartItems(items) {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';

    if (items.length === 0) {
        cartItemsContainer.innerHTML = '<p>Корзина пустая. Перейдите в <a href="index.html">каталог</a>, чтобы добавить товары.</p>';
        return;
    }

    items.forEach(item => {
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
            <img src="${item.image_url}" alt="${item.name}">
            <div class="name">${item.name}</div>
            <div class="rating">
                ${'★'.repeat(Math.floor(item.rating))}${'☆'.repeat(5 - Math.floor(item.rating))}
                <span class="rating-value">(${item.rating.toFixed(1)})</span>
            </div>
            <div class="price">
                ${item.discount_price ? `<span>${item.discount_price} руб.</span><span class="old-price">${item.actual_price} руб.</span>` : `<span>${item.actual_price} руб.</span>`}
            </div>
            <button class="remove-button" onclick="removeFromCart(${item.id})">Удалить</button>
        `;
        cartItemsContainer.appendChild(cartItemElement);
    });

    updateTotalAmount(items);
}

// Функция для удаления товара из корзины
function removeFromCart(itemId) {
    cartItems = cartItems.filter(item => item.id !== itemId);
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    displayCartItems(cartItems);
}

// Функция для расчета стоимости доставки
function calculateDeliveryCost(deliveryDate, deliveryInterval) {
    const baseDeliveryCost = 200;
    const eveningSurcharge = 200;
    const weekendSurcharge = 100;

    const date = new Date(deliveryDate.split('.').reverse().join('-')); // Переводим дату в формат YYYY-MM-DD
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isEvening = deliveryInterval.includes('18:00-22:00');

    let deliveryCost = baseDeliveryCost;

    if (isEvening) {
        deliveryCost += eveningSurcharge;
    }

    if (isWeekend) {
        deliveryCost += weekendSurcharge;
    }

    return deliveryCost;
}

// Функция для обновления общей суммы заказа и стоимости доставки
function updateTotalAmount(items) {
    const deliveryDate = document.getElementById('delivery_date').value;
    const deliveryInterval = document.getElementById('delivery_interval').value;
    const deliveryCost = calculateDeliveryCost(deliveryDate, deliveryInterval);

    const totalAmount = items.reduce((total, item) => {
        return total + (item.discount_price ? item.discount_price : item.actual_price);
    }, 0) + deliveryCost;

    document.getElementById('total-amount').value = `${totalAmount.toFixed(2)} руб.`;
    document.getElementById('delivery-cost-label').textContent = ` ${deliveryCost.toFixed(2)} руб.`;
}

// Функция для автоматического добавления точек после ввода числа, месяца и года
function formatDateInput(input) {
    let value = input.value.replace(/\D/g, ''); // Удаляем все нецифровые символы
    if (value.length > 2) {
        value = value.slice(0, 2) + '.' + value.slice(2);
    }
    if (value.length > 5) {
        value = value.slice(0, 5) + '.' + value.slice(5, 9);
    }
    input.value = value;
}

// Обработчики событий для динамического обновления стоимости доставки
document.getElementById('delivery_date').addEventListener('input', function(event) {
    formatDateInput(event.target);
    updateTotalAmount(cartItems);
});

document.getElementById('delivery_interval').addEventListener('change', function() {
    updateTotalAmount(cartItems);
});

// Функция для валидации данных заказа
function validateOrder() {
    const full_name = document.getElementById('full_name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const delivery_address = document.getElementById('delivery_address').value;
    const delivery_date = document.getElementById('delivery_date').value;
    const delivery_interval = document.getElementById('delivery_interval').value;

    if (!full_name || !phone || !email || !delivery_address || !delivery_date || !delivery_interval) {
        showNotification('Необходимо заполнить все обязательные поля.');
        return false;
    }

    return true;
}

// Функция для отображения уведомления
function showNotification(message, callback) {
    const notifications = document.getElementById('notifications');
    notifications.innerHTML = `
        <div class="notification">
            ${message}
            <button class="close-button" onclick="closeNotification()">×</button>
        </div>
    `;
    notifications.style.display = 'block';
    if (callback) {
        setTimeout(callback, 3000); // Закрываем уведомление через 3 секунды
    }
}

// Функция для закрытия уведомления
function closeNotification() {
    const notifications = document.getElementById('notifications');
    notifications.style.display = 'none';
}

// Функция для инициализации корзины
function init() {
    cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    displayCartItems(cartItems);
}

// Обработчик отправки формы заказа
document.getElementById('order-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    if (!validateOrder()) {
        return;
    }

    const formData = new FormData(event.target);
    const orderData = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        subscribe: formData.get('subscribe') ? 1 : 0,
        phone: formData.get('phone'),
        delivery_address: formData.get('delivery_address'),
        delivery_date: formData.get('delivery_date'),
        delivery_interval: formData.get('delivery_interval'),
        comment: formData.get('comment'),
        good_ids: cartItems.map(item => item.id)
    };

    try {
        const response = await fetch(`${apiUrl}?api_key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Network response was not ok: ${errorData.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('Order created:', data);
        showNotification('Заказ успешно оформлен!', () => {
            localStorage.removeItem('cartItems'); // Удаляем товары из корзины
            document.getElementById('order-form').reset(); // Сбрасываем форму
            displayCartItems([]); // Обновляем корзину
            window.location.href = 'index.html'; // Переход на страницу каталога
        });
    } catch (error) {
        console.error('Error creating order:', error);
        showNotification(`Ошибка при оформлении заказа: ${error.message}`);
    }
});

init();
