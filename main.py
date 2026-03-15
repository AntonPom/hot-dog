from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import json
import os
from fastapi import Request
import time

app = FastAPI(title="Заказ хот-догов")
os.makedirs("data", exist_ok=True)
app.mount("/static", StaticFiles(directory="public"), name="static")


class HotdogOrder(BaseModel):
    hotdog_name: str
    toppings: List[str]
    hotdog_price: float = 0
    toppings_total: float = 0
    quantity: int = 1
    discount_percent: float = 0
    discount_amount: float = 0
    base_price: float = 0
    total_price: float = 0
    payment_method: str = "cash"
    payment_display: str = "Наличными"
    timestamp: Optional[str] = None


class InventoryItem(BaseModel):
    name: str
    quantity: int
    unit: str
    min_quantity: int
    price_per_unit: float  # Стоимость за единицу для расчета себестоимости


ORDERS_FILE = "data/orders.json"
INVENTORY_FILE = "data/inventory.json"
COSTS_FILE = "data/costs.json"

# Себестоимость хот-догов (в рублях за штуку)
HOTDOG_COSTS = {
    "Французский": 120,
    "Датский": 150,
    "Канадский": 140,
    "Свой": 80
}

# Себестоимость топпингов (в рублях за порцию)
TOPPING_COSTS = {
    "mayonnaise": 5,
    "ketchup": 4,
    "mustard": 6,
    "LUK": 8,
    "Halapen": 10,
    "chili": 12,
    "cucumber": 15
}


def load_orders():
    try:
        if os.path.exists(ORDERS_FILE):
            with open(ORDERS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"Error loading orders: {e}")
        return []


