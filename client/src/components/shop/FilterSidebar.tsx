"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Filter, RotateCcw } from "lucide-react";

interface FilterSidebarProps {
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
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export function FilterSidebar({
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
    <div className="w-full bg-[#121212] text-foreground border border-gold/20 rounded-2xl p-5 shadow-2xl space-y-5 font-sans backdrop-blur-md">
      {/* Filters Header */}
      <div className="flex items-center justify-between pt-1 pb-3 border-b border-gold/15">
        <div className="flex items-center gap-2 font-serif text-lg text-white font-medium">
          <Filter className="size-4 text-gold" />
          <span>Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs text-gold/70 hover:text-gold uppercase tracking-wider cursor-pointer font-medium transition-colors"
          >
            <RotateCcw className="size-3" /> Clear All
          </button>
        )}
      </div>

      {/* Accordion Sections List */}
      <div className="divide-y divide-gold/10">
        {/* 1. Price Accordion */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("price")}
            className="w-full flex items-center justify-between font-serif font-medium text-white text-sm hover:text-gold text-left cursor-pointer transition-colors"
          >
            <span>Price</span>
            {openSections.price ? <ChevronUp className="size-4 text-gold" /> : <ChevronDown className="size-4 text-gold/60" />}
          </button>
          {openSections.price && (
            <div className="mt-3 space-y-2.5 pl-1">
              {[
                { label: "All Prices", value: "all" },
                { label: "Under ₹2,000", value: "under-2000" },
                { label: "₹2,000 - ₹5,000", value: "2000-5000" },
                { label: "₹5,000 - ₹10,000", value: "5000-10000" },
                { label: "₹10,000+", value: "above-10000" },
              ].map((p) => (
                <label key={p.value} className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="radio"
                    name="price"
                    checked={selectedPriceRange === p.value}
                    onChange={() => setSelectedPriceRange(p.value)}
                    className="accent-gold size-3.5 cursor-pointer"
                  />
                  <span className={selectedPriceRange === p.value ? "text-gold font-medium" : ""}>{p.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 2. Gender Accordion */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("gender")}
            className="w-full flex items-center justify-between font-serif font-medium text-white text-sm hover:text-gold text-left cursor-pointer transition-colors"
          >
            <span>Gender</span>
            {openSections.gender ? <ChevronUp className="size-4 text-gold" /> : <ChevronDown className="size-4 text-gold/60" />}
          </button>
          {openSections.gender && (
            <div className="mt-3 space-y-2.5 pl-1">
              {[
                { label: "All Genders", value: "all" },
                { label: "Men", value: "men" },
                { label: "Women", value: "women" },
                { label: "Unisex", value: "unisex" },
              ].map((g) => (
                <label key={g.value} className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="radio"
                    name="gender"
                    checked={selectedGender === g.value}
                    onChange={() => setSelectedGender(g.value)}
                    className="accent-gold size-3.5 cursor-pointer"
                  />
                  <span className={selectedGender === g.value ? "text-gold font-medium" : ""}>{g.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 3. Shape & Style Accordion */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("shape")}
            className="w-full flex items-center justify-between font-serif font-medium text-white text-sm hover:text-gold text-left cursor-pointer transition-colors"
          >
            <span>Shape & Style</span>
            {openSections.shape ? <ChevronUp className="size-4 text-gold" /> : <ChevronDown className="size-4 text-gold/60" />}
          </button>
          {openSections.shape && (
            <div className="mt-3 space-y-2.5 pl-1">
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
                <label key={s.value} className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="radio"
                    name="shape"
                    checked={selectedShape === s.value}
                    onChange={() => setSelectedShape(s.value)}
                    className="accent-gold size-3.5 cursor-pointer"
                  />
                  <span className={selectedShape === s.value ? "text-gold font-medium" : ""}>{s.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 4. Frame Size Accordion */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("size")}
            className="w-full flex items-center justify-between font-serif font-medium text-white text-sm hover:text-gold text-left cursor-pointer transition-colors"
          >
            <span>Frame Size</span>
            {openSections.size ? <ChevronUp className="size-4 text-gold" /> : <ChevronDown className="size-4 text-gold/60" />}
          </button>
          {openSections.size && (
            <div className="mt-3 space-y-2.5 pl-1">
              {[
                { label: "All Sizes", value: "all" },
                { label: "Small", value: "small" },
                { label: "Medium", value: "medium" },
                { label: "Large", value: "large" },
                { label: "Wide Fit", value: "wide" },
              ].map((sz) => (
                <label key={sz.value} className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="radio"
                    name="frameSize"
                    checked={selectedFrameSize === sz.value}
                    onChange={() => setSelectedFrameSize(sz.value)}
                    className="accent-gold size-3.5 cursor-pointer"
                  />
                  <span className={selectedFrameSize === sz.value ? "text-gold font-medium" : ""}>{sz.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 5. Brand Accordion */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("brand")}
            className="w-full flex items-center justify-between font-serif font-medium text-white text-sm hover:text-gold text-left cursor-pointer transition-colors"
          >
            <span>Brand</span>
            {openSections.brand ? <ChevronUp className="size-4 text-gold" /> : <ChevronDown className="size-4 text-gold/60" />}
          </button>
          {openSections.brand && (
            <div className="mt-3 space-y-2.5 pl-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer hover:text-white transition-colors">
                <input
                  type="radio"
                  name="brand"
                  checked={selectedBrand === "all"}
                  onChange={() => setSelectedBrand("all")}
                  className="accent-gold size-3.5 cursor-pointer"
                />
                <span className={selectedBrand === "all" ? "text-gold font-medium" : ""}>All Brands</span>
              </label>
              {availableBrands.map((brandName) => {
                const bVal = brandName.toLowerCase().replace(/ /g, "-");
                return (
                  <label key={brandName} className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer hover:text-white transition-colors">
                    <input
                      type="radio"
                      name="brand"
                      checked={selectedBrand === bVal}
                      onChange={() => setSelectedBrand(bVal)}
                      className="accent-gold size-3.5 cursor-pointer"
                    />
                    <span className={selectedBrand === bVal ? "text-gold font-medium" : ""}>{brandName}</span>
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
            className="w-full flex items-center justify-between font-serif font-medium text-white text-sm hover:text-gold text-left cursor-pointer transition-colors"
          >
            <span>Frame Color</span>
            {openSections.color ? <ChevronUp className="size-4 text-gold" /> : <ChevronDown className="size-4 text-gold/60" />}
          </button>
          {openSections.color && (
            <div className="mt-3 space-y-2.5 pl-1">
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
                <label key={c.value} className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="radio"
                    name="color"
                    checked={selectedFrameColor === c.value}
                    onChange={() => setSelectedFrameColor(c.value)}
                    className="accent-gold size-3.5 cursor-pointer"
                  />
                  <span className={selectedFrameColor === c.value ? "text-gold font-medium" : ""}>{c.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 7. Frame Type Accordion */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("type")}
            className="w-full flex items-center justify-between font-serif font-medium text-white text-sm hover:text-gold text-left cursor-pointer transition-colors"
          >
            <span>Frame Type</span>
            {openSections.type ? <ChevronUp className="size-4 text-gold" /> : <ChevronDown className="size-4 text-gold/60" />}
          </button>
          {openSections.type && (
            <div className="mt-3 space-y-2.5 pl-1">
              {[
                { label: "All Types", value: "all" },
                { label: "Full Rim", value: "full-rim" },
                { label: "Half Rim", value: "half-rim" },
                { label: "Rimless", value: "rimless" },
              ].map((ft) => (
                <label key={ft.value} className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="radio"
                    name="frameType"
                    checked={selectedFrameType === ft.value}
                    onChange={() => setSelectedFrameType(ft.value)}
                    className="accent-gold size-3.5 cursor-pointer"
                  />
                  <span className={selectedFrameType === ft.value ? "text-gold font-medium" : ""}>{ft.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 8. Material Accordion */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("material")}
            className="w-full flex items-center justify-between font-serif font-medium text-white text-sm hover:text-gold text-left cursor-pointer transition-colors"
          >
            <span>Material</span>
            {openSections.material ? <ChevronUp className="size-4 text-gold" /> : <ChevronDown className="size-4 text-gold/60" />}
          </button>
          {openSections.material && (
            <div className="mt-3 space-y-2.5 pl-1">
              {[
                { label: "All Materials", value: "all" },
                { label: "Acetate", value: "acetate" },
                { label: "Titanium", value: "titanium" },
                { label: "Metal", value: "metal" },
                { label: "TR90 / Premium Polymer", value: "tr90" },
              ].map((m) => (
                <label key={m.value} className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="radio"
                    name="material"
                    checked={selectedMaterial === m.value}
                    onChange={() => setSelectedMaterial(m.value)}
                    className="accent-gold size-3.5 cursor-pointer"
                  />
                  <span className={selectedMaterial === m.value ? "text-gold font-medium" : ""}>{m.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
