import enum

class TableStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    BROWSING = "BROWSING"
    ORDER_PENDING_PAYMENT = "ORDER_PENDING_PAYMENT"
    PREPARING = "PREPARING"
    READY = "READY"

class OrderStatus(str, enum.Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAID = "PAID"
    PREPARING = "PREPARING"
    READY = "READY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class OrderType(str, enum.Enum):
    DINE_IN = "DINE_IN"
    TAKEAWAY = "TAKEAWAY"

class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    CARD = "CARD"
    NEQUI = "NEQUI"
    DAVIPLATA = "DAVIPLATA"
    TRANSFER = "TRANSFER"
    OTHER = "OTHER"

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    CASHIER = "CASHIER"
    KITCHEN = "KITCHEN"
    STAFF = "STAFF"

# Transiciones válidas
VALID_ORDER_TRANSITIONS = {
    OrderStatus.PENDING_PAYMENT: [OrderStatus.PAID, OrderStatus.CANCELLED],
    OrderStatus.PAID: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    OrderStatus.PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
    OrderStatus.READY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    OrderStatus.DELIVERED: [],
    OrderStatus.CANCELLED: [],
}

TABLE_STATUS_FROM_ORDER = {
    OrderStatus.PENDING_PAYMENT: TableStatus.ORDER_PENDING_PAYMENT,
    OrderStatus.PAID: TableStatus.PREPARING,
    OrderStatus.PREPARING: TableStatus.PREPARING,
    OrderStatus.READY: TableStatus.READY,
}
