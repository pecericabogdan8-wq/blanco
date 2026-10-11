import type {
  ReturnReason,
  ReturnRequestStatus,
} from "@prisma/client";

type ReturnRow = {
  id: string;
  orderId: string;
  userId: string | null;
  email: string;
  phone: string | null;
  reason: ReturnReason;
  message: string;
  adminNote: string | null;
  status: ReturnRequestStatus;
  restoreStock: boolean;
  refundWanted: boolean;
  createdAt: Date;
  updatedAt: Date;
  order?: {
    id: string;
    status: string;
    total: number;
    customerName: string;
    customerEmail: string;
    createdAt: Date;
  };
};

export function mapReturnRequest(r: ReturnRow) {
  return {
    id: r.id,
    orderId: r.orderId,
    userId: r.userId ?? undefined,
    email: r.email,
    phone: r.phone ?? undefined,
    reason: r.reason,
    message: r.message,
    adminNote: r.adminNote ?? undefined,
    status: r.status,
    restoreStock: r.restoreStock,
    refundWanted: r.refundWanted,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    order: r.order
      ? {
          id: r.order.id,
          status: r.order.status,
          total: r.order.total,
          customerName: r.order.customerName,
          customerEmail: r.order.customerEmail,
          createdAt: r.order.createdAt.toISOString(),
        }
      : undefined,
  };
}

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  defective: "Брак / дефект",
  quality_dislike: "Не підійшла якість / смак",
  wrong_size: "Не той розмір",
  other: "Інше",
};

export const RETURN_STATUS_LABELS: Record<ReturnRequestStatus, string> = {
  requested: "Запит надіслано",
  approved: "Схвалено",
  rejected: "Відхилено",
  awaiting_parcel: "Чекаємо посилку",
  received: "Отримано на склад",
  refunded: "Кошти повернено",
  exchanged: "Обмінено",
  closed: "Закрито",
};
