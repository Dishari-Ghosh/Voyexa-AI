"""
Great-circle distance helpers, used to warn (never hard-block) when
selected places are spread across a distance that doesn't really fit the
chosen number of days. Mirrors frontend/src/utils/distance.js.
"""
import math


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
    )
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def max_spread_km(places: list[dict]) -> float:
    max_dist = 0.0
    for i in range(len(places)):
        for j in range(i + 1, len(places)):
            d = haversine_km(
                places[i]["Latitude"], places[i]["Longitude"],
                places[j]["Latitude"], places[j]["Longitude"],
            )
            max_dist = max(max_dist, d)
    return max_dist


def recommended_days_for_spread(spread_km: float) -> int:
    return max(1, math.ceil(spread_km / 350))
