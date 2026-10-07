/**
 * Fake Daraja (Safaricom M-Pesa) STK Push. Response and callback shapes mirror
 * the real API, so moving to real Daraja later means replacing this file only.
 */

export type StkCallbackPayload = {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: { Item: { Name: string; Value: string | number }[] };
    };
  };
};

export function normalisePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  return "254" + digits;
}

export const PHONE_REGEX = /^(\+?254|0)[17]\d{8}$/;

const rand = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");

const receiptChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const receipt = () =>
  "S" + Array.from({ length: 9 }, () => receiptChars[Math.floor(Math.random() * receiptChars.length)]).join("");

const stamp = () => new Date().toISOString().replace(/\D/g, "").slice(0, 14); // YYYYMMDDHHmmss

/** Mimics POST /mpesa/stkpush/v1/processrequest */
export function stkPush(_phone: string, _amount: number, accountRef: string) {
  return {
    MerchantRequestID: crypto.randomUUID(),
    CheckoutRequestID: `ws_CO_${stamp()}${rand(6)}`,
    ResponseCode: "0",
    ResponseDescription: "Success. Request accepted for processing",
    CustomerMessage: `Success. Request accepted for processing (${accountRef})`,
  };
}

/** Builds the payload Safaricom would POST to our callback URL. */
export function buildCallback(
  p: { merchantRequestId: string | null; checkoutRequestId: string | null; amount: number; phone: string | null },
  success: boolean,
): StkCallbackPayload {
  const cb: StkCallbackPayload["Body"]["stkCallback"] = {
    MerchantRequestID: p.merchantRequestId ?? "",
    CheckoutRequestID: p.checkoutRequestId ?? "",
    ResultCode: success ? 0 : 1032,
    ResultDesc: success ? "The service request is processed successfully." : "Request cancelled by user",
  };

  if (success) {
    cb.CallbackMetadata = {
      Item: [
        { Name: "Amount", Value: p.amount },
        { Name: "MpesaReceiptNumber", Value: receipt() },
        { Name: "TransactionDate", Value: Number(stamp()) },
        { Name: "PhoneNumber", Value: Number(p.phone ?? 0) },
      ],
    };
  }

  return { Body: { stkCallback: cb } };
}
