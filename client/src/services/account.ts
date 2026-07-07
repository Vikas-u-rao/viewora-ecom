import { API_BASE } from "@/context/AuthContext";

export interface AccountUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  createdAt?: string;
}

export interface Address {
  id: string;
  label?: string | null;
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export type AddressPayload = Omit<Address, "id">;

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.message || "Request failed");
  }
  return data as T;
}

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function updateProfileApi(token: string, payload: { name: string; email: string }) {
  const res = await fetch(`${API_BASE}/users/me`, {
    method: "PATCH",
    headers: authHeaders(token),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return parseJson<{ message: string; user: AccountUser }>(res);
}

export async function fetchAddressesApi(token: string) {
  const res = await fetch(`${API_BASE}/users/me/addresses`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  return parseJson<Address[]>(res);
}

export async function saveAddressApi(token: string, payload: AddressPayload, id?: string) {
  const res = await fetch(`${API_BASE}/users/me/addresses${id ? `/${id}` : ""}`, {
    method: id ? "PUT" : "POST",
    headers: authHeaders(token),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return parseJson<Address>(res);
}

export async function deleteAddressApi(token: string, id: string) {
  const res = await fetch(`${API_BASE}/users/me/addresses/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  return parseJson<{ message: string }>(res);
}
