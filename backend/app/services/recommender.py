"""
Loads the three trained models' artifacts (hidden gem classifier,
popularity regressor, similarity feature matrix) once at startup, and
exposes the same blended ranking function built in
ml/notebooks/07_ranking_blend.ipynb - this IS that notebook's logic,
just running as a persistent service instead of a one-off script.
"""
import os
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler

from app.config import settings
from app.services.data_store import get_places_df

_hidden_gem_clf = None
_hidden_gem_features = None
_popularity_reg = None
_popularity_features = None
_sim_feature_matrix = None
_vec_cols = None

_pred_hidden_gem_prob = None
_pred_popularity_norm = None


def _artifact_path(name: str) -> str:
    return os.path.join(settings.ML_ARTIFACTS_DIR, name)


def load():
    global _hidden_gem_clf, _hidden_gem_features, _popularity_reg, _popularity_features
    global _sim_feature_matrix, _vec_cols, _pred_hidden_gem_prob, _pred_popularity_norm

    _hidden_gem_clf = joblib.load(_artifact_path("hidden_gem_classifier.pkl"))
    _hidden_gem_features = joblib.load(_artifact_path("hidden_gem_features.pkl"))
    _popularity_reg = joblib.load(_artifact_path("popularity_regressor.pkl"))
    _popularity_features = joblib.load(_artifact_path("popularity_features.pkl"))
    _sim_feature_matrix = joblib.load(_artifact_path("similarity_feature_matrix.pkl"))
    _vec_cols = joblib.load(_artifact_path("similarity_vec_cols.pkl"))

    df = get_places_df()
    zone_dummies = pd.get_dummies(df["Zone"], prefix="zone")
    terrain_dummies = pd.get_dummies(df["Terrain_Type"], prefix="terrain")

    def build_X(feature_list):
        base = pd.concat([df, zone_dummies, terrain_dummies], axis=1)
        for col in feature_list:
            if col not in base.columns:
                base[col] = 0
        return base[feature_list]

    X_hidden_gem = build_X(_hidden_gem_features)
    X_popularity = build_X(_popularity_features)

    _pred_hidden_gem_prob = _hidden_gem_clf.predict_proba(X_hidden_gem)[:, 1]
    pred_pop_raw = _popularity_reg.predict(X_popularity)
    _pred_popularity_norm = MinMaxScaler().fit_transform(pred_pop_raw.reshape(-1, 1)).flatten()


def _ensure_loaded():
    if _hidden_gem_clf is None:
        load()


def rank(candidate_place_ids: list[int], interests: list[str], suitable_for: list[str],
         top_n: int = 30, w_similarity=0.5, w_popularity=0.3, w_hidden_gem=0.2) -> pd.DataFrame:
    """Ranks candidates (already rule-filtered by the caller) by the
    blended score: interest-similarity + predicted popularity + hidden-gem
    discovery nudge."""
    _ensure_loaded()
    df = get_places_df()

    query = pd.Series(0.0, index=_vec_cols)
    for tag in interests:
        col = f"interest_{tag.lower().replace(' ', '_')}"
        if col in query.index:
            query[col] = 1.0
    for s in suitable_for:
        col = f"suitable_{s.lower().replace(' ', '_')}"
        if col in query.index:
            query[col] = 1.0
    query_full = pd.concat([query, pd.Series({"difficulty_norm": 0.0, "cost_norm": 0.0})])

    mask = df["place_id"].isin(candidate_place_ids)
    candidates = df[mask]
    if candidates.empty:
        return candidates

    cand_idx = candidates.index
    cand_matrix = _sim_feature_matrix.loc[cand_idx]
    sims = cosine_similarity([query_full.values], cand_matrix.values)[0]

    final_score = (
        w_similarity * sims
        + w_popularity * _pred_popularity_norm[cand_idx]
        + w_hidden_gem * _pred_hidden_gem_prob[cand_idx]
    )

    result = candidates.copy()
    result["_similarity"] = sims
    result["_final_score"] = final_score
    return result.sort_values("_final_score", ascending=False).head(top_n)
