import API from "../../services/http";
import type { Bill, User } from "../../shared/types";

interface JsonServerPage<T> {
  first: number;
  prev: number | null;
  next: number | null;
  last: number;
  pages: number;
  items: number;
  data: T[];
}

export interface BillsPageData {
  customerName: string;
  bills: Bill[];
}

export async function getCustomerBills(): Promise<BillsPageData> {
  // Get the first customer from the sample database.
  const userResponse = await API.get<JsonServerPage<User>>("/users", {
    params: {
      role: "customer",
      _page: 1,
      _per_page: 1,
    },
  });

  const customer = userResponse.data.data[0];

  if (!customer) {
    throw new Error("No customer found in the database.");
  }

  // Fetch all bills belonging to this customer.
  const billsResponse = await API.get<JsonServerPage<Bill>>("/bills", {
    params: {
      ownerId: customer.id,
      _sort: "-issuedAt",
      _page: 1,
      _per_page: 100,
    },
  });

  return {
    customerName: customer.name,
    bills: billsResponse.data.data,
  };
}
