import API from "../../../services/http";
import type { User, Zone } from "../../../shared/types";

interface JsonServerPage<T> {
  pages: number;
  data: T[];
}

async function getAllRecords<T>(endpoint: string): Promise<T[]> {
  const firstResponse = await API.get<JsonServerPage<T>>(endpoint, {
    params: { _page: 1, _per_page: 100 },
  });

  const firstPage = firstResponse.data;
  const records = [...firstPage.data];

  if (firstPage.pages <= 1) {
    return records;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.pages - 1 }, (_, index) =>
      API.get<JsonServerPage<T>>(endpoint, {
        params: {
          _page: index + 2,
          _per_page: 100,
        },
      }),
    ),
  );

  remainingPages.forEach((response) => {
    records.push(...response.data.data);
  });

  return records;
}

export async function getEnterpriseUsers(): Promise<User[]> {
  return getAllRecords<User>("/users");
}

export async function getUserZones(): Promise<Zone[]> {
  return getAllRecords<Zone>("/zones");
}
