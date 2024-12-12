import React, { useState, useEffect, useRef } from "react";
import Spinner from "./components/Spinner";
import "./assets/scss/styles.scss";
import { formatDistanceToNow } from "date-fns";

const App = () => {
  const [launches, setLaunches] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedLaunchId, setExpandedLaunchId] = useState(null);
  const loaderRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const fetchLaunches = async (page, search = "") => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.spacexdata.com/v3/launches?limit=10&offset=${
          (page - 1) * 10
        }&mission_name=${search}`
      );
      const data = await response.json();
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setLaunches((prevLaunches) =>
          page === 1 ? data : [...prevLaunches, ...data]
        );
      }
    } catch (error) {
      console.error("Error fetching launches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasMore) {
      fetchLaunches(page, searchTerm);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [loading, hasMore]);

  const handleSearch = (e) => {
    const value = e.target.value;
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      setLaunches([]);
      setSearchTerm(value);
    }, 500);
  };

  const toggleLaunchDetails = (id) => {
    setExpandedLaunchId((prevId) => (prevId === id ? null : id));
  };

  return (
    <div className="container">
      <div className="main__wrapper">
        <input
          type="search"
          placeholder="Search..."
          onChange={handleSearch}
          className="search"
        />
        <div className="fade">
          <div className="launch__list">
            {launches.length ? (
              launches.map((launch) => (
                <div className="launch_wrapper" key={launch.flight_number}>
                  <div className="launch__item">
                    <div style={{ display: "flex" }}>
                      <h2 className="launch__mission">{launch.mission_name}</h2>
                      <div
                        className={`launch__status ${
                          launch.launch_success
                            ? "launch__status--success"
                            : launch.upcoming === true &&
                              launch.launch_success === null
                            ? "launch__status--info"
                            : "launch__status--danger"
                        }`}
                      >
                        {launch.launch_success
                          ? "success"
                          : launch.upcoming === true &&
                            launch.launch_success === null
                          ? "upcoming"
                          : "failed"}
                      </div>
                    </div>
                    {expandedLaunchId === launch.flight_number && (
                      <div className="launch__body">
                        <div className="launch__meta">
                          <span className="launch__meta-item">
                            {formatDistanceToNow(
                              new Date(launch.launch_date_utc)
                            )}{" "}
                            ago
                          </span>
                          {launch.links.article_link && (
                            <span className="launch__meta-item">
                              <a
                                href={launch.links.article_link}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Article
                              </a>
                            </span>
                          )}
                          {launch.links.video_link && (
                            <span className="launch__meta-item">
                              <a
                                target="_blank"
                                href={launch.links.video_link}
                                rel="noreferrer"
                              >
                                Video
                              </a>
                            </span>
                          )}
                        </div>
                        <div className="launch__details">
                          <div>
                            <img
                              src={launch.links.mission_patch_small}
                              alt="mission_patch"
                            />
                          </div>
                          <div className={!launch.details ? "no-content" : ""}>
                            {launch.details || "No details available."}
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <button
                        className="btn btn--primary"
                        onClick={() =>
                          toggleLaunchDetails(launch.flight_number)
                        }
                      >
                        {expandedLaunchId === launch.flight_number
                          ? "Hide"
                          : "View"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : searchTerm && !loading ? (
              <div className="no-content"> No Data Found.</div>
            ) : (
              ""
            )}
          </div>
        </div>
        {loading && <Spinner />}
        {!hasMore && <p className="max-reached">End of the list.</p>}
        <div ref={loaderRef} style={{ height: "30px", margin: "10px 0" }}></div>
      </div>
    </div>
  );
};

export default App;
