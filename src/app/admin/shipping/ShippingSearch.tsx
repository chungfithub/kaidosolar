"use client";

import { useState } from "react";
import { Search, Truck, Phone, MapPin, CheckCircle, ArrowRight, Package, Home } from "lucide-react";

const PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bạc Liêu", "Bắc Giang", "Bắc Kạn",
  "Bắc Ninh", "Bến Tre", "Bình Dương", "Bình Định", "Bình Phước",
  "Bình Thuận", "Cà Mau", "Cao Bằng", "Cần Thơ", "Đà Nẵng",
  "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp",
  "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh",
  "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên",
  "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng",
  "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An",
  "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình",
  "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng",
  "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa",
  "Thừa Thiên Huế", "Tiền Giang", "TP. Hồ Chí Minh", "Trà Vinh", "Tuyên Quang",
  "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

function ProvinceCombobox({
  label, icon: Icon, value, onChange, placeholder, accentColor
}: {
  label: string;
  icon: any;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  accentColor: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = PROVINCES.filter(p => p.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        marginBottom: "10px"
      }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          background: accentColor, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Icon size={16} color="white" />
        </div>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {label}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
            {value || <span style={{ color: "#cbd5e1", fontWeight: 400 }}>Chưa chọn</span>}
          </div>
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <Search size={15} style={{
          position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
          color: "#94a3b8", pointerEvents: "none"
        }} />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoComplete="off"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "12px 36px 12px 36px",
            border: `2px solid ${open ? accentColor : "#e2e8f0"}`,
            borderRadius: "12px",
            fontSize: "14px",
            outline: "none",
            background: "white",
            transition: "border-color 0.2s",
            boxShadow: open ? `0 0 0 4px ${accentColor}20` : "none"
          }}
        />
        {value && (
          <button type="button" onClick={() => { onChange(""); setSearch(""); }}
            style={{
              position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
              background: "#f1f5f9", border: "none", cursor: "pointer", color: "#64748b",
              width: "20px", height: "20px", borderRadius: "50%", fontSize: "12px",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>×</button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: "white", border: "1px solid #e2e8f0", borderRadius: "12px",
          maxHeight: "220px", overflowY: "auto",
          boxShadow: "0 12px 32px rgba(0,0,0,0.15)"
        }}>
          {filtered.map((p, i) => (
            <div key={p}
              onMouseDown={() => { onChange(p); setSearch(""); setOpen(false); }}
              style={{
                padding: "10px 16px", cursor: "pointer", fontSize: "14px",
                background: value === p ? `${accentColor}15` : "white",
                color: value === p ? accentColor : "#334155",
                fontWeight: value === p ? "700" : "normal",
                borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none",
                borderRadius: i === 0 ? "12px 12px 0 0" : i === filtered.length - 1 ? "0 0 12px 12px" : "0"
              }}>{p}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function matchCarrier(carrier: any, pickup: string, delivery: string): boolean {
  if (!pickup && !delivery) return false;
  const routes = (carrier.routes || "").toLowerCase();
  const pickupMatch = pickup ? routes.includes(pickup.toLowerCase()) : true;
  const deliveryMatch = delivery ? routes.includes(delivery.toLowerCase()) : true;
  return pickupMatch && deliveryMatch;
}

export default function ShippingSearch({ carriers }: { carriers: any[] }) {
  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [searched, setSearched] = useState(false);

  const results = searched ? carriers.filter(c => matchCarrier(c, pickup, delivery)) : [];

  const handleSearch = () => { if (pickup || delivery) setSearched(true); };
  const handleClear = () => { setPickup(""); setDelivery(""); setSearched(false); };

  return (
    <div style={{ marginBottom: "28px" }}>
      {/* Hero search box */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f4c3a 100%)",
        borderRadius: "20px",
        padding: "32px 36px",
        marginBottom: searched ? "20px" : "0",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(16,185,129,0.12)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-60px", left: "10%", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(59,130,246,0.08)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
          <div style={{ background: "rgba(16,185,129,0.2)", borderRadius: "10px", padding: "8px" }}>
            <Truck size={22} color="#10b981" />
          </div>
          <div>
            <h2 style={{ margin: 0, color: "white", fontSize: "18px", fontWeight: 700 }}>Tìm nhà xe phù hợp</h2>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>Nhập điểm đi và điểm đến để hệ thống gợi ý nhà xe tốt nhất</p>
          </div>
        </div>

        <div style={{
          background: "white", borderRadius: "16px", padding: "24px",
          display: "flex", gap: "20px", alignItems: "flex-end", flexWrap: "wrap",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)"
        }}>
          <ProvinceCombobox
            label="Điểm lấy hàng"
            icon={Package}
            value={pickup}
            onChange={setPickup}
            placeholder="Tìm tỉnh lấy hàng..."
            accentColor="#10b981"
          />

          <div style={{ paddingBottom: "14px", flexShrink: 0 }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(16,185,129,0.4)"
            }}>
              <ArrowRight size={18} color="white" />
            </div>
          </div>

          <ProvinceCombobox
            label="Điểm nhận hàng"
            icon={Home}
            value={delivery}
            onChange={setDelivery}
            placeholder="Tìm tỉnh nhận hàng..."
            accentColor="#3b82f6"
          />

          <div style={{ display: "flex", gap: "10px", paddingBottom: "2px", flexShrink: 0 }}>
            <button
              onClick={handleSearch}
              disabled={!pickup && !delivery}
              style={{
                padding: "13px 28px",
                background: (!pickup && !delivery) ? "#e2e8f0" : "linear-gradient(135deg, #10b981, #059669)",
                color: (!pickup && !delivery) ? "#94a3b8" : "white",
                border: "none", borderRadius: "12px", cursor: (!pickup && !delivery) ? "not-allowed" : "pointer",
                fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px",
                boxShadow: (!pickup && !delivery) ? "none" : "0 4px 14px rgba(16,185,129,0.4)",
                transition: "all 0.2s"
              }}
            >
              <Search size={16} /> Tìm nhà xe
            </button>
            {searched && (
              <button onClick={handleClear} style={{
                padding: "13px 20px", background: "#f8fafc", color: "#64748b",
                border: "1px solid #e2e8f0", borderRadius: "12px", cursor: "pointer",
                fontWeight: 600, fontSize: "14px"
              }}>Xóa</button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div>
          {results.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "40px", background: "#f8fafc",
              borderRadius: "16px", border: "1px dashed #e2e8f0"
            }}>
              <Truck size={40} style={{ color: "#cbd5e1", display: "block", margin: "0 auto 12px" }} />
              <p style={{ color: "#64748b", margin: 0 }}>Không tìm thấy nhà xe phù hợp với tuyến này.</p>
              <p style={{ color: "#94a3b8", fontSize: "13px", margin: "4px 0 0" }}>Hãy thêm nhà xe mới hoặc thử tuyến đường khác.</p>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <CheckCircle size={16} style={{ color: "#10b981" }} />
                <span style={{ fontWeight: 600, color: "#334155" }}>
                  Tìm thấy <span style={{ color: "#10b981", fontSize: "18px" }}>{results.length}</span> nhà xe phù hợp
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                {results.map(c => (
                  <div key={c.id} style={{
                    background: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "20px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    display: "flex", flexDirection: "column", gap: "12px"
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = "none";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "42px", height: "42px", borderRadius: "12px",
                          background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15))",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <Truck size={20} style={{ color: "#10b981" }} />
                        </div>
                        <div>
                          <strong style={{ fontSize: "15px", color: "#0f172a" }}>{c.name}</strong>
                          {c.phone && (
                            <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Phone size={12} /> {c.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <span style={{
                        background: "rgba(16,185,129,0.1)", color: "#10b981",
                        borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700
                      }}>Phù hợp ✓</span>
                    </div>

                    {c.routes && (
                      <div style={{
                        background: "#f8fafc", borderRadius: "10px", padding: "10px 12px",
                        fontSize: "12px", color: "#475569", display: "flex", gap: "8px", alignItems: "flex-start"
                      }}>
                        <MapPin size={13} style={{ color: "#10b981", flexShrink: 0, marginTop: "1px" }} />
                        <span>{c.routes}</span>
                      </div>
                    )}

                    {c.notes && (
                      <div style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
                        {c.notes}
                      </div>
                    )}

                    {c.phone && (
                      <a href={`tel:${c.phone}`} style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        padding: "10px", background: "linear-gradient(135deg, #10b981, #059669)",
                        color: "white", borderRadius: "10px", textDecoration: "none",
                        fontWeight: 700, fontSize: "14px",
                        boxShadow: "0 4px 12px rgba(16,185,129,0.3)"
                      }}>
                        <Phone size={15} /> Gọi ngay: {c.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
