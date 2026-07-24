import { ShoppingCart } from "lucide-react";

interface OrderItem {
  id: string;
  skuSnapshot: string;
  quantity: number;
  priceAtPurchase: string;
  variant?: {
    product?: {
      name: string;
    };
  };
}

interface Order {
  id: string;
  shippingName: string | null;
  guestEmail: string | null;
  user?: {
    email: string;
    name: string;
  } | null;
  paymentStatus: string;
  fulfillmentStatus: string;
  finalPayableAmount: string;
  createdAt: string;
  items: OrderItem[];
}

export function RecentActivityCard({ orders }: { orders: Order[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div>
        <h3 className="text-sm font-bold text-gray-800">
          Recent Customer Activity
        </h3>
        <p className="text-[11px] text-gray-500">
          Most recent actions across the shop
        </p>
      </div>

      <div className="space-y-3.5">
        {orders.slice(0, 5).map((order) => (
          <div key={order.id} className="flex gap-3 text-xs leading-normal">
            <div className="size-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-800">
              <ShoppingCart className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-800 font-medium truncate">
                Order{" "}
                <span className="font-mono text-[11px] font-bold text-gray-900">
                  #{order.id.slice(-6)}
                </span>{" "}
                created
              </p>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                by {order.shippingName || "Guest"} &middot; ₹
                {parseFloat(order.finalPayableAmount).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <p className="text-gray-400 text-xs text-center py-6">
            No recent storefront activity recorded.
          </p>
        )}
      </div>
    </div>
  );
}
