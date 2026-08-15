export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayPaymentFailedResponse {
  error?: {
    description?: string;
  };
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: {
    ondismiss: () => void;
  };
}

export interface RazorpayInstance {
  on: (event: "payment.failed", handler: (response: RazorpayPaymentFailedResponse) => void) => void;
  open: () => void;
}

export type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

export type RazorpayGlobal = Window & {
  Razorpay?: RazorpayConstructor;
};
