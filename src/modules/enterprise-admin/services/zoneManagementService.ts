import API from "../../../services/http";
import type { Zone } from "../../../shared/types";

interface JsonServerPage<T> {
  first: number;
  prev: number | null;
  next: number | null;
  last: number;
  pages: number;
  items: number;
  data: T[];
}

export type CreateZoneInput = Pick<Zone, "id" | "name" | "code" | "status">;

export type UpdateZoneInput = Pick<Zone, "name" | "code" | "status">;

export async function getZones(): Promise<Zone[]> {
  const response = await API.get<JsonServerPage<Zone>>("/zones", {
    params: {
      _sort: "name",
      _page: 1,
      _per_page: 100,
    },
  });

  const firstPage = response.data;

  if (firstPage.pages <= 1) {
    return firstPage.data;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.pages - 1 }, (_, index) =>
      API.get<JsonServerPage<Zone>>("/zones", {
        params: {
          _sort: "name",
          _page: index + 2,
          _per_page: 100,
        },
      }),
    ),
  );

  return [
    ...firstPage.data,
    ...remainingPages.flatMap((page) => page.data.data),
  ];
}

export async function createZone(input: CreateZoneInput): Promise<Zone> {
  const response = await API.post<Zone>("/zones", input);
  return response.data;
}

export async function updateZone(
  zoneId: string,
  input: UpdateZoneInput,
): Promise<Zone> {
  const response = await API.patch<Zone>(
    `/zones/${encodeURIComponent(zoneId)}`,
    input,
  );

  return response.data;
}

export async function updateZoneStatus(zone: Zone): Promise<Zone> {
  return updateZone(zone.id, {
    name: zone.name,
    code: zone.code,
    status: zone.status === "active" ? "inactive" : "active",
  });
}
