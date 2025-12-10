"""
ML-powered ATS Friendliness Classifier
Uses trained Random Forest and Gradient Boosting models for predictions.
"""

import joblib
import json
from pathlib import Path
import numpy as np


class MLFriendlinessClassifier:
    """ML-based classifier using trained models."""
    
    def __init__(self, use_ml=True):
        """
        Initialize classifier.
        
        Args:
            use_ml: If True, use ML models. If False, fall back to heuristic.
        """
        self.use_ml = use_ml
        self.models_loaded = False
        
        # Heuristic penalties (fallback)
        self.penalties = {
            "IMAGE_BASED_PDF": 50,
            "Z_ORDER_FRAGMENTATION": 30,
            "FLOATING_OBJECTS": 20,
            "MISSING_EMAIL": 10,
            "MISSING_PHONE": 10,
            "POOR_SECTION_HEADERS": 15,
            "WORKDAY_PARSING_RISK": 10
        }
        
        # Advice Map
        self.advice_map = {
            "IMAGE_BASED_PDF": "Resume is an image. Most ATS parsers will fail to read this. Use a standard text-based PDF or DOCX.",
            "Z_ORDER_FRAGMENTATION": "Text selection order is scrambled. This confuses parsers about which text belongs to which section.",
            "FLOATING_OBJECTS": "Detected text boxes or floating elements. Legacy parsers (like Taleo) often ignore these.",
            "MISSING_EMAIL": "No email address detected. You may be auto-rejected as 'uncontactable'.",
            "MISSING_PHONE": "No phone number detected.",
            "POOR_SECTION_HEADERS": "Could not detect standard sections (Experience, Education). Use standard headers.",
            "TALEO_TABLE_RISK": "Taleo ATS struggles with tables. We detected potential table structures. Use a single-column layout.",
            "ICIMS_FRAGMENTATION_RISK": "iCIMS ATS requires very simple layouts. Your resume has high fragmentation risk.",
            "WORKDAY_PARSING_RISK": "Workday requires standard job titles and section headers. Ensure you use 'Work Experience' explicitly.",
            "DETECTED_TEXT_TABLES": "We detected text-based tables (using pipes '|' or tabs). These can break parsing. Use bullet points instead.",
            "EMPLOYMENT_GAPS": "We detected potential employment gaps. Be prepared to explain them or ensure dates are formatted correctly.",
            "NO_DATES_FOUND": "We could not find any employment dates. Ensure you use standard formats like 'Jan 2020' or '01/2020'."
        }
        
        if use_ml:
            self._load_models()
    
    def _load_models(self):
        """Load trained ML models."""
        try:
            # Get path to backend/data/models
            models_dir = Path(__file__).parent.parent.parent.parent / "data" / "models"
            
            # Load models
            self.rf_model = joblib.load(models_dir / "risk_level_classifier.joblib")
            self.gb_model = joblib.load(models_dir / "ats_score_regressor.joblib")
            
            # Load metadata
            with open(models_dir / "model_metadata.json", 'r') as f:
                self.metadata = json.load(f)
            
            self.feature_cols = self.metadata['feature_cols']
            self.models_loaded = True
            
        except Exception as e:
            print(f"Warning: Could not load ML models: {e}")
            print("Falling back to heuristic classifier")
            self.use_ml = False
            self.models_loaded = False
    
    def _extract_ml_features(self, features: dict):
        """Extract features in the format expected by ML models."""
        import pandas as pd
        
        # Parse risk flags
        risk_flags = features.get("risk_flags", [])
        num_risk_flags = len(risk_flags)
        
        # Create feature vector
        feature_vector = {
            'has_email': int(features.get('email_found', False)),
            'has_phone': int(features.get('phone_found', False)),
            'has_contact_info': int(features.get('email_found', False) or features.get('phone_found', False)),
            'num_sections': features.get('section_count', 0),
            'z_order_score': features.get('z_order_score', 0.0),
            'floating_objects': features.get('floating_objects', 0),
            'is_image_based': int(features.get('is_image_based', False)),
            'word_count': features.get('word_count', 0),
            'word_count_log': np.log1p(features.get('word_count', 0)),
            'num_risk_flags': num_risk_flags
        }
        
        # Return as DataFrame with correct column order
        return pd.DataFrame([feature_vector])[self.feature_cols]
    
    def predict(self, features: dict):
        """
        Predict ATS Friendliness Score.
        
        Args:
            features: Dictionary of extracted features
            
        Returns:
            Dictionary with score, risk_level, and issues
        """
        # Use ML if available
        if self.use_ml and self.models_loaded:
            return self._predict_ml(features)
        else:
            return self._predict_heuristic(features)
    
    def _predict_ml(self, features: dict):
        """Predict using ML models."""
        # Extract features
        X = self._extract_ml_features(features)
        
        # Predict score
        score = float(self.gb_model.predict(X)[0])
        score = max(0, min(100, score))  # Clamp to [0, 100]
        
        # Predict risk level
        risk_level = self.rf_model.predict(X)[0]
        
        # Get issues from risk flags
        risks = features.get("risk_flags", [])
        issues = []
        for risk in risks:
            penalty = self.penalties.get(risk, 5)
            issues.append({
                "type": risk,
                "penalty": penalty,
                "message": self._get_message(risk)
            })
        
        # Prepare advice list for ML path as well
        advice_list = []
        risks = features.get("risk_flags", [])
        for risk in risks:
             if risk in self.advice_map:
                advice_list.append(self.advice_map[risk])

        return {
            "score": round(score),
            "risk_level": risk_level,
            "issues": issues,
            "advice": advice_list,
            "model_type": "ML"
        }
    
    def _predict_heuristic(self, features: dict):
        """
        Fallback heuristic prediction (original logic).
        """
        score = 100
        risks = features.get("risk_flags", [])
        issues = []
        advice_list = []

        for risk in risks:
            penalty = self.penalties.get(risk, 5)
            score -= penalty
            issues.append({
                "type": risk,
                "penalty": penalty,
                "message": self._get_message(risk)
            })
            
            # Add Advice
            if risk in self.advice_map:
                advice_list.append(self.advice_map[risk])

        # Cap score
        score = max(0, score)
        
        # Determine Level
        if score >= 80:
            level = "ATS_FRIENDLY"
        elif score >= 50:
            level = "MODERATE_RISK"
        else:
            level = "HIGH_RISK"

        return {
            "score": score,
            "risk_level": level,
            "issues": issues,
            "advice": advice_list, # New field
            "model_type": "Heuristic"
        }

    def _get_message(self, risk):
        """Get human-readable message for risk code."""
        messages = {
            "IMAGE_BASED_PDF": "Resume is an image. Most ATS parsers will fail to read this. Use a standard text-based PDF or DOCX.",
            "Z_ORDER_FRAGMENTATION": "Text selection order is scrambled. This confuses parsers about which text belongs to which section.",
            "FLOATING_OBJECTS": "Detected text boxes or floating elements. Legacy parsers (like Taleo) often ignore these.",
            "MISSING_EMAIL": "No email address detected. You may be auto-rejected as 'uncontactable'.",
            "MISSING_PHONE": "No phone number detected.",
            "POOR_SECTION_HEADERS": "Could not detect standard sections (Experience, Education). Use standard headers.",
            "TALEO_TABLE_RISK": "Taleo ATS struggles with tables. We detected potential table structures. Use a single-column layout.",
            "ICIMS_FRAGMENTATION_RISK": "iCIMS ATS requires very simple layouts. Your resume has high fragmentation risk.",
            "WORKDAY_PARSING_RISK": "Workday requires standard job titles and section headers. Ensure you use 'Work Experience' explicitly.",
            "DETECTED_TEXT_TABLES": "We detected text-based tables (using pipes '|' or tabs). These can break parsing. Use bullet points instead.",
            "EMPLOYMENT_GAPS": "We detected potential employment gaps. Be prepared to explain them or ensure dates are formatted correctly.",
            "NO_DATES_FOUND": "We could not find any employment dates. Ensure you use standard formats like 'Jan 2020' or '01/2020'."
        }
        return messages.get(risk, "Unknown Issue")
