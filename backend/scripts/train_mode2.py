#!/usr/bin/env python3
"""
Train Mode 2 (Relevance) Model
Trains a regressor to predict ATS Match Score based on Resume-JD pairs.
Uses TF-IDF and Semantic Similarity features.
"""

import sys
import re
from pathlib import Path
import pandas as pd
import numpy as np
from tqdm import tqdm
import joblib
import json

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sentence_transformers import SentenceTransformer

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))


def load_data():
    """Load and preprocess ats_score_v1 dataset."""
    print("=" * 80)
    print("LOADING DATA (Mode 2)")
    print("=" * 80)
    
    from datasets import load_from_disk
    try:
        ds = load_from_disk("data/mode2/ats_score_v1")
    except Exception as e:
        print(f"❌ Could not load dataset: {e}")
        print("Run download_datasets.py first")
        sys.exit(1)
        
    print(f"📊 Found {len(ds['train'])} training examples")
    
    # Convert to DataFrame for easier handling
    df = pd.DataFrame(ds['train'])
    
    # Split Text into Resume and JD
    print("\n✂️  Splitting Resume and JD...")
    
    resumes = []
    jds = []
    valid_indices = []
    
    for idx, text in enumerate(tqdm(df['text'])):
        # The dataset uses "SEP" or similar delimiters. 
        # Based on inspection: "... SEP - Share resume ..." or just "SEP"
        # Let's try to split by "SEP"
        parts = text.split("SEP", 1)
        
        if len(parts) == 2:
            resumes.append(parts[0].strip())
            jds.append(parts[1].strip())
            valid_indices.append(idx)
        else:
            # Try alternative splitters if needed, or skip
            continue
            
    # Filter DataFrame
    df = df.iloc[valid_indices].copy()
    df['resume_text'] = resumes
    df['jd_text'] = jds
    
    print(f"✓ Successfully parsed {len(df)} pairs")
    return df


def extract_features(df):
    """Extract similarity features from Resume-JD pairs."""
    print("\n" + "=" * 80)
    print("FEATURE ENGINEERING")
    print("=" * 80)
    
    features = pd.DataFrame(index=df.index)
    
    # 1. TF-IDF Cosine Similarity
    print("🔤 Calculating TF-IDF Similarity...")
    tfidf = TfidfVectorizer(stop_words='english', max_features=5000)
    
    # We need to fit on all text to build vocabulary
    all_text = pd.concat([df['resume_text'], df['jd_text']])
    tfidf.fit(all_text)
    
    # Transform and calculate similarity for each pair
    # This is slow if done one by one, but we can do it in batches or sparse matrix ops
    # For 1500 examples, loop is fine
    
    tfidf_sims = []
    resume_tfidf = tfidf.transform(df['resume_text'])
    jd_tfidf = tfidf.transform(df['jd_text'])
    
    # Calculate diagonal of dot product (cosine similarity since TfidfVectorizer output is normalized)
    # (A . B) / (|A|*|B|) -> if normalized, just A . B
    # sklearn TfidfVectorizer returns normalized vectors by default (norm='l2')
    
    # Efficient row-wise dot product
    tfidf_sims = np.asarray(resume_tfidf.multiply(jd_tfidf).sum(axis=1)).flatten()
    features['tfidf_similarity'] = tfidf_sims
    
    print(f"  ✓ TF-IDF Mean Similarity: {features['tfidf_similarity'].mean():.4f}")
    
    # 2. Semantic Similarity (Sentence Transformers)
    print("\n🧠 Calculating Semantic Similarity (all-MiniLM-L6-v2)...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Encode in batches
    resume_embeddings = model.encode(df['resume_text'].tolist(), show_progress_bar=True)
    jd_embeddings = model.encode(df['jd_text'].tolist(), show_progress_bar=True)
    
    # Calculate cosine similarity
    # (A . B) / (|A|*|B|)
    # SentenceTransformer embeddings are NOT normalized by default usually, but cosine_similarity handles it
    
    from sklearn.metrics.pairwise import paired_cosine_distances
    # paired_cosine_distances returns 1 - cos_sim
    cosine_dists = paired_cosine_distances(resume_embeddings, jd_embeddings)
    features['semantic_similarity'] = 1 - cosine_dists
    
    print(f"  ✓ Semantic Mean Similarity: {features['semantic_similarity'].mean():.4f}")
    
    # 3. Length Ratio
    features['len_ratio'] = df['resume_text'].apply(len) / df['jd_text'].apply(len)
    
    return features, tfidf, model


def train_model(X, y):
    """Train Gradient Boosting Regressor."""
    print("\n" + "=" * 80)
    print("TRAINING MODEL")
    print("=" * 80)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"📊 Training on {len(X_train)} samples")
    print(f"📊 Testing on {len(X_test)} samples")
    
    model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"\n✓ Model Performance:")
    print(f"  • MAE: {mae:.2f}")
    print(f"  • RMSE: {rmse:.2f}")
    print(f"  • R²: {r2:.3f}")
    
    return model


def save_artifacts(model, tfidf, feature_cols):
    """Save model and vectorizer."""
    print("\n" + "=" * 80)
    print("SAVING ARTIFACTS")
    print("=" * 80)
    
    models_dir = Path("data/models")
    models_dir.mkdir(parents=True, exist_ok=True)
    
    # Save Regressor
    joblib.dump(model, models_dir / "relevance_regressor.joblib")
    
    # Save TF-IDF Vectorizer
    joblib.dump(tfidf, models_dir / "tfidf_vectorizer.joblib")
    
    # Save Metadata
    metadata = {
        'feature_cols': feature_cols,
        'semantic_model': 'all-MiniLM-L6-v2',
        'version': '1.0'
    }
    with open(models_dir / "relevance_metadata.json", 'w') as f:
        json.dump(metadata, f, indent=2)
        
    print(f"✓ Saved artifacts to {models_dir}")


def main():
    df = load_data()
    
    # Extract features
    features, tfidf, semantic_model = extract_features(df)
    
    # Train
    model = train_model(features, df['ats_score'])
    
    # Save
    save_artifacts(model, tfidf, features.columns.tolist())
    
    print("\n" + "=" * 80)
    print("✓ MODE 2 TRAINING COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    main()
