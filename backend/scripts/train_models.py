#!/usr/bin/env python3
"""
Train ML Models for ATS Resume Analysis
Trains classifiers on extracted features to predict ATS friendliness scores.
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import json

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))


def load_and_prepare_data():
    """Load features and prepare for training."""
    print("=" * 80)
    print("LOADING AND PREPARING DATA")
    print("=" * 80)
    
    # Load features
    features_path = Path("data/mode1/processed/features.csv")
    df = pd.read_csv(features_path)
    
    print(f"\n📊 Loaded {len(df)} samples")
    print(f"📋 Categories: {df['label'].unique()}")
    print(f"\n📈 Category Distribution:")
    print(df['label'].value_counts())
    
    # Parse risk_flags (it's stored as string representation of list)
    df['num_risk_flags'] = df['risk_flags'].apply(lambda x: len(eval(x)) if pd.notna(x) else 0)
    
    # Create target variable: ATS Friendliness Score
    # Based on FriendlinessClassifier logic
    penalties = {
        "IMAGE_BASED_PDF": 50,
        "Z_ORDER_FRAGMENTATION": 30,
        "FLOATING_OBJECTS": 20,
        "MISSING_EMAIL": 10,
        "MISSING_PHONE": 10,
        "POOR_SECTION_HEADERS": 15,
        "WORKDAY_PARSING_RISK": 10
    }
    
    def calculate_score(row):
        score = 100
        if pd.notna(row['risk_flags']):
            risks = eval(row['risk_flags'])
            for risk in risks:
                score -= penalties.get(risk, 5)
        return max(0, score)
    
    df['ats_score'] = df.apply(calculate_score, axis=1)
    
    # Create risk level categories
    def get_risk_level(score):
        if score >= 80:
            return "ATS_FRIENDLY"
        elif score >= 50:
            return "MODERATE_RISK"
        else:
            return "HIGH_RISK"
    
    df['risk_level'] = df['ats_score'].apply(get_risk_level)
    
    print(f"\n🎯 Risk Level Distribution:")
    print(df['risk_level'].value_counts())
    
    print(f"\n📊 ATS Score Statistics:")
    print(f"  Mean: {df['ats_score'].mean():.1f}")
    print(f"  Median: {df['ats_score'].median():.1f}")
    print(f"  Std: {df['ats_score'].std():.1f}")
    print(f"  Min: {df['ats_score'].min()}")
    print(f"  Max: {df['ats_score'].max()}")
    
    return df


def engineer_features(df):
    """Create additional features for ML models."""
    print("\n" + "=" * 80)
    print("FEATURE ENGINEERING")
    print("=" * 80)
    
    # Parse detected_sections
    df['num_sections'] = df['section_count']
    
    # Binary features
    df['has_email'] = df['email_found'].astype(int)
    df['has_phone'] = df['phone_found'].astype(int)
    df['has_contact_info'] = ((df['email_found']) | (df['phone_found'])).astype(int)
    
    # Z-order score (already numeric)
    df['z_order_score_normalized'] = df['z_order_score']
    
    # Word count features
    df['word_count_log'] = np.log1p(df['word_count'])
    
    # Feature list for training
    feature_cols = [
        'has_email',
        'has_phone',
        'has_contact_info',
        'num_sections',
        'z_order_score',
        'floating_objects',
        'is_image_based',
        'word_count',
        'word_count_log',
        'num_risk_flags'
    ]
    
    print(f"\n✓ Created {len(feature_cols)} features:")
    for col in feature_cols:
        print(f"  • {col}")
    
    return df, feature_cols


def train_risk_level_classifier(df, feature_cols):
    """Train classifier to predict risk level (3 classes)."""
    print("\n" + "=" * 80)
    print("TRAINING RISK LEVEL CLASSIFIER")
    print("=" * 80)
    
    # Prepare data
    X = df[feature_cols]
    y = df['risk_level']
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"\n📊 Training set: {len(X_train)} samples")
    print(f"📊 Test set: {len(X_test)} samples")
    
    # Train Random Forest
    print("\n🌲 Training Random Forest...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight='balanced'
    )
    rf_model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = rf_model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n✓ Random Forest Accuracy: {accuracy:.3f}")
    print("\n📊 Classification Report:")
    print(classification_report(y_test, y_pred))
    
    print("\n📊 Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': rf_model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\n🔍 Feature Importance:")
    for idx, row in feature_importance.iterrows():
        print(f"  • {row['feature']}: {row['importance']:.4f}")
    
    return rf_model, feature_importance


def train_score_regressor(df, feature_cols):
    """Train regressor to predict ATS score (0-100)."""
    print("\n" + "=" * 80)
    print("TRAINING ATS SCORE REGRESSOR")
    print("=" * 80)
    
    from sklearn.ensemble import GradientBoostingRegressor
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    
    # Prepare data
    X = df[feature_cols]
    y = df['ats_score']
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"\n📊 Training set: {len(X_train)} samples")
    print(f"📊 Test set: {len(X_test)} samples")
    
    # Train Gradient Boosting
    print("\n🚀 Training Gradient Boosting Regressor...")
    gb_model = GradientBoostingRegressor(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42
    )
    gb_model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = gb_model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"\n✓ Gradient Boosting Performance:")
    print(f"  • MAE: {mae:.2f}")
    print(f"  • RMSE: {rmse:.2f}")
    print(f"  • R²: {r2:.3f}")
    
    # Show some predictions
    print("\n📊 Sample Predictions:")
    sample_indices = np.random.choice(len(y_test), 5, replace=False)
    for idx in sample_indices:
        actual = y_test.iloc[idx]
        predicted = y_pred[idx]
        print(f"  • Actual: {actual:.0f}, Predicted: {predicted:.0f}, Diff: {abs(actual-predicted):.1f}")
    
    return gb_model


def save_models(rf_model, gb_model, feature_cols, feature_importance):
    """Save trained models and metadata."""
    print("\n" + "=" * 80)
    print("SAVING MODELS")
    print("=" * 80)
    
    # Create models directory
    models_dir = Path("data/models")
    models_dir.mkdir(parents=True, exist_ok=True)
    
    # Save models
    rf_path = models_dir / "risk_level_classifier.joblib"
    gb_path = models_dir / "ats_score_regressor.joblib"
    
    joblib.dump(rf_model, rf_path)
    joblib.dump(gb_model, gb_path)
    
    print(f"\n✓ Saved Risk Level Classifier to: {rf_path}")
    print(f"✓ Saved ATS Score Regressor to: {gb_path}")
    
    # Save metadata
    metadata = {
        'feature_cols': feature_cols,
        'feature_importance': feature_importance.to_dict('records'),
        'model_type': 'RandomForest + GradientBoosting',
        'training_samples': 200,
        'version': '1.0'
    }
    
    metadata_path = models_dir / "model_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✓ Saved metadata to: {metadata_path}")
    
    return rf_path, gb_path


def main():
    """Main training pipeline."""
    print("\n" + "=" * 80)
    print("ATS RESUME ANALYSIS - ML MODEL TRAINING")
    print("=" * 80)
    
    # Load data
    df = load_and_prepare_data()
    
    # Engineer features
    df, feature_cols = engineer_features(df)
    
    # Train classifiers
    rf_model, feature_importance = train_risk_level_classifier(df, feature_cols)
    gb_model = train_score_regressor(df, feature_cols)
    
    # Save models
    save_models(rf_model, gb_model, feature_cols, feature_importance)
    
    print("\n" + "=" * 80)
    print("✓ TRAINING COMPLETE!")
    print("=" * 80)
    print("\nNext steps:")
    print("  1. Review model performance metrics above")
    print("  2. Update FriendlinessClassifier to use trained models")
    print("  3. Run batch_analysis.py to compare heuristic vs ML performance")
    print("=" * 80)


if __name__ == "__main__":
    main()
