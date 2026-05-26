import { useState, useMemo, JSX } from "react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Grid3x3,
  SlidersHorizontal,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Image from "next/image";
import { Category } from "@/types/services/categories/service.category.types";

type SortOption = "recent" | "title" | "price-low" | "price-high";

interface ServicesHeaderProps {
  total: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  activeFiltersCount: number;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  selectedCategory?: string;
  setSelectedCategory?: (category: string) => void;
  categories?: Category[];
  selectedTags?: string[];
  toggleTag?: (tag: string) => void;
  allTags?: string[];
  priceRange?: { min: string; max: string };
  setPriceRange?: (range: { min: string; max: string }) => void;
}

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "recent", label: "Most Recent" },
  { value: "title", label: "A to Z" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

export default function ServicesHeader({
  total,
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  activeFiltersCount,
  sortBy,
  setSortBy,
  selectedCategory = "",
  setSelectedCategory,
  categories = [],
  selectedTags = [],
  toggleTag,
  priceRange = { min: "", max: "" },
  setPriceRange,
}: ServicesHeaderProps): JSX.Element {
  const [categorySearch, setCategorySearch] = useState<string>("");

  // Filter categories based on search
  const filteredCategories = useMemo<Category[]>(() => {
    if (!categories || !Array.isArray(categories)) return [];
    if (!categorySearch.trim()) return categories;
    const query = categorySearch.toLowerCase();
    return categories.filter((cat) =>
      cat.catName.toLowerCase().includes(query)
    );
  }, [categories, categorySearch]);

  // Filter tags based on search

  // Get selected category name
  const selectedCategoryName = useMemo<string>(() => {
    if (!selectedCategory) return "All Categories";
    if (!categories || !Array.isArray(categories)) return "All Categories";
    const category = categories.find((cat) => cat._id === selectedCategory);
    return category?.catName || "All Categories";
  }, [selectedCategory, categories]);

  // Clear all filters
  const handleClearAll = (): void => {
    if (setSelectedCategory) setSelectedCategory("");
    if (toggleTag && selectedTags.length > 0) {
      selectedTags.forEach((tag) => toggleTag(tag));
    }
    if (setPriceRange) setPriceRange({ min: "", max: "" });
    setSortBy("recent");
    setSearchQuery("");
    setShowFilters(false);
  };

  return (
    <div className="w-full rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 space-y-4">
        {/* Title and Count */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Services
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {total} {total === 1 ? "service" : "services"} available
            </p>
          </div>
        </div>

        {/* Search Bar and Actions */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="min-w-45 justify-between"
              >
                <span className="flex items-center gap-2">
                  <Grid3x3 className="w-4 h-4" />
                  {sortOptions.find((opt) => opt.value === sortBy)?.label}
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
              <div className="space-y-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      sortBy === option.value
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Filters Popover */}
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 relative min-w-30"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mt-4" align="end">
              <div className="space-y-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Advanced Filters
                  </h3>
                  <div className="flex items-center gap-2">
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAll}
                        className="text-xs"
                      >
                        Clear All
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Filters Content */}
                <div className="p-4 space-y-6 max-h-125 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category Filter */}
                    {setSelectedCategory &&
                      categories &&
                      categories.length > 0 && (
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Grid3x3 className="w-4 h-4" />
                            Category
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-auto justify-between"
                              >
                                <span className="truncate">
                                  {selectedCategoryName}
                                </span>
                                <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-76 p-0" align="start">
                              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input
                                    type="text"
                                    placeholder="Search categories..."
                                    value={categorySearch}
                                    onChange={(e) =>
                                      setCategorySearch(e.target.value)
                                    }
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              <div className="max-h-64 overflow-y-auto p-2">
                                <button
                                  onClick={() => {
                                    setSelectedCategory("");
                                    setCategorySearch("");
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                    selectedCategory === ""
                                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
                                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                  }`}
                                >
                                  All Categories
                                </button>
                                {filteredCategories.map((cat) => (
                                  <button
                                    key={cat._id}
                                    onClick={() => {
                                      setSelectedCategory(cat._id);
                                      setCategorySearch("");
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                                      selectedCategory === cat._id
                                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
                                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                  >
                                    {cat.catCoverId?.url && (
                                      <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0">
                                        <Image
                                          src={cat.catCoverId.url}
                                          alt={cat.catName}
                                          fill
                                          className="object-cover"
                                          sizes="24px"
                                        />
                                      </div>
                                    )}
                                    <span className="truncate">
                                      {cat.catName}
                                    </span>
                                  </button>
                                ))}
                                {filteredCategories.length === 0 && (
                                  <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                                    No categories found
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                  </div>

                  <div className="space-y-3 w-full">
                    {/* Price Range Filter */}
                    {setPriceRange && (
                      <div className="w-full space-y-3">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Price Range
                        </label>
                        <div className="w-full flex flex-col gap-2">
                          <input
                            type="number"
                            placeholder="Min"
                            value={priceRange.min}
                            onChange={(e) =>
                              setPriceRange({
                                ...priceRange,
                                min: e.target.value,
                              })
                            }
                            className="flex-1 border-b p-2"
                          />
                          <span className="text-gray-500 dark:text-gray-400">
                            to
                          </span>
                          <input
                            type="number"
                            placeholder="Max"
                            value={priceRange.max}
                            onChange={(e) =>
                              setPriceRange({
                                ...priceRange,
                                max: e.target.value,
                              })
                            }
                            className="flex-1 border-b p-2"
                          />
                        </div>
                      </div>
                    )}

                    {/* Active Filters Display */}
                    {activeFiltersCount > 0 && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Active Filters:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCategory && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                              {selectedCategoryName}
                              {setSelectedCategory && (
                                <button
                                  onClick={() => setSelectedCategory("")}
                                  className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </span>
                          )}
                          {selectedTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium"
                            >
                              {tag}
                              {toggleTag && (
                                <button
                                  onClick={() => toggleTag(tag)}
                                  className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </span>
                          ))}
                          {(priceRange.min || priceRange.max) && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                              {priceRange.min && `$${priceRange.min}`}
                              {priceRange.min && priceRange.max && " - "}
                              {priceRange.max && `$${priceRange.max}`}
                              {setPriceRange && (
                                <button
                                  onClick={() =>
                                    setPriceRange({ min: "", max: "" })
                                  }
                                  className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
