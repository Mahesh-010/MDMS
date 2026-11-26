import API from "../../services/http";
import type { Setting, User } from "../../shared/types";

interface JsonServerPage<T> {
  first: number;
  prev: number | null;
  next: number | null;
  last: number;
  pages: number;
  items: number;
  data: T[];
}

export interface CustomerPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  language: string;
}

export interface CustomerSettingsData {
  profile: User;
  preferences: CustomerPreferences;
}

const defaultPreferences: CustomerPreferences = {
  emailNotifications: true,
  smsNotifications: true,
  pushNotifications: true,
  language: "en",
};

function getSettingValue<T extends string | boolean>(
  settings: Setting[],
  key: string,
  fallback: T,
): T {
  const setting = settings.find((item) => item.key === key);
  return (setting?.value as T | undefined) ?? fallback;
}

export async function getCustomerSettings(): Promise<CustomerSettingsData> {
  const userResponse = await API.get<JsonServerPage<User>>("/users", {
    params: {
      role: "customer",
      _page: 1,
      _per_page: 1,
    },
  });

  const profile = userResponse.data.data[0];

  if (!profile) {
    throw new Error("Customer profile could not be found.");
  }

  const settingsResponse = await API.get<JsonServerPage<Setting>>("/settings", {
    params: {
      scope: "user",
      userId: profile.id,
      _page: 1,
      _per_page: 100,
    },
  });

  const settings = settingsResponse.data.data;

  return {
    profile,
    preferences: {
      emailNotifications: getSettingValue(
        settings,
        "notifications.email",
        defaultPreferences.emailNotifications,
      ),
      smsNotifications: getSettingValue(
        settings,
        "notifications.sms",
        defaultPreferences.smsNotifications,
      ),
      pushNotifications: getSettingValue(
        settings,
        "notifications.push",
        defaultPreferences.pushNotifications,
      ),
      language: getSettingValue(
        settings,
        "preferences.language",
        defaultPreferences.language,
      ),
    },
  };
}

export async function updateCustomerProfile(
  userId: string,
  profile: Pick<User, "name" | "email" | "address">,
): Promise<User> {
  const response = await API.patch<User>(
    `/users/${encodeURIComponent(userId)}`,
    profile,
  );

  return response.data;
}

export async function saveCustomerPreferences(
  userId: string,
  preferences: CustomerPreferences,
): Promise<void> {
  const entries: [string, string | boolean][] = [
    ["notifications.email", preferences.emailNotifications],
    ["notifications.sms", preferences.smsNotifications],
    ["notifications.push", preferences.pushNotifications],
    ["preferences.language", preferences.language],
  ];

  const existingResponse = await API.get<JsonServerPage<Setting>>("/settings", {
    params: {
      scope: "user",
      userId,
      _page: 1,
      _per_page: 100,
    },
  });

  const existingSettings = existingResponse.data.data;

  await Promise.all(
    entries.map(async ([key, value]) => {
      const existing = existingSettings.find((setting) => setting.key === key);

      if (existing) {
        await API.patch(`/settings/${encodeURIComponent(existing.id)}`, {
          value,
        });
      } else {
        const id = `setting-user-${userId}-${key.replaceAll(".", "-")}`;

        await API.post("/settings", {
          id,
          key,
          value,
          scope: "user",
          userId,
          zoneId: null,
        });
      }
    }),
  );
}
