import { useState } from "react";
import { usePaystackPayment } from "react-paystack";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const Payment = () => {
  // Example state for transaction details
  const [email] = useState("user@example.com");
  const [amount] = useState(5000); // Amount in Kobo for Paystack (5000 kobo = 50 NGN)
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // --- Paystack Configuration ---
  const paystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: email,
    amount: amount, 
    publicKey: "pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // TODO: Replace with your actual Live Public Key from Paystack
  };

  // Initialize Paystack hook
  const initializePaystack = usePaystackPayment(paystackConfig);

  const onPaystackSuccess = (reference: any) => {
    // Implementation for whatever you want to do with reference and after success call.
    console.log(reference);
    // TODO: Call your backend API here to verify the transaction and update the user's status to "Pro"
    setPaymentSuccess(true);
  };

  const onPaystackClose = () => {
    console.log("Paystack dialog closed");
  };

  if (paymentSuccess) {
    return (
      <div className="container mx-auto p-8 max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        <p className="text-xl">The Pro version is now active for this session.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {/* Paystack Section */}
      <div className="mb-8 p-6 border rounded-lg shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-4">Pay with Paystack</h2>
        <p className="mb-4 text-gray-600">Secure payment for African cards and bank accounts.</p>
        <button
          className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition-colors w-full font-medium"
          onClick={() => {
            initializePaystack({ onSuccess: onPaystackSuccess, onClose: onPaystackClose });
          }}
        >
          Pay Now (Paystack)
        </button>
      </div>

      {/* PayPal Section */}
      <div className="p-6 border rounded-lg shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-4">Pay with PayPal</h2>
        <p className="mb-4 text-gray-600">International payments via PayPal balance or cards.</p>
        
        {/* PayPal Provider wraps the buttons. Ideally, put this in App.tsx if used globally */}
        <PayPalScriptProvider options={{ "client-id": "YOUR_PAYPAL_LIVE_CLIENT_ID" }}> 
          <PayPalButtons
            style={{ layout: "horizontal" }}
            createOrder={(data, actions) => {
              return actions.order.create({
                intent: "CAPTURE",
                purchase_units: [
                  {
                    amount: {
                      currency_code: "USD",
                      value: "10.00", // Fixed amount for demo
                    },
                  },
                ],
              });
            }}
            onApprove={async (data, actions) => {
              if (actions.order) {
                const details = await actions.order.capture();
                console.log("PayPal Success:", details);
                setPaymentSuccess(true);
              }
            }}
          />
        </PayPalScriptProvider>
      </div>
    </div>
  );
};

export default Payment;