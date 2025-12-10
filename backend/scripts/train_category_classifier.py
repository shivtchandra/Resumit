#!/usr/bin/env python3
"""
Train Category Classifier (Mode 2 Upgrade)
Uses ResuméAtlas to train a text classifier for Job Categories.
"""

import sys
from pathlib import Path
import pandas as pd
import joblib
from datasets import load_from_disk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

def train_category_classifier():
    print("=" * 80)
    print("TRAINING CATEGORY CLASSIFIER (ResuméAtlas)")
    print("=" * 80)
    
    # 1. Load Data
    try:
        ds_dict = load_from_disk("data/mode1/resume_atlas")
        if hasattr(ds_dict, 'keys'):
            ds = ds_dict['train']
        else:
            ds = ds_dict
    except Exception as e:
        print(f"❌ Failed to load dataset: {e}")
        return

    df = pd.DataFrame(ds)
    print(f"📊 Loaded {len(df)} examples")
    
    # Check columns
    # Expected: 'Category', 'Text' (or similar)
    # The inspection showed: 'Category', 'Text'
    
    if 'Category' not in df.columns or 'Text' not in df.columns:
        print(f"❌ Columns mismatch. Found: {df.columns}")
        return
        
    # 2. Preprocessing
    print("🧹 Preprocessing...")
    X = df['Text'].fillna("")
    y = df['Category']
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 3. Pipeline
    print("🧠 Training Model (TF-IDF + Logistic Regression)...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=5000, stop_words='english')),
        ('clf', LogisticRegression(max_iter=1000, class_weight='balanced'))
    ])
    
    pipeline.fit(X_train, y_train)
    
    # 4. Evaluate
    print("📉 Evaluating...")
    y_pred = pipeline.predict(X_test)
    print(classification_report(y_test, y_pred))
    
    # 5. Save
    models_dir = Path("data/models")
    models_dir.mkdir(exist_ok=True)
    
    model_path = models_dir / "category_classifier.joblib"
    joblib.dump(pipeline, model_path)
    print(f"✓ Saved model to {model_path}")

if __name__ == "__main__":
    train_category_classifier()
