"use client";

import React, { useEffect, useState } from "react";
import { INDIAN_STATES, STATE_LIST } from "@/constants/indiaLocationData";
import { AddressPayload } from "@/services/account";

interface AddressFormFieldsProps {
  form: AddressPayload;
  onChange: (updated: AddressPayload) => void;
  disabled?: boolean;
  isCompact?: boolean;
}

export default function AddressFormFields({
  form,
  onChange,
  disabled = false,
  isCompact = false,
}: AddressFormFieldsProps) {
  const [customCityMode, setCustomCityMode] = useState(false);

  // Available cities for currently selected state
  const availableCities = form.state && INDIAN_STATES[form.state] ? INDIAN_STATES[form.state] : [];

  // Sync customCityMode if current city is not in the predefined list for the state
  useEffect(() => {
    if (form.city && availableCities.length > 0 && !availableCities.includes(form.city)) {
      setCustomCityMode(true);
    } else if (!form.city) {
      setCustomCityMode(false);
    }
  }, [form.state]);

  const handleStateChange = (selectedState: string) => {
    setCustomCityMode(false);
    onChange({
      ...form,
      state: selectedState,
      city: "", // reset city when state changes
    });
  };

  const handleCitySelectChange = (selectedCity: string) => {
    if (selectedCity === "__custom__") {
      setCustomCityMode(true);
      onChange({ ...form, city: "" });
    } else {
      setCustomCityMode(false);
      onChange({ ...form, city: selectedCity });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    onChange({ ...form, phone: raw });
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 6);
    onChange({ ...form, pincode: raw });
  };

  const inputClasses = `w-full border border-border bg-input px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/60 outline-none focus:border-gold transition-colors ${
    isCompact ? "text-xs px-3 py-2" : ""
  }`;

  const selectClasses = `${inputClasses} cursor-pointer [&>option]:bg-neutral-900 [&>option]:text-white`;

  return (
    <div className="space-y-3">
      {/* Label / Address Type */}
      <div>
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gold/90">
          Address Tag <span className="text-red-500">*</span>
        </label>
        <select
          value={form.label || "Home"}
          disabled={disabled}
          onChange={(e) => onChange({ ...form, label: e.target.value })}
          className={selectClasses}
          required
        >
          <option value="Home">Home</option>
          <option value="Work">Work / Office</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Name */}
      <div>
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gold/90">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          disabled={disabled}
          placeholder="e.g. Rahul Sharma"
          value={form.name || ""}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          className={inputClasses}
        />
      </div>

      {/* Phone Number */}
      <div>
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gold/90">
          Phone Number (10 Digits) <span className="text-red-500">*</span>
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-xs font-mono text-muted-foreground">+91</span>
          <input
            type="tel"
            required
            maxLength={10}
            disabled={disabled}
            placeholder="9876543210"
            value={form.phone || ""}
            onChange={handlePhoneChange}
            className={`${inputClasses} pl-11 font-mono`}
          />
        </div>
        {form.phone && form.phone.length > 0 && form.phone.length < 10 && (
          <p className="mt-1 text-[10px] text-amber-400 font-sans">
            Must be 10 digits ({10 - form.phone.length} remaining)
          </p>
        )}
      </div>

      {/* Address Line 1 */}
      <div>
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gold/90">
          Flat, House No., Building, Street <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          disabled={disabled}
          placeholder="Address Line 1 *"
          value={form.line1 || ""}
          onChange={(e) => onChange({ ...form, line1: e.target.value })}
          className={inputClasses}
        />
      </div>

      {/* Address Line 2 (Optional) */}
      <div>
        <label className="mb-1 block text-[11px] font-medium tracking-wider text-muted-foreground">
          Landmark, Area, Sector <span className="text-[10px] text-muted-foreground/70">(Optional)</span>
        </label>
        <input
          type="text"
          disabled={disabled}
          placeholder="Address Line 2 (Optional)"
          value={form.line2 || ""}
          onChange={(e) => onChange({ ...form, line2: e.target.value })}
          className={inputClasses}
        />
      </div>

      {/* State & City Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* State Selection */}
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gold/90">
            State <span className="text-red-500">*</span>
          </label>
          <select
            required
            disabled={disabled}
            value={form.state || ""}
            onChange={(e) => handleStateChange(e.target.value)}
            className={selectClasses}
          >
            <option value="" disabled>
              -- Select State * --
            </option>
            {STATE_LIST.map((stateName) => (
              <option key={stateName} value={stateName}>
                {stateName}
              </option>
            ))}
          </select>
        </div>

        {/* City Selection / Custom Input */}
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gold/90">
            City / Town <span className="text-red-500">*</span>
          </label>
          {!customCityMode && availableCities.length > 0 ? (
            <select
              required
              disabled={disabled || !form.state}
              value={form.city || ""}
              onChange={(e) => handleCitySelectChange(e.target.value)}
              className={selectClasses}
            >
              <option value="" disabled>
                {form.state ? "-- Select City * --" : "-- Select State First --"}
              </option>
              {availableCities.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
              <option value="__custom__" className="text-gold font-bold">
                + Other / Enter Custom City
              </option>
            </select>
          ) : (
            <div className="space-y-1">
              <input
                type="text"
                required
                disabled={disabled}
                placeholder="Enter City / Town *"
                value={form.city || ""}
                onChange={(e) => onChange({ ...form, city: e.target.value })}
                className={inputClasses}
              />
              {availableCities.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomCityMode(false);
                    onChange({ ...form, city: availableCities[0] });
                  }}
                  className="text-[10px] text-gold hover:underline"
                >
                  ← Choose from list of cities
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pincode */}
      <div>
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gold/90">
          Pincode (6 Digits) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          maxLength={6}
          disabled={disabled}
          placeholder="e.g. 400001"
          value={form.pincode || ""}
          onChange={handlePincodeChange}
          className={`${inputClasses} font-mono`}
        />
        {form.pincode && form.pincode.length > 0 && form.pincode.length < 6 && (
          <p className="mt-1 text-[10px] text-amber-400 font-sans">
            Must be 6 digits ({6 - form.pincode.length} remaining)
          </p>
        )}
      </div>
    </div>
  );
}