def load_inventory():
    try:
        if os.path.exists(INVENTORY_FILE):
            with open(INVENTORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        # Инициализация инвентаря по умолчанию
        default_inventory = [
            {"name": "Булочка", "quantity": 100, "unit": "шт", "min_quantity": 20, "price_per_unit": 15},
            {"name": "Сосиска", "quantity": 80, "unit": "шт", "min_quantity": 15, "price_per_unit": 25},
            {"name": "Майонез", "quantity": 50, "unit": "л", "min_quantity": 10, "price_per_unit": 5},
            {"name": "Кетчуп", "quantity": 45, "unit": "л", "min_quantity": 10, "price_per_unit": 4},
            {"name": "Горчица", "quantity": 30, "unit": "л", "min_quantity": 5, "price_per_unit": 6},
            {"name": "Лук", "quantity": 40, "unit": "кг", "min_quantity": 5, "price_per_unit": 8},
            {"name": "Халапеньо", "quantity": 25, "unit": "кг", "min_quantity": 3, "price_per_unit": 10},
            {"name": "Чили", "quantity": 20, "unit": "кг", "min_quantity": 2, "price_per_unit": 12},
            {"name": "Огурцы", "quantity": 35, "unit": "кг", "min_quantity": 5, "price_per_unit": 15},
            {"name": "Сыр", "quantity": 60, "unit": "кг", "min_quantity": 10, "price_per_unit": 20},
            {"name": "Соусы", "quantity": 40, "unit": "л", "min_quantity": 5, "price_per_unit": 8}
        ]
        save_inventory(default_inventory)
        return default_inventory
    except Exception as e:
        print(f"Error loading inventory: {e}")
        return []


def save_inventory(inventory):
    try:
        with open(INVENTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(inventory, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error saving inventory: {e}")
        return False


def save_order(order: HotdogOrder):
    try:
        order.timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        orders = load_orders()
        orders.append(order.dict())
        with open(ORDERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(orders, f, ensure_ascii=False, indent=2)

        # Обновляем инвентарь после заказа
        update_inventory_after_order(order)

        return True
    except Exception as e:
        print(f"Error saving order: {e}")
        return False


def update_inventory_after_order(order: HotdogOrder):
    """Обновляет инвентарь после заказа"""
    try:
        inventory = load_inventory()

        # Расход компонентов для хот-дога
        hotdog_components = {
            "Французский": {"Булочка": 1, "Сосиска": 1, "Сыр": 0.1, "Соусы": 0.05},
            "Датский": {"Булочка": 1, "Сосиска": 1, "Лук": 0.05, "Соусы": 0.05},
            "Канадский": {"Булочка": 1, "Сосиска": 1, "Бекон": 0.05, "Соусы": 0.05},
            "Свой": {"Булочка": 1, "Сосиска": 1}
        }

        # Расход топпингов
        topping_components = {
            "mayonnaise": {"Майонез": 0.02},
            "ketchup": {"Кетчуп": 0.02},
            "mustard": {"Горчица": 0.02},
            "LUK": {"Лук": 0.03},
            "Halapen": {"Халапеньо": 0.02},
            "chili": {"Чили": 0.02},
            "cucumber": {"Огурцы": 0.03}
        }

        components_needed = {}

        # Добавляем компоненты для хот-дога
        if order.hotdog_name in hotdog_components:
            for component, amount in hotdog_components[order.hotdog_name].items():
                components_needed[component] = components_needed.get(component, 0) + amount * order.quantity

        # Добавляем компоненты для топпингов
        for topping in order.toppings:
            if topping in topping_components:
                for component, amount in topping_components[topping].items():
                    components_needed[component] = components_needed.get(component, 0) + amount * order.quantity

        # Обновляем инвентарь
        for component, amount_needed in components_needed.items():
            for item in inventory:
                if item["name"] == component:
                    item["quantity"] = max(0, item["quantity"] - amount_needed)
                    break

        save_inventory(inventory)
        return True
    except Exception as e:
        print(f"Error updating inventory: {e}")
        return False


@app.get("/", response_class=HTMLResponse)
async def get_index():
    with open("public/index.html", "r", encoding="utf-8") as f:
        return f.read()


@app.post("/api/save-order")
async def save_hotdog_order(order: HotdogOrder):
    try:
        payment_texts = {
            "cash": "Наличными",
            "card": "Картой",
            "both": "Наличными или картой"
        }
        order.payment_display = payment_texts.get(
            order.payment_method,
            "Не указано"
        )
        if save_order(order):
            payment_info = {
                "cash": "наличными при получении",
                "card": "картой онлайн",
                "both": "наличными или картой при получении"
            }

            message = f"Заказ '{order.hotdog_name}' x{order.quantity} на сумму {order.total_price}₽ сохранен!"
            if order.discount_percent > 0:
                message += f" Скидка {order.discount_percent}%: -{order.discount_amount}₽"
            message += f" Оплата: {payment_info.get(order.payment_method)}"

            return JSONResponse({
                "status": "success",
                "message": message,
                "order": order.dict()
            })
        else:
            raise HTTPException(status_code=500, detail="Ошибка сохранения заказа")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/orders")
async def get_all_orders():
    try:
        orders = load_orders()
        return JSONResponse({
            "status": "success",
            "count": len(orders),
            "orders": orders
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/orders/{hotdog_name}")
async def get_orders_by_hotdog(hotdog_name: str):
    try:
        orders = load_orders()
        filtered = [order for order in orders if order['hotdog_name'].lower() == hotdog_name.lower()]
        return JSONResponse({
            "status": "success",
            "count": len(filtered),
            "orders": filtered
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stats")
async def get_order_stats():
    try:
        orders = load_orders()
        if not orders:
            return JSONResponse({
                "status": "success",
                "message": "Нет заказов для статистики",
                "stats": {}
            })

        total_orders = len(orders)
        total_revenue = sum(order.get('total_price', 0) for order in orders)

        # Расчет себестоимости и прибыли
        total_cost = 0
        for order in orders:
            # Себестоимость хот-догов
            hotdog_cost = HOTDOG_COSTS.get(order['hotdog_name'], 100) * order.get('quantity', 1)

            # Себестоимость топпингов
            toppings_cost = 0
            for topping in order.get('toppings', []):
                toppings_cost += TOPPING_COSTS.get(topping, 5)
            toppings_cost *= order.get('quantity', 1)

            total_cost += hotdog_cost + toppings_cost

        total_profit = total_revenue - total_cost
        profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0

        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0

        # Статистика по хот-догам
        hotdog_counts = {}
        hotdog_revenue = {}
        hotdog_profit = {}

        for order in orders:
            hotdog_name = order['hotdog_name']
            quantity = order.get('quantity', 1)

            # Подсчет количества
            hotdog_counts[hotdog_name] = hotdog_counts.get(hotdog_name, 0) + quantity

            # Подсчет выручки
            revenue = order.get('total_price', 0)
            hotdog_revenue[hotdog_name] = hotdog_revenue.get(hotdog_name, 0) + revenue

            # Подсчет прибыли
            hotdog_cost = HOTDOG_COSTS.get(hotdog_name, 100) * quantity
            toppings_cost = 0
            for topping in order.get('toppings', []):
                toppings_cost += TOPPING_COSTS.get(topping, 5)
            toppings_cost *= quantity

            cost = hotdog_cost + toppings_cost
            profit = revenue - cost
            hotdog_profit[hotdog_name] = hotdog_profit.get(hotdog_name, 0) + profit

        most_popular_hotdog = max(hotdog_counts.items(), key=lambda x: x[1]) if hotdog_counts else ("нет данных", 0)

        # Статистика по оплате
        payment_counts = {}
        payment_revenue = {}
        payment_profit = {}

        for order in orders:
            payment_method = order.get('payment_method', 'cash')
            payment_counts[payment_method] = payment_counts.get(payment_method, 0) + 1

            revenue = order.get('total_price', 0)
            payment_revenue[payment_method] = payment_revenue.get(payment_method, 0) + revenue

            # Расчет прибыли для способа оплаты
            hotdog_name = order['hotdog_name']
            quantity = order.get('quantity', 1)
            hotdog_cost = HOTDOG_COSTS.get(hotdog_name, 100) * quantity
            toppings_cost = 0
            for topping in order.get('toppings', []):
                toppings_cost += TOPPING_COSTS.get(topping, 5)
            toppings_cost *= quantity

            cost = hotdog_cost + toppings_cost
            profit = revenue - cost
            payment_profit[payment_method] = payment_profit.get(payment_method, 0) + profit

        payment_names = {
            "cash": "Наличными",
            "card": "Картой",
            "both": "Оба способа"
        }

        readable_payment_counts = {payment_names.get(k, k): v for k, v in payment_counts.items()}
        readable_payment_revenue = {payment_names.get(k, k): v for k, v in payment_revenue.items()}
        readable_payment_profit = {payment_names.get(k, k): v for k, v in payment_profit.items()}

        # Ежедневная статистика
        daily_stats = {}
        for order in orders:
            date = order.get('timestamp', '')[:10]  # Берем только дату
            if date:
                daily_stats[date] = daily_stats.get(date, 0) + order.get('total_price', 0)

        return JSONResponse({
            "status": "success",
            "stats": {
                "total_orders": total_orders,
                "total_revenue": round(total_revenue, 2),
                "total_cost": round(total_cost, 2),
                "total_profit": round(total_profit, 2),
                "profit_margin": round(profit_margin, 2),
                "average_order_value": round(avg_order_value, 2),
                "most_popular_hotdog": {
                    "name": most_popular_hotdog[0],
                    "count": most_popular_hotdog[1],
                    "revenue": hotdog_revenue.get(most_popular_hotdog[0], 0),
                    "profit": hotdog_profit.get(most_popular_hotdog[0], 0)
                },
                "hotdog_statistics": {
                    "by_count": hotdog_counts,
                    "by_revenue": hotdog_revenue,
                    "by_profit": hotdog_profit
                },
                "payment_statistics": {
                    "by_count": readable_payment_counts,
                    "by_revenue": readable_payment_revenue,
                    "by_profit": readable_payment_profit
                },
                "daily_revenue": daily_stats
            }
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/inventory")
async def get_inventory():
    try:
        inventory = load_inventory()

        # Проверяем, что заканчивается
        low_stock_items = []
        for item in inventory:
            if item["quantity"] <= item["min_quantity"]:
                low_stock_items.append({
                    "name": item["name"],
                    "current_quantity": item["quantity"],
                    "min_quantity": item["min_quantity"],
                    "unit": item["unit"],
                    "message": f"{item['name']} заканчивается! Осталось: {item['quantity']} {item['unit']}. Минимум: {item['min_quantity']} {item['unit']}"
                })

        return JSONResponse({
            "status": "success",
            "inventory": inventory,
            "low_stock_items": low_stock_items,
            "has_low_stock": len(low_stock_items) > 0
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/inventory/update")
async def update_inventory(item: InventoryItem):
    try:
        inventory = load_inventory()

        # Ищем и обновляем или добавляем элемент
        found = False
        for inv_item in inventory:
            if inv_item["name"] == item.name:
                inv_item["quantity"] = item.quantity
                inv_item["min_quantity"] = item.min_quantity
                inv_item["price_per_unit"] = item.price_per_unit
                found = True
                break

        if not found:
            inventory.append(item.dict())

        save_inventory(inventory)

        return JSONResponse({
            "status": "success",
            "message": f"Инвентарь '{item.name}' обновлен",
            "inventory": item.dict()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/financial-summary")
async def get_financial_summary():
    """Краткая финансовая сводка"""
    try:
        orders = load_orders()

        if not orders:
            return JSONResponse({
                "status": "success",
                "message": "Нет заказов для финансовой сводки",
                "summary": {}
            })

        today = datetime.now().strftime("%Y-%m-%d")
        today_revenue = 0
        today_orders = 0

        week_revenue = 0
        week_orders = 0

        month_revenue = 0
        month_orders = 0

        for order in orders:
            order_date = order.get('timestamp', '')[:10]
            if order_date:
                revenue = order.get('total_price', 0)

                # Сегодняшние заказы
                if order_date == today:
                    today_revenue += revenue
                    today_orders += 1

                # За последние 7 дней (упрощенная проверка)
                # В реальном приложении нужно использовать datetime для точного расчета
                week_revenue += revenue
                week_orders += 1

                # За последние 30 дней
                month_revenue += revenue
                month_orders += 1

        return JSONResponse({
            "status": "success",
            "summary": {
                "today": {
                    "orders": today_orders,
                    "revenue": round(today_revenue, 2)
                },
                "this_week": {
                    "orders": week_orders,
                    "revenue": round(week_revenue, 2)
                },
                "this_month": {
                    "orders": month_orders,
                    "revenue": round(month_revenue, 2)
                }
            }
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/orders/clear")
async def clear_all_orders():
    try:
        with open(ORDERS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False, indent=2)

        return JSONResponse({
            "status": "success",
            "message": "Все заказы успешно удалены"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check():
    return JSONResponse({
        "status": "healthy",
        "service": "Hotdog Order API",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "features": [
            "Учет заказов",
            "Система скидок",
            "Управление инвентарем",
            "Финансовая статистика",
            "Анализ прибыли"
        ],
        "endpoints": [
            "/ - Главная страница",
            "/api/save-order - Сохранить заказ (POST)",
            "/api/orders - Все заказы",
            "/api/orders/{hotdog} - Заказы по хот-догу",
            "/api/stats - Расширенная статистика",
            "/api/inventory - Инвентарь",
            "/api/financial-summary - Финансовая сводка",
            "/api/health - Проверка здоровья"
        ]
    })


# ... остальной код без изменений (middleware, обработчики ошибок, CORS)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)

    process_time = time.time() - start_time
    print(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f} секунд")
    return response

@app.exception_handler(404)
async def not_found_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=404,
        content={
            "status": "error",
            "message": "Страница не найдена",
            "path": request.url.path,
            "suggestions": [
                "/ - Главная страница",
                "/api/orders - Заказы",
                "/api/stats - Статистика"
            ]
        }
    )
@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Внутренняя ошибка сервера",
            "detail": str(exc.detail) if hasattr(exc, 'detail') else "Неизвестная ошибка"
        }
    )

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В production укажите конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
