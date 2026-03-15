document.addEventListener('DOMContentLoaded', function() {
    const hotdogPrices = {
        'Французский': 299,
        'Датский': 349,
        'Канадский': 349,
        'Мексиканский': 389,
        'Свой': 199
    };

    const toppingPrices = {
        'mayonnaise': 20,
        'ketchup': 20,
        'mustard': 20,
        'LUK': 15,
        'Halapen': 15,
        'chili': 15,
        'cucumber': 25,
    };

    const discounts = {
        1: 0,
        2: 0,
        3: 5,
        4: 5,
        5: 10,
        6: 10,
        7: 10,
        8: 10,
        9: 10,
        10: 10
    };

    const hotdogBoxes = document.querySelectorAll('.box');
    const toppingCheckboxes = document.querySelectorAll('input[name="topping[]"]');
    const selectedHotdogElement = document.getElementById('selected-hotdog');
    const selectedToppingsElement = document.getElementById('selected-toppings');
    const saveButton = document.getElementById('save-button');
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const selectedPaymentElement = document.getElementById('selected-payment');
    const totalPriceElement = document.getElementById('total-price');
    const viewOrdersBtn = document.getElementById('view-orders-btn');
    const clearButton = document.getElementById('clear-button');
    const statsButton = document.getElementById('stats-button');
    const inventoryBtn = document.getElementById('inventory-btn');
    const financeBtn = document.getElementById('finance-btn');
    const quantityInput = document.getElementById('quantity');
    const decreaseBtn = document.getElementById('decrease-btn');
    const increaseBtn = document.getElementById('increase-btn');
    const discountInfo = document.getElementById('discount-info');
    const bulkDiscountNote = document.getElementById('bulk-discount-note');

    let selectedHotdog = '';
    let selectedHotdogPrice = 0;
    let selectedToppings = [];
    let selectedToppingsTotal = 0;
    let selectedPayment = 'cash';
    let quantity = 1;
    let discountPercent = 0;
    let discountAmount = 0;

    function calculateDiscount() {
        const quantity = parseInt(quantityInput.value);
        discountPercent = discounts[quantity] || 0;

        if (discountPercent > 0) {
            discountInfo.textContent = `Скидка: ${discountPercent}%`;
            discountInfo.classList.add('discount-active');
            bulkDiscountNote.style.display = 'none';
        } else {
            discountInfo.textContent = 'Скидка: 0%';
            discountInfo.classList.remove('discount-active');
            bulkDiscountNote.style.display = 'block';
        }
    }

    function updateOrderSummary() {
        selectedHotdogPrice = selectedHotdog ? hotdogPrices[selectedHotdog] || 0 : 0;
        selectedToppingsTotal = 0;
        selectedToppings = [];

        toppingCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const toppingValue = checkbox.value;
                const toppingPrice = toppingPrices[toppingValue] || 0;
                const toppingName = checkbox.nextElementSibling.textContent
                    .replace(/[🥫🍯🫙🧅🌶️🔥🥒]/g, '')
                    .trim()
                    .split(' (+')[0];

                selectedToppingsTotal += toppingPrice;
                selectedToppings.push(toppingName);
            }
        });

        if (selectedHotdog) {
            selectedHotdogElement.textContent = `Хот-дог: ${selectedHotdog} (${selectedHotdogPrice} ₽)`;
        } else {
            selectedHotdogElement.textContent = 'Хот-дог: не выбран';
        }

        if (selectedToppings.length > 0) {
            selectedToppingsElement.textContent = `Топпинги: ${selectedToppings.join(', ')} (+${selectedToppingsTotal} ₽)`;
        } else {
            selectedToppingsElement.textContent = 'Топпинги: нет';
        }

        updatePaymentDisplay();

        quantity = parseInt(quantityInput.value);
        calculateDiscount();

        const basePrice = (selectedHotdogPrice + selectedToppingsTotal) * quantity;
        discountAmount = (basePrice * discountPercent) / 100;
        const total = basePrice - discountAmount;

        if (discountPercent > 0) {
            totalPriceElement.innerHTML = `
                <span style="text-decoration: line-through; color: #999; font-size: 0.9em;">${basePrice} ₽</span><br>
                <span style="color: #4CAF50; font-weight: bold;">${total.toFixed(2)} ₽</span><br>
                <span style="font-size: 0.8em; color: #FFD700;">Экономия: ${discountAmount.toFixed(2)} ₽</span>
            `;
        } else {
            totalPriceElement.textContent = `${total.toFixed(2)} ₽`;
            totalPriceElement.style.color = total > 0 ? '#d32f2f' : '#666';
            totalPriceElement.style.fontWeight = 'bold';
            totalPriceElement.style.fontSize = '1.2em';
        }
    }

    function updatePaymentDisplay() {
        let paymentText = '';
        switch(selectedPayment) {
            case 'cash':
                paymentText = 'Наличными';
                break;
            case 'card':
                paymentText = 'Картой';
                break;
            case 'both':
                paymentText = 'Наличными или картой';
                break;
        }
        if (selectedPaymentElement) {
            selectedPaymentElement.textContent = paymentText;
        }
    }

    function showNotification(message, type = 'info') {
        const oldNotification = document.querySelector('.notification');
        if (oldNotification) {
            oldNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-weight: bold;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    async function saveOrder() {
        if (!selectedHotdog) {
            showNotification('Пожалуйста, выберите хот-дог!', 'error');
            return;
        }

        const basePrice = (selectedHotdogPrice + selectedToppingsTotal) * quantity;
        discountAmount = (basePrice * discountPercent) / 100;
        const finalPrice = basePrice - discountAmount;

        const orderData = {
            hotdog_name: selectedHotdog,
            hotdog_price: selectedHotdogPrice,
            toppings: selectedToppings,
            toppings_total: selectedToppingsTotal,
            quantity: quantity,
            discount_percent: discountPercent,
            discount_amount: discountAmount,
            base_price: basePrice,
            total_price: finalPrice,
            payment_method: selectedPayment
        };

        try {
            saveButton.disabled = true;
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';

            const response = await fetch('/api/save-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (response.ok) {
                let successMessage = result.message;
                if (discountPercent > 0) {
                    successMessage += `\nСкидка ${discountPercent}%: экономия ${discountAmount.toFixed(2)} ₽`;
                }
                showNotification(successMessage, 'success');

                setTimeout(() => {
                    const clear = confirm('Хотите очистить выбор для нового заказа?');
                    if (clear) {
                        clearOrder();
                    }
                }, 1000);
            } else {
                showNotification('Ошибка: ' + (result.detail || 'Неизвестная ошибка'), 'error');
            }
        } catch (error) {
            showNotification('Ошибка соединения с сервером', 'error');
            console.error('Error:', error);
        } finally {
            saveButton.disabled = false;
            saveButton.innerHTML = '<i class="fas fa-save"></i> Сохранить заказ';
        }
    }

    async function viewOrders() {
        try {
            viewOrdersBtn.disabled = true;
            viewOrdersBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';

            const response = await fetch('/api/orders');
            const result = await response.json();

            if (response.ok) {
                if (result.count > 0) {
                    let ordersText = `📊 Всего заказов: ${result.count}\n\n`;
                    result.orders.forEach((order, index) => {
                        ordersText += `${index + 1}. ${order.hotdog_name}\n`;
                        ordersText += `   Цена хот-дога: ${order.hotdog_price} ₽\n`;
                        ordersText += `   Топпинги: ${order.toppings.join(', ') || 'нет'}\n`;
                        ordersText += `   Стоимость топпингов: ${order.toppings_total} ₽\n`;
                        ordersText += `   Общая стоимость: ${order.total_price} ₽\n`;
                        ordersText += `   Способ оплаты: ${order.payment_display}\n`;
                        ordersText += `   Время: ${order.timestamp}\n\n`;
                    });
                    alert(ordersText);
                } else {
                    alert('📭 Пока нет сохраненных заказов');
                }
            } else {
                showNotification('Ошибка загрузки заказов', 'error');
            }
        } catch (error) {
            showNotification('Ошибка соединения с сервером', 'error');
            console.error('Error loading orders:', error);
        } finally {
            viewOrdersBtn.disabled = false;
            viewOrdersBtn.innerHTML = '<i class="fas fa-list"></i> История заказов';
        }
    }

    function clearOrder() {
        hotdogBoxes.forEach(b => b.classList.remove('selected'));
        toppingCheckboxes.forEach(cb => cb.checked = false);

        if (paymentRadios.length > 0) {
            paymentRadios[0].checked = true;
        }

        selectedHotdog = '';
        selectedHotdogPrice = 0;
        selectedToppings = [];
        selectedToppingsTotal = 0;
        selectedPayment = 'cash';

        updateOrderSummary();
        showNotification('Заказ очищен!', 'success');
    }

    async function clearAllOrders() {
        if (!confirm('Вы уверены, что хотите удалить ВСЕ заказы?\nЭто действие нельзя отменить.')) {
            return;
        }

        try {
            const response = await fetch('/api/orders/clear', {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok) {
                showNotification(result.message, 'success');
            } else {
                showNotification('Ошибка очистки заказов', 'error');
            }
        } catch (error) {
            showNotification('Ошибка соединения с сервером', 'error');
            console.error('Error clearing orders:', error);
        }
    }

    async function showInventory() {
        try {
            const response = await fetch('/api/inventory');
            const result = await response.json();

            if (response.ok) {
                createInventoryModal(result);
            } else {
                showNotification('Ошибка загрузки инвентаря', 'error');
            }
        } catch (error) {
            showNotification('Ошибка соединения с сервером', 'error');
            console.error('Error loading inventory:', error);
        }
    }

    function createInventoryModal(data) {
        const oldModal = document.querySelector('.modal');
        if (oldModal) {
            oldModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal';

        let inventoryHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title"><i class="fas fa-boxes"></i> Управление инвентарем</h2>
                    <button class="modal-close">&times;</button>
                </div>
        `;

        if (data.has_low_stock && data.low_stock_items.length > 0) {
            inventoryHTML += `
                <div class="stock-warning">
                    <h3><i class="fas fa-exclamation-triangle"></i> Внимание! Заканчиваются компоненты:</h3>
                    <ul>
            `;

            data.low_stock_items.forEach(item => {
                inventoryHTML += `<li>${item.message}</li>`;
            });

            inventoryHTML += `
                    </ul>
                </div>
            `;
        }

        inventoryHTML += `
            <table class="inventory-table">
                <thead>
                    <tr>
                        <th>Компонент</th>
                        <th>Количество</th>
                        <th>Ед. изм.</th>
                        <th>Минимум</th>
                        <th>Статус</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.inventory.forEach(item => {
            const isLowStock = item.quantity <= item.min_quantity;
            const isCritical = item.quantity <= item.min_quantity * 0.5;
            const statusClass = isCritical ? 'critical-stock' : (isLowStock ? 'low-stock' : '');
            const statusText = isCritical ? 'КРИТИЧЕСКИ' : (isLowStock ? 'Мало' : 'Норма');

            inventoryHTML += `
                <tr class="${statusClass}">
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit}</td>
                    <td>${item.min_quantity}</td>
                    <td>${statusText}</td>
                </tr>
            `;
        });

        inventoryHTML += `
                </tbody>
            </table>

            <div class="action-buttons" style="margin-top: 20px;">
                <button id="refresh-inventory" class="btn btn-view">
                    <i class="fas fa-sync-alt"></i> Обновить
                </button>
                <button id="print-inventory" class="btn btn-save">
                    <i class="fas fa-print"></i> Печать
                </button>
            </div>
        </div>
        `;

        modal.innerHTML = inventoryHTML;
        document.body.appendChild(modal);

        modal.style.display = 'block';

        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.querySelector('#refresh-inventory').addEventListener('click', showInventory);

        modal.querySelector('#print-inventory').addEventListener('click', () => {
            window.print();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    async function showFinancialSummary() {
        try {
            const [summaryResponse, statsResponse] = await Promise.all([
                fetch('/api/financial-summary'),
                fetch('/api/stats')
            ]);

            const summaryResult = await summaryResponse.json();
            const statsResult = await statsResponse.json();

            if (summaryResponse.ok && statsResponse.ok) {
                createFinanceModal(summaryResult, statsResult);
            } else {
                showNotification('Ошибка загрузки финансовых данных', 'error');
            }
        } catch (error) {
            showNotification('Ошибка соединения с сервером', 'error');
            console.error('Error loading financial data:', error);
        }
    }

    function createFinanceModal(summaryData, statsData) {
        const oldModal = document.querySelector('.modal');
        if (oldModal) {
            oldModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal';

        let financeHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title"><i class="fas fa-chart-line"></i> Финансовая сводка</h2>
                    <button class="modal-close">&times;</button>
                </div>

                <div class="finance-cards">
                    <div class="finance-card today">
                        <h3>Сегодня</h3>
                        <div class="amount">${summaryData.summary.today.revenue} ₽</div>
                        <div class="orders">${summaryData.summary.today.orders} заказов</div>
                    </div>
                    <div class="finance-card week">
                        <h3>Эта неделя</h3>
                        <div class="amount">${summaryData.summary.this_week.revenue} ₽</div>
                        <div class="orders">${summaryData.summary.this_week.orders} заказов</div>
                    </div>
                    <div class="finance-card month">
                        <h3>Этот месяц</h3>
                        <div class="amount">${summaryData.summary.this_month.revenue} ₽</div>
                        <div class="orders">${summaryData.summary.this_month.orders} заказов</div>
                    </div>
                </div>
        `;

        if (statsData.stats) {
            const stats = statsData.stats;

            financeHTML += `
                <div style="margin: 30px 0;">
                    <h3><i class="fas fa-chart-pie"></i> Общая статистика</h3>
                    <table class="finance-table">
                        <tr>
                            <td>Общая выручка:</td>
                            <td class="profit-positive">${stats.total_revenue} ₽</td>
                        </tr>
                        <tr>
                            <td>Себестоимость:</td>
                            <td>${stats.total_cost} ₽</td>
                        </tr>
                        <tr>
                            <td>Прибыль:</td>
                            <td class="${stats.total_profit >= 0 ? 'profit-positive' : 'profit-negative'}">${stats.total_profit} ₽</td>
                        </tr>
                        <tr>
                            <td>Маржа прибыли:</td>
                            <td>${stats.profit_margin}%</td>
                        </tr>
                        <tr>
                            <td>Всего заказов:</td>
                            <td>${stats.total_orders}</td>
                        </tr>
                        <tr>
                            <td>Средний чек:</td>
                            <td>${stats.average_order_value} ₽</td>
                        </tr>
                    </table>
                </div>
            `;
        }

        financeHTML += `
                <div class="action-buttons" style="margin-top: 20px;">
                    <button id="refresh-finance" class="btn btn-view">
                        <i class="fas fa-sync-alt"></i> Обновить
                    </button>
                    <button id="print-finance" class="btn btn-save">
                        <i class="fas fa-print"></i> Печать
                    </button>
                </div>
            </div>
        `;

        modal.innerHTML = financeHTML;
        document.body.appendChild(modal);

        modal.style.display = 'block';

        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.querySelector('#refresh-finance').addEventListener('click', showFinancialSummary);

        modal.querySelector('#print-finance').addEventListener('click', () => {
            window.print();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    async function checkInventory() {
        try {
            const response = await fetch('/api/inventory');
            const result = await response.json();

            if (response.ok && result.has_low_stock && result.low_stock_items.length > 0) {
                if (result.low_stock_items.length > 2) {
                    showNotification('Заканчиваются компоненты! Проверьте инвентарь.', 'error');
                }
            }
        } catch (error) {
            console.error('Error checking inventory:', error);
        }
    }

    hotdogBoxes.forEach(box => {
        box.addEventListener('click', function() {
            hotdogBoxes.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedHotdog = this.querySelector('.hotdog-name').textContent;
            updateOrderSummary();
        });
    });

    toppingCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateOrderSummary);
    });

    paymentRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                selectedPayment = this.value;
                updateOrderSummary();
            }
        });
    });

    decreaseBtn.addEventListener('click', function() {
        let value = parseInt(quantityInput.value);
        if (value > 1) {
            quantityInput.value = value - 1;
            updateOrderSummary();
        }
    });

    increaseBtn.addEventListener('click', function() {
        let value = parseInt(quantityInput.value);
        if (value < 10) {
            quantityInput.value = value + 1;
            updateOrderSummary();
        }
    });

    quantityInput.addEventListener('input', function() {
        let value = parseInt(this.value);
        if (value < 1) this.value = 1;
        if (value > 10) this.value = 10;
        updateOrderSummary();
    });

    saveButton.addEventListener('click', saveOrder);

    if (viewOrdersBtn) {
        viewOrdersBtn.addEventListener('click', viewOrders);
    }

    if (clearButton) {
        clearButton.addEventListener('click', clearOrder);

        let clickCount = 0;
        let clickTimer;

        clearButton.addEventListener('click', function(e) {
            clickCount++;

            if (clickCount === 1) {
                clickTimer = setTimeout(function() {
                    clearOrder();
                    clickCount = 0;
                }, 300);
            } else if (clickCount === 2) {
                clearTimeout(clickTimer);
                clearAllOrders();
                clickCount = 0;
            }
        });
    }

    if (statsButton) {
        statsButton.addEventListener('click', async function() {
            try {
                const response = await fetch('/api/stats');
                const result = await response.json();

                if (response.ok && result.stats) {
                    const stats = result.stats;
                    let statsText = `📈 СТАТИСТИКА ЗАКАЗОВ\n\n`;
                    statsText += `📦 Всего заказов: ${stats.total_orders}\n`;
                    statsText += `💰 Общая выручка: ${stats.total_revenue} ₽\n`;
                    statsText += `📊 Средний чек: ${stats.average_order_value} ₽\n\n`;

                    if (stats.total_cost !== undefined) {
                        statsText += `📉 Себестоимость: ${stats.total_cost} ₽\n`;
                        statsText += `💵 Прибыль: ${stats.total_profit} ₽\n`;
                        statsText += `📈 Маржа прибыли: ${stats.profit_margin}%\n\n`;
                    }

                    statsText += `🏆 Самый популярный хот-дог:\n`;
                    statsText += `   ${stats.most_popular_hotdog.name} - ${stats.most_popular_hotdog.count} заказов\n`;

                    if (stats.most_popular_hotdog.revenue) {
                        statsText += `   Выручка: ${stats.most_popular_hotdog.revenue} ₽\n`;
                    }

                    if (stats.most_popular_hotdog.profit) {
                        statsText += `   Прибыль: ${stats.most_popular_hotdog.profit} ₽\n`;
                    }

                    statsText += `\n💳 Статистика по оплате:\n`;

                    Object.entries(stats.payment_statistics.by_count).forEach(([method, count]) => {
                        statsText += `   ${method}: ${count} заказов\n`;
                    });

                    alert(statsText);
                }
            } catch (error) {
                console.error('Error loading stats:', error);
                showNotification('Ошибка загрузки статистики', 'error');
            }
        });
    }

    if (inventoryBtn) {
        inventoryBtn.addEventListener('click', showInventory);
    }

    if (financeBtn) {
        financeBtn.addEventListener('click', showFinancialSummary);
    }

    updateOrderSummary();
    updatePaymentDisplay();
    calculateDiscount();
    checkInventory();
});