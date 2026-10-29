import React, { useState, useEffect } from "react";
import { API_URL } from "../api";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { loadFavorites, toggleFavorite } from "../orderStore";

const FILTERS = [
  { label: "All", region: "All", key: "all" },
  { label: "South-Indian", region: "South-Indian", key: "south-indian" },
  { label: "North-Indian", region: "North-Indian", key: "north-indian" },
  { label: "Chinese", region: "Chinese", key: "chinese" },
  { label: "Bakery", region: "Bakery", key: "bakery" },
];

const FirmCollections = () => {
  const [firmData, setFirmData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [activeCategory, setActiveCategory] = useState("all");
  const [favorites, setFavorites] = useState(loadFavorites); // device-local
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [popId, setPopId] = useState(""); // heart that was just toggled (plays the pop animation)

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${API_URL}/vendor/all-vendors`);
        const data = await response.json();
        setFirmData(data.vendors || []);
      } catch (error) {
        console.error("firm data not fetched", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filterHandler = (region, key) => {
    setSelectedRegion(region);
    setActiveCategory(key);
  };

  const firms = firmData
    .flatMap((v) => v.firm || [])
    .filter(
      (item) =>
        (selectedRegion === "All" || (item.region || []).map((r) => r.toLowerCase()).includes(selectedRegion.toLowerCase())) &&
        (!onlyFavorites || favorites.includes(item._id))
    );

  return (
    <>
      <h3 className="firmHeading">Restaurants with online food delivery in Hyderabad</h3>
      <div className="filterButtons" role="group" aria-label="Filter restaurants">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={activeCategory === f.key}
            onClick={() => filterHandler(f.region, f.key)}
            className={activeCategory === f.key ? "activeButton" : ""}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={onlyFavorites}
          onClick={() => setOnlyFavorites((v) => !v)}
          className={`favFilter${onlyFavorites ? " activeButton" : ""}`}
        >
          <FaHeart aria-hidden="true" /> Favorites ({favorites.length})
        </button>
      </div>
      <section className="firmSection" aria-busy={loading}>
        {loading &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="firmCardSkeleton">
              <div className="a skeleton" />
              <div className="b skeleton" />
              <div className="c skeleton" />
            </div>
          ))}
        {firms.map((item, i) => {
          const fav = favorites.includes(item._id);
          return (
            <Link to={`/products/${item._id}/${item.firmName}`} className="link" key={item._id} style={{ "--i": Math.min(i, 8) }}>
              <div className="zoomEffect">
                <div className="firmGroupBox">
                  <div className="firmGroup">
                    <img src={item.image} alt={item.firmName} loading="lazy" />
                    <div className="firmOffer">{item.offer}</div>
                    <button
                      type="button"
                      className={`favBtn${fav ? " active" : ""}${popId === item._id ? " pop" : ""}`}
                      aria-label={fav ? `Remove ${item.firmName} from favorites` : `Add ${item.firmName} to favorites`}
                      aria-pressed={fav}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFavorites(toggleFavorite(item._id));
                        setPopId(item._id);
                      }}
                    >
                      {fav ? <FaHeart /> : <FaRegHeart />}
                    </button>
                  </div>
                  <div className="firmDetails">
                    <strong>{item.firmName}</strong>
                    <div className="firmArea">{(item.region || []).join(", ")}</div>
                    <div className="firmArea">{item.area}</div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {!loading && firms.length === 0 && (
          <p className="emptyNote">
            {onlyFavorites ? "No favorites yet. Tap the heart on a restaurant to save it." : "No restaurants match this filter."}
          </p>
        )}
      </section>
    </>
  );
};

export default FirmCollections;
