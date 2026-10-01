"""
Groups a set of already-chosen places into `num_days` day-wise clusters by
geographic proximity (KMeans on lat/long) - the server-side counterpart to
frontend/src/utils/kmeans.js's clusterIntoDays(), run here against the
admin-overlaid catalogue (see place_overlay.py) so an admin-edited place's
current coordinates are what actually gets clustered.

NOTE: this file did not exist in the uploaded project (only a stale
__pycache__/itinerary.cpython-314.pyc was left behind, meaning the source
was deleted after being compiled once) - POST /planning/itinerary would
crash with ModuleNotFoundError. This is a reconstruction; it fits
planning.py's call `cluster_into_days(req.place_ids, req.num_days, df=df)`
and returns the {day, places} shape planning.py and api/places.js already
expect, but the exact original clustering logic is unknown.
"""
import pandas as pd
from sklearn.cluster import KMeans

from app.services.data_store import place_to_dict


def cluster_into_days(place_ids: list[int], num_days: int, df: pd.DataFrame) -> list[dict]:
    subset = df[df["place_id"].isin(place_ids)].copy()
    if subset.empty:
        return []

    k = max(1, min(num_days, len(subset)))
    coords = subset[["Latitude", "Longitude"]].to_numpy()

    if k == 1 or len(subset) == 1:
        labels = [0] * len(subset)
        centroids = coords.mean(axis=0, keepdims=True)
    else:
        km = KMeans(n_clusters=k, n_init=10, random_state=0)
        labels = km.fit_predict(coords)
        centroids = km.cluster_centers_

    subset["_cluster"] = labels

    # Number days north-to-south by each cluster's centroid latitude, same
    # ordering convention as the frontend's clusterIntoDays().
    centroid_order = sorted(range(len(centroids)), key=lambda c: -centroids[c][0])
    day_map = {cluster: day for day, cluster in enumerate(centroid_order, start=1)}

    groups: dict[int, list] = {}
    for _, row in subset.iterrows():
        day = day_map[row["_cluster"]]
        groups.setdefault(day, []).append(place_to_dict(row))

    return [{"day": day, "places": places} for day, places in sorted(groups.items())]
