"use client";

import { useState, useEffect } from "react";
import { AssetType, Holding } from "@/types";
import { searchCrypto, searchTEFAS, AVAILABLE_METALS, METRIC_WEIGHTS } from "@/lib/api";
import { X, Search, Loader2, Plus } from "lucide-react";
import { usePortfolioStore } from "@/store/portfolio-store";
import { useSettingsStore } from "@/store/settings-store";

const COMMON_CURRENCIES = [
  "USD", "EUR", "GBP", "TRY", "JPY", "CHF", "CAD", "AUD",
  "CNY", "INR", "BRL", "KRW", "SGD", "HKD", "SEK", "NOK",
];

interface Props {
  onAdd: (holding: Omit<Holding, "id">) => void;
  onEdit?: (id: string, holding: Omit<Holding, "id">) => void;
}

interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  category?: string;
  type?: string;
  thumb?: string;
}

export default function AddHoldingModal({ onAdd, onEdit }: Props) {
  // Global Stores
  const { isAddModalOpen: open, setAddModalOpen, editingHolding, setEditingHolding } = usePortfolioStore();
  const { displayCurrency } = useSettingsStore();

  const [assetType, setAssetType] = useState<AssetType>("crypto");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ crypto: any[], tefas: any[], metals: any[] }>({ crypto: [], tefas: [], metals: [] });
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [currency, setCurrency] = useState(displayCurrency);
  const [buyDate, setBuyDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [priceMode, setPriceMode] = useState<"unit" | "total">("unit");
  const [totalCost, setTotalCost] = useState("");

  const displayPrice = priceMode === "unit" ? buyPrice : totalCost;

  const [unit, setUnit] = useState<string>("");
  const [image, setImage] = useState("");

  function handleClose() {
    setAddModalOpen(false);
    setEditingHolding(null);
  }

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults({ crypto: [], tefas: [], metals: [] });
      setSelected(null);
      setQuantity("");
      setBuyPrice("");
      setTotalCost("");
      setPriceMode("unit");
      setAssetType("crypto");
      setCurrency(displayCurrency);
      setUnit("");
      setImage("");
    } else if (editingHolding) {
      setAssetType(editingHolding.assetType);
      setSelected({
        id: editingHolding.apiId || editingHolding.symbol,
        symbol: editingHolding.symbol,
        name: editingHolding.name,
        thumb: editingHolding.image,
      });
      setQuantity(editingHolding.quantity.toString());
      setBuyPrice(editingHolding.buyPrice?.toString() || "");
      if (editingHolding.buyPrice && editingHolding.quantity) {
        setTotalCost((editingHolding.buyPrice * editingHolding.quantity).toString());
      }
      setCurrency(editingHolding.currency);
      setUnit(editingHolding.unit || "");
      setBuyDate(editingHolding.buyDate || new Date().toISOString().split("T")[0]);
      setImage(editingHolding.image || "");
    }
  }, [open, displayCurrency, editingHolding]);

  useEffect(() => {
    async function search() {
      if (!query || query.length < 2) {
        setResults({ crypto: [], tefas: [], metals: [] });
        return;
      }

      setSearching(true);
      try {
        const res = await fetch(`/api/search/all?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults({
            crypto: data.crypto || [],
            tefas: data.tefas || [],
            metals: data.metals || []
          });
        }
      } catch (error) {
        console.error("Unified search failed:", error);
      } finally {
        setSearching(false);
      }
    }

    const timeout = setTimeout(search, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  function handleSelect(item: any, type: AssetType) {
    setAssetType(type);
    setSelected({
      id: type === "crypto" ? item.id : item.symbol || item.code,
      symbol: item.symbol || item.code,
      name: item.name || item.title,
      thumb: item.thumb
    });
    setQuery("");
    setResults({ crypto: [], tefas: [], metals: [] });

    if (item.thumb) setImage(item.thumb);
    if (type === "metal") setUnit("oz");
    if (type === "tefas") setCurrency("TRY");

    // Fetch price
    const fetchPrice = async () => {
      try {
        const url = type === 'metal'
          ? '/api/metals/prices'
          : `/api/${type}/prices?${type === 'crypto' ? 'ids' : 'codes'}=${item.id || item.symbol || item.code}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const lookupKey = type === 'metal' ? item.apiId : (item.id || item.symbol || item.code);
          let price = data[lookupKey] || data[item.symbol] || data[item.code];
          if (price) {
            let priceVal = typeof price === 'object' ? (price.usd || price.try || Object.values(price)[0]) : price;
            setBuyPrice(Number(priceVal).toFixed(2));
          }
        }
      } catch (e) { }
    };
    fetchPrice();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !quantity) return;

    let finalBuyPrice: number | undefined;

    if (priceMode === "unit") {
      finalBuyPrice = buyPrice ? parseFloat(buyPrice) : undefined;
    } else {
      // Calculate unit price from total cost
      if (totalCost && quantity && parseFloat(quantity) !== 0) {
        finalBuyPrice = parseFloat(totalCost) / parseFloat(quantity);
      }
    }

    const holding: Omit<Holding, "id"> = {
      assetType,
      symbol: selected.symbol,
      name: selected.name,
      quantity: parseFloat(quantity),
      buyPrice: finalBuyPrice,
      buyDate: buyDate || undefined,
      image: image || undefined,
      apiId: assetType === "crypto" ? selected.id : undefined,
      currency,
      unit: assetType === "metal" ? unit : undefined,
    };

    if (editingHolding && onEdit) {
      onEdit(editingHolding.id, holding);
    } else {
      onAdd(holding);
    }
    handleClose();
  }

  // Helper to handle price input change
  function handlePriceChange(val: string) {
    // regex validation for float
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      if (priceMode === "unit") {
        setBuyPrice(val);
      } else {
        setTotalCost(val);
      }
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {editingHolding ? "Edit Holding" : "Add Holding"}
          </h2>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset Type Selector */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Asset Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["crypto", "tefas", "metal"] as AssetType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setAssetType(type);
                    setSelected(null);
                    setQuery("");
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${assetType === type
                    ? "bg-white text-black"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                >
                  {type === "crypto"
                    ? "Crypto"
                    : type === "tefas"
                      ? "TEFAS"
                      : "Metals"}
                </button>
              ))}
            </div>
          </div>

          {/* Search / Select Asset */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Search Asset
            </label>

            {selected ? (
              <>
                <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3 border border-zinc-700">
                  <div className="flex items-center gap-3">
                    {image && (
                      <img src={image} alt={selected.name} className="w-8 h-8 rounded-full" />
                    )}
                    <div>
                      <div className="text-white font-medium">{selected.name}</div>
                      <div className="text-zinc-500 text-xs uppercase">
                        {selected.symbol}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(null);
                      setImage("");
                    }}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    Change
                  </button>
                </div>
                {assetType === "crypto" && editingHolding && !editingHolding.apiId && selected?.id === editingHolding.symbol && (
                  <div className="mt-2 p-2 bg-amber-500/10 text-amber-500 text-xs rounded border border-amber-500/20">
                    ⚠️ Please <b>Change</b> and re-select this coin to fix the price connection.
                  </div>
                )}
              </>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    assetType === "crypto"
                      ? "Search Bitcoin, Ethereum..."
                      : assetType === "tefas"
                        ? "Search fund code or name..."
                        : "Search Gold, Silver..."
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 animate-spin" />
                )}
              </div>
            )}

            {/* Unified Search Results Dropdown */}
            {!selected && query.length >= 2 && (
              <div className="mt-1 max-h-80 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-800 shadow-2xl custom-scrollbar">
                {searching ? (
                  <div className="p-10 text-center">
                    <Loader2 className="w-6 h-6 text-zinc-600 animate-spin mx-auto mb-2" />
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Scanning Markets...</p>
                  </div>
                ) : (results.crypto.length > 0 || results.tefas.length > 0 || results.metals.length > 0) ? (
                  <div className="divide-y divide-zinc-700/50">
                    {/* Metals Section */}
                    {results.metals.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-zinc-900/50 text-[10px] font-bold text-yellow-500/50 uppercase tracking-widest border-b border-zinc-700/30">Metals</div>
                        {results.metals.map((r: any) => (
                          <button type="button" key={r.symbol} onClick={() => handleSelect(r, "metal")} className="w-full text-left px-4 py-3 hover:bg-white/5 transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                <Plus className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-white font-bold text-sm">{r.name}</div>
                                <div className="text-zinc-500 text-[10px] font-mono">{r.symbol}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Crypto Section */}
                    {results.crypto.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-zinc-900/50 text-[10px] font-bold text-blue-500/50 uppercase tracking-widest border-b border-zinc-700/30">Crypto</div>
                        {results.crypto.map((r: any) => (
                          <button type="button" key={r.id} onClick={() => handleSelect(r, "crypto")} className="w-full text-left px-4 py-3 hover:bg-white/5 transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              {r.thumb ? (
                                <img src={r.thumb} alt="" className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-500/10" />
                              )}
                              <div>
                                <div className="text-white font-bold text-sm">{r.name}</div>
                                <div className="text-zinc-500 text-[10px] font-mono">{r.symbol.toUpperCase()}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* TEFAS Section */}
                    {results.tefas.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-zinc-900/50 text-[10px] font-bold text-purple-500/50 uppercase tracking-widest border-b border-zinc-700/30">TEFAS Funds</div>
                        {results.tefas.map((r: any) => (
                          <button type="button" key={r.code} onClick={() => handleSelect(r, "tefas")} className="w-full text-left px-4 py-3 hover:bg-white/5 transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 text-[9px] font-bold">{r.code}</div>
                              <div className="min-w-0 flex-1">
                                <div className="text-white font-bold text-sm truncate">{r.title}</div>
                                <div className="text-zinc-500 text-[10px]">{r.category}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-zinc-900/30">
                    <div className="text-zinc-500 font-bold text-sm mb-1 uppercase tracking-widest">No Matches Found</div>
                    <p className="text-zinc-700 text-[11px] mb-4">Try a different name or symbol</p>
                    <button
                      type="button"
                      onClick={() => handleSelect({ id: query.toLowerCase(), symbol: query.toUpperCase(), name: `Custom ${query.toUpperCase()}` }, "crypto")}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-all border border-white/5"
                    >
                      <Plus className="w-3 h-3" />
                      Add Custom Crypto
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Currency & Quantity & Buy Price */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-sm text-zinc-400 mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={assetType === "tefas"}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-500 disabled:opacity-60"
              >
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {assetType === "metal" && (
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Unit
                </label>
                <div className="flex bg-zinc-800 rounded-lg p-1 border border-zinc-700 h-[46px]">
                  <button
                    type="button"
                    onClick={() => setUnit("oz")}
                    className={`flex-1 rounded-md text-xs font-bold transition-all ${unit === "oz" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    Ounce
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit("gr")}
                    className={`flex-1 rounded-md text-xs font-bold transition-all ${unit === "gr" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    Gram
                  </button>
                </div>
              </div>
            )}
            <div className="col-span-1">
              <label className="block text-sm text-zinc-400 mb-2">
                Quantity
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow empty, numbers, and decimal point
                  if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                    setQuantity(val);
                  }
                }}
                placeholder="0.00"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                required
              />
            </div>
            <div className={assetType === "metal" ? "col-span-1" : "col-span-1 md:col-span-2"}>
              <label className="block text-zinc-400 text-xs uppercase mb-1 flex justify-between items-center">
                <span>{priceMode === "unit" ? "Buy Price" : "Total"}</span>
                <div className="flex bg-zinc-800 rounded p-0.5 ml-2">
                  <button
                    type="button"
                    onClick={() => setPriceMode("unit")}
                    className={`text-[10px] px-2 py-0.5 rounded transition-colors ${priceMode === "unit" ? "bg-zinc-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    Unit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceMode("total")}
                    className={`text-[10px] px-2 py-0.5 rounded transition-colors ${priceMode === "total" ? "bg-zinc-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    Total
                  </button>
                </div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={displayPrice}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                  placeholder={priceMode === "unit" ? "0.00" : "1000.00"}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                  {currency}
                </div>
              </div>
            </div>
          </div>

          {/* Buy Date */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Buy Date (optional)
            </label>
            <input
              type="date"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!selected || !quantity}
            className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {editingHolding ? "Update Holding" : "Add to Portfolio"}
          </button>
        </form>
      </div>
    </div>
  );
}
