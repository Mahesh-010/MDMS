import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "../../../shared/components/PageHeader";
import type { Setting } from "../../../shared/types";
import {
  getEnterpriseSettings,
  saveEnterpriseSetting,
} from "../services/enterpriseOperationsService";
import "./EnterpriseOperations.css";

const settingDescriptions: Record<string, string> = {
  "consumption.unit": "Unit used when displaying electricity consumption.",
  "billing.currency": "Currency used for enterprise billing records.",
  "billing.defaultRatePerKwh": "Default billing rate for each consumed kWh.",
  "enterprise.timezone": "Timezone used for enterprise date and time settings.",
};

const settingLabels: Record<string, string> = {
  "consumption.unit": "Consumption unit",
  "billing.currency": "Billing currency",
  "billing.defaultRatePerKwh": "Default tariff per kWh",
  "enterprise.timezone": "Enterprise timezone",
};

export default function EnterpriseSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSettings = useCallback(() => getEnterpriseSettings(), []);

  const applySettings = useCallback((records: Setting[]) => {
    setSettings(records);

    const nextValues: Record<string, string> = {};
    records.forEach((setting) => {
      nextValues[setting.key] = String(setting.value);
    });
    setValues(nextValues);
  }, []);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      applySettings(await loadSettings());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }, [applySettings, loadSettings]);

  useEffect(() => {
    let active = true;

    void loadSettings()
      .then((records) => {
        if (active) applySettings(records);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load settings.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applySettings, loadSettings]);

  function updateValue(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setSuccess(null);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const changedSettings = settings.filter(
      (setting) => values[setting.key] !== String(setting.value),
    );

    if (changedSettings.length === 0) {
      setSuccess("There are no changes to save.");
      return;
    }

    const invalidTariff = changedSettings.some(
      (setting) =>
        setting.key === "billing.defaultRatePerKwh" &&
        (!Number.isFinite(Number(values[setting.key])) ||
          Number(values[setting.key]) <= 0),
    );

    if (invalidTariff) {
      setError("The default tariff must be a number greater than zero.");
      return;
    }

    setSaving(true);

    try {
      const updated = await Promise.all(
        changedSettings.map((setting) =>
          saveEnterpriseSetting({
            ...setting,
            value:
              typeof setting.value === "number"
                ? Number(values[setting.key])
                : values[setting.key],
          }),
        ),
      );

      setSettings((current) =>
        current.map(
          (setting) =>
            updated.find((item) => item.id === setting.id) ?? setting,
        ),
      );

      setSuccess("Enterprise settings saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save settings.");
      await refreshSettings();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="enterprise-operations">
      <PageHeader
        title="Enterprise Settings"
        subtitle="Manage enterprise-wide billing, consumption and regional configuration."
      />

      {error && (
        <div className="enterprise-message enterprise-message--error">
          {error}
        </div>
      )}

      {success && (
        <div className="enterprise-message enterprise-message--success">
          {success}
        </div>
      )}

      <section className="enterprise-panel">
        <div className="enterprise-panel-heading">
          <div>
            <h2>General configuration</h2>
            <p>Update the configuration shared across the enterprise.</p>
          </div>
        </div>

        {loading ? (
          <div className="enterprise-state">Loading enterprise settings...</div>
        ) : settings.length === 0 ? (
          <div className="enterprise-state">
            <strong>No enterprise settings found</strong>
            <span>
              Check that the seed script has created the enterprise settings.
            </span>
            <button
              className="enterprise-small-button"
              type="button"
              onClick={() => void refreshSettings()}
            >
              Retry
            </button>
          </div>
        ) : (
          <form
            className="enterprise-settings-form"
            onSubmit={(event) => void handleSave(event)}
          >
            {settings.map((setting) => (
              <div className="enterprise-setting-row" key={setting.id}>
                <div>
                  <strong>{settingLabels[setting.key] ?? setting.key}</strong>
                  <small>
                    {settingDescriptions[setting.key] ??
                      "Enterprise configuration value."}
                  </small>
                </div>

                {setting.key === "consumption.unit" ? (
                  <select
                    value={values[setting.key] ?? ""}
                    onChange={(event) =>
                      updateValue(setting.key, event.target.value)
                    }
                  >
                    <option value="kWh">kWh</option>
                  </select>
                ) : setting.key === "billing.currency" ? (
                  <select
                    value={values[setting.key] ?? ""}
                    onChange={(event) =>
                      updateValue(setting.key, event.target.value)
                    }
                  >
                    <option value="INR">INR (Indian Rupee)</option>
                  </select>
                ) : (
                  <input
                    type={
                      setting.key === "billing.defaultRatePerKwh"
                        ? "number"
                        : "text"
                    }
                    min={
                      setting.key === "billing.defaultRatePerKwh"
                        ? "0.01"
                        : undefined
                    }
                    step={
                      setting.key === "billing.defaultRatePerKwh"
                        ? "0.01"
                        : undefined
                    }
                    value={values[setting.key] ?? ""}
                    onChange={(event) =>
                      updateValue(setting.key, event.target.value)
                    }
                  />
                )}
              </div>
            ))}

            <div className="enterprise-form-footer">
              <button
                className="ui-button ui-button--primary"
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="enterprise-panel">
        <div className="enterprise-panel-heading">
          <div>
            <h2>Configuration scope</h2>
            <p>
              These settings apply at enterprise level. Zone-specific alert
              thresholds and individual user preferences are managed separately.
            </p>
          </div>
        </div>
        <span className="enterprise-pill enterprise-pill--info">
          Enterprise scope
        </span>
      </section>
    </div>
  );
}
