"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ArrowUpDown, Filter, RotateCcw } from "lucide-react";

interface FilterSidebarProps {
  sortBy: string;
  setSortBy: (val: string) => void;
  tryIn3D: boolean;
  setTryIn3D: (val: boolean) => void;
  selectedPriceRange: string;
  setSelectedPriceRange: (val: string) => void;
  selectedGender: string;
  setSelectedGender: (val: string) => void;
  selectedShape: string;
  setSelectedShape: (val: string) => void;
  selectedFrameSize: string;
  setSelectedFrameSize: (val: string) => void;
  selectedBrand: string;
  setSelectedBrand: (val: string) => void;
  selectedFrameColor: string;
  setSelectedFrameColor: (val: string) => void;
  selectedFrameType: string;
  setSelectedFrameType: (val: string) => void;
  selectedMaterial: string;
  setSelectedMaterial: (val: string) => void;
  availableBrands: string[];
  onApplyFilters: () => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export function FilterSidebar({
  sortBy,
  setSortBy,
  tryIn3D,
  setTryIn3D,
  selectedPriceRange,
  setSelectedPriceRange,
  selectedGender,
  setSelectedGender,
  selectedShape,
  setSelectedShape,
  selectedFrameSize,
  setSelectedFrameSize,
  selectedBrand,
  setSelectedBrand,
  selectedFrameColor,
  setSelectedFrameColor,
  selectedFrameType,
  setSelectedFrameType,
  selectedMaterial,
  setSelectedMaterial,
  availableBrands,
  onApplyFilters,
  onClearAll,
  hasActiveFilters,
}: FilterSidebarProps) {
  // Track open accordion sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    price: true,
    gender: true,
    shape: true,
    size: false,
    brand: true,
    color: false,
    type: false,
    material: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full bg-white text-gray-900 border border-gray-200 rounded-2xl p-5 shadow-sm space-y-5 font-sans">
      {/* Top Header: Sort By Dropdown */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
          <ArrowUpDown className="size-4 text-gray-700" />
          <span>Sort By</span>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
        >
          <option value="newest">Recommended</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
        </select>
      </div>

      {/* Try in 3D Switch */}
      <div className="flex items-center justify-between py-1">
        <span className="font-bold text-gray-900 text-sm">Try in 3D</span>
        <button
          type="button"
          onClick={() => setTryIn3D(!tryIn3D)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            tryIn3D ? "bg-amber-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              tryIn3D ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Filters Title Header */}
      <div className="flex items-center justify-between pt-2 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2 font-bold text-gray-900 text-base">
          <Filter className="size-4 text-amber-700" />
          <span>Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-semibold cursor-pointer"
          >
            <RotateCcw className="size-3" /> Clear All
          </button>
        )}
      </div>

      {/* Accordion Sections List */}
      <div className="divide-y divide-gray-100">
        {/* 1. Price Accordion */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("price")}
            className="w-full flex items-center justify-between font-bold text-gray-900 text-sm hover:text-amber-800 text-left cursor-pointer"
          >
            <span>Price</span>
            {openSections.price ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {openSections.price && (
            <div className="mt-3 space-y-2 pl-1">
              {[
                { label: "All Prices", value: "all" },
                { label: "Under ₹2,000", value: "under-2000" },
                { label: "₹2,000 - ₹5,000", value: "2000-5000" },
                { label: "₹5,000 - ₹10,000", value: "5000-10000" },
                { label: "₹10,000+", value: "above-10000" },
              ].map((p) => (
                <label key={p.value} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                  <input
                    type="radio"
                    name="price"
                    checked={selectedPriceRange === p.value}
                    onChange={() => setSelectedPriceRange(p.value)}
                    className="accent-amber-600"
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 2. Gender Accordion */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("gender")}
            className="w-full flex items-center justify-between font-bold text-gray-900 text-sm hover:text-amber-800 text-left cursor-pointer"
          >
            <span>Gender</span>
            {openSections.gender ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {openSections.gender && (
            <div className="mt-3 space-y-2 pl-1">
              {[
                { label: "All Genders", value: "all" },
                { label: "Men", value: "men" },
                { label: "Women", value: "women" },
                { label: "Unisex", value: "unisex" },
              ].map((g) => (
                <label key={g.value} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                  <input
                    type="radio"
                    name="gender"
                    checked={selectedGender === g.value}
                    onChange={() => setSelectedGender(g.value)}
                    className="accent-amber-600"
                  />
                  <span>{g.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 3. Shape & Style Accordion */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("shape")}
            className="w-full flex items-center justify-between font-bold text-gray-900 text-sm hover:text-amber-800 text-left cursor-pointer"
          >
            <span>Shape & Style</span>
            {openSections.shape ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {openSections.shape && (
            <div className="mt-3 space-y-2 pl-1">
              {[
                { label: "All Shapes", value: "all" },
                { label: "Wayfarer", value: "wayfarer" },
                { label: "Aviator", value: "aviator" },
                { label: "Cat Eye", value: "cat-eye" },
                { label: "Round", value: "round" },
                { label: "Rectangle", value: "rectangle" },
                { label: "Square", value: "square" },
                { label: "Geometric", value: "geometric" },
                { label: "Oversized", value: "oversized" },
              ].map((s) => (
                <label key={s.value} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                  <input
                    type="radio"
                    name="shape"
                    checked={selectedShape === s.value}
                    onChange={() => setSelectedShape(s.value)}
                    className="accent-amber-600"
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 4. Frame Size Accordion */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("size")}
            className="w-full flex items-center justify-between font-bold text-gray-900 text-sm hover:text-amber-800 text-left cursor-pointer"
          >
            <span>Frame Size</span>
            {openSections.size ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {openSections.size && (
            <div className="mt-3 space-y-2 pl-1">
              {[
                { label: "All Sizes", value: "all" },
                { label: "Small", value: "small" },
                { label: "Medium", value: "medium" },
                { label: "Large", value: "large" },
                { label: "Wide Fit", value: "wide" },
              ].map((sz) => (
                <label key={sz.value} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                  <input
                    type="radio"
                    name="frameSize"
                    checked={selectedFrameSize === sz.value}
                    onChange={() => setSelectedFrameSize(sz.value)}
                    className="accent-amber-600"
                  />
                  <span>{sz.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 5. Brand Accordion */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("brand")}
            className="w-full flex items-center justify-between font-bold text-gray-900 text-sm hover:text-amber-800 text-left cursor-pointer"
          >
            <span>Brand</span>
            {openSections.brand ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {openSections.brand && (
            <div className="mt-3 space-y-2 pl-1 max-h-48 overflow-y-auto pr-1">
              <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                <input
                  type="radio"
                  name="brand"
                  checked={selectedBrand === "all"}
                  onChange={() => setSelectedBrand("all")}
                  className="accent-amber-600"
                />
                <span>All Brands</span>
              </label>
              {availableBrands.map((brandName) => {
                const bVal = brandName.toLowerCase().replace(/ /g, "-");
                return (
                  <label key={brandName} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                    <input
                      type="radio"
                      name="brand"
                      checked={selectedBrand === bVal}
                      onChange={() => setSelectedBrand(bVal)}
                      className="accent-amber-600"
                    />
                    <span>{brandName}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 6. Frame Color Accordion */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("color")}
            className="w-full flex items-center justify-between font-bold text-gray-900 text-sm hover:text-amber-800 text-left cursor-pointer"
          >
            <span>Frame Color</span>
            {openSections.color ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {openSections.color && (
            <div className="mt-3 space-y-2 pl-1">
              {[
                { label: "All Colors", value: "all" },
                { label: "Black", value: "black" },
                { label: "Gold", value: "gold" },
                { label: "Silver", value: "silver" },
                { label: "Tortoise", value: "tortoise" },
                { label: "Transparent / Crystal", value: "transparent" },
                { label: "Rose Gold", value: "rose-gold" },
                { label: "Blue", value: "blue" },
              ].map((c) => (
                <label key={c.value} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                  <input
                    type="radio"
                    name="color"
                    checked={selectedFrameColor === c.value}
                    onChange={() => setSelectedFrameColor(c.value)}
                    className="accent-amber-600"
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 7. Frame Type Accordion */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("type")}
            className="w-full flex items-center justify-between font-bold text-gray-900 text-sm hover:text-amber-800 text-left cursor-pointer"
          >
            <span>Frame Type</span>
            {openSections.type ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {openSections.type && (
            <div className="mt-3 space-y-2 pl-1">
              {[
                { label: "All Types", value: "all" },
                { label: "Full Rim", value: "full-rim" },
                { label: "Half Rim", value: "half-rim" },
                { label: "Rimless", value: "rimless" },
              ].map((ft) => (
                <label key={ft.value} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                  <input
                    type="radio"
                    name="frameType"
                    checked={selectedFrameType === ft.value}
                    onChange={() => setSelectedFrameType(ft.value)}
                    className="accent-amber-600"
                  />
                  <span>{ft.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 8. Material Accordion */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("material")}
            className="w-full flex items-center justify-between font-bold text-gray-900 text-sm hover:text-amber-800 text-left cursor-pointer"
          >
            <span>Material</span>
            {openSections.material ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {openSections.material && (
            <div className="mt-3 space-y-2 pl-1">
              {[
                { label: "All Materials", value: "all" },
                { label: "Acetate", value: "acetate" },
                { label: "Titanium", value: "titanium" },
                { label: "Metal", value: "metal" },
                { label: "TR90 / Premium Polymer", value: "tr90" },
              ].map((m) => (
                <label key={m.value} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                  <input
                    type="radio"
                    name="material"
                    checked={selectedMaterial === m.value}
                    onChange={() => setSelectedMaterial(m.value)}
                    className="accent-amber-600"
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Styled Apply Button */}
      <button
        onClick={onApplyFilters}
        className="w-full py-3.5 px-4 bg-[#8b8ba7] hover:bg-[#787895] active:scale-[0.98] text-white font-bold text-sm tracking-wide rounded-xl shadow-sm transition-all cursor-pointer text-center"
      >
        Apply
      </button>
    </div>
  );
}
