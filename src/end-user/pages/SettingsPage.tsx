import { useCallback, useEffect, useState } from "react";
import { Loader } from "../../shared/components/Loader";
import type { FormEvent } from "react";
import { PageHeader } from "../../shared/components/PageHeader";
import type { IndianAddress, User } from "../../shared/types";
import {
  getCustomerSettings,
  saveCustomerPreferences,
  updateCustomerProfile,
} from "../services/settingsService";
import type {
  CustomerPreferences,
  CustomerSettingsData,
} from "../services/settingsService";
import "./SettingsPage.css";

const initialAddress: IndianAddress = {
  street: "",
  city: "",
  state: "Karnataka",
  postalCode: "",
  country: "India",
};

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="settings-toggle">
      <span className="settings-toggle-copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />

      <span className="settings-toggle-track" aria-hidden="true">
        <span />
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const [data, setData] = useState<CustomerSettingsData | null>(null);
  const [profile, setProfile] = useState<
    Pick<User, "name" | "email" | "address">
  >({
    name: "",
    email: "",
    address: initialAddress,
  });

  const [preferences, setPreferences] = useState<CustomerPreferences>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    language: "en",
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getCustomerSettings();

      setData(result);
      setProfile({
        name: result.profile.name,
        email: result.profile.email,
        address: { ...result.profile.address },
      });
      setPreferences(result.preferences);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load account settings.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  function updateAddress(field: keyof IndianAddress, value: string) {
    setProfile((current) => ({
      ...current,
      address: {
        ...current.address,
        [field]: value,
      },
    }));
  }

  function updatePreference<K extends keyof CustomerPreferences>(
    key: K,
    value: CustomerPreferences[K],
  ) {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!data) return;

    setSavingProfile(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateCustomerProfile(data.profile.id, profile);

      setData((current) =>
        current ? { ...current, profile: updated } : current,
      );

      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update your profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePreferencesSave() {
    if (!data) return;

    setSavingPreferences(true);
    setError(null);
    setSuccess(null);

    try {
      await saveCustomerPreferences(data.profile.id, preferences);
      setSuccess("Your preferences have been saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save your preferences.",
      );
    } finally {
      setSavingPreferences(false);
    }
  }

  if (loading) {
    return (
      <div className="settings-loading">
        <Loader label="Loading account settings..." size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="settings-page">
        <PageHeader
          title="Settings"
          subtitle="Manage your account and preferences."
        />

        <div className="settings-message settings-message--error">
          {error ?? "Settings are unavailable."}
          <button
            className="ui-button ui-button--primary"
            type="button"
            onClick={() => void loadSettings()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <PageHeader
        title="Settings"
        subtitle="Manage your customer profile and account preferences."
      />

      {error && (
        <div className="settings-message settings-message--error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div
          className="settings-message settings-message--success"
          role="status"
        >
          {success}
        </div>
      )}

      <section className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-heading-icon">♙</div>
          <div>
            <h2>Personal Information</h2>
            <p>Manage your registered customer details.</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave}>
          <div className="settings-form-grid">
            <label className="settings-field">
              <span>Full Name</span>
              <input
                required
                maxLength={100}
                value={profile.name}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>

            <label className="settings-field">
              <span>Email Address</span>
              <input
                required
                type="email"
                maxLength={150}
                value={profile.email}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </label>

            <label className="settings-field settings-field--full">
              <span>Street Address</span>
              <input
                required
                maxLength={200}
                value={profile.address.street}
                onChange={(event) =>
                  updateAddress("street", event.target.value)
                }
              />
            </label>

            <label className="settings-field">
              <span>City</span>
              <input
                required
                maxLength={80}
                value={profile.address.city}
                onChange={(event) => updateAddress("city", event.target.value)}
              />
            </label>

            <label className="settings-field">
              <span>State</span>
              <input
                required
                maxLength={80}
                value={profile.address.state}
                onChange={(event) => updateAddress("state", event.target.value)}
              />
            </label>

            <label className="settings-field">
              <span>Postal Code</span>
              <input
                required
                pattern="[0-9]{6}"
                maxLength={6}
                inputMode="numeric"
                value={profile.address.postalCode}
                onChange={(event) =>
                  updateAddress(
                    "postalCode",
                    event.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
              />
            </label>

            <label className="settings-field">
              <span>Country</span>
              <input value="India" disabled />
            </label>
          </div>

          <div className="settings-form-footer">
            <span>Customer ID: {data.profile.id}</span>

            <button
              className="ui-button ui-button--primary"
              type="submit"
              disabled={savingProfile}
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </section>

      <section className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-heading-icon">♧</div>
          <div>
            <h2>Notification Preferences</h2>
            <p>Choose how you receive account updates.</p>
          </div>
        </div>

        <div className="settings-toggle-list">
          <Toggle
            label="Email Notifications"
            description="Receive bill updates and payment reminders by email."
            checked={preferences.emailNotifications}
            onChange={(value) => updatePreference("emailNotifications", value)}
          />

          <Toggle
            label="SMS Notifications"
            description="Receive important account alerts through SMS."
            checked={preferences.smsNotifications}
            onChange={(value) => updatePreference("smsNotifications", value)}
          />

          <Toggle
            label="Push Notifications"
            description="Receive notifications about your electricity service."
            checked={preferences.pushNotifications}
            onChange={(value) => updatePreference("pushNotifications", value)}
          />
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-heading-icon">文</div>
          <div>
            <h2>Language Preferences</h2>
            <p>Select your preferred display language.</p>
          </div>
        </div>

        <label className="settings-field settings-language-field">
          <span>Display Language</span>

          <select
            value={preferences.language}
            onChange={(event) =>
              updatePreference("language", event.target.value)
            }
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="kn">Kannada</option>
          </select>
        </label>

        <div className="settings-form-footer">
          <span>Preferences are saved to your customer account.</span>

          <button
            className="ui-button ui-button--primary"
            type="button"
            disabled={savingPreferences}
            onClick={() => void handlePreferencesSave()}
          >
            {savingPreferences ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </section>

      <section className="settings-card settings-account-card">
        <div>
          <h2>Account Information</h2>
          <p>Additional details associated with your MDMS account.</p>
        </div>

        <div className="settings-account-details">
          <div>
            <span>Account Role</span>
            <strong>End-user / Customer</strong>
          </div>

          <div>
            <span>Zone ID</span>
            <strong>{data.profile.zoneId ?? "Not assigned"}</strong>
          </div>

          <div>
            <span>Account Status</span>
            <strong>{data.profile.status}</strong>
          </div>
        </div>
      </section>

      <p className="settings-note">
        Password changes and account deletion are not enabled in this Phase 1
        customer settings module.
      </p>
    </div>
  );
}
