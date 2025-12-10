"""
Category Predictor (V3 Upgrade)
Predicts job category using model trained on ResuméAtlas.
"""

import joblib
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class CategoryPredictor:
    def __init__(self):
        self.model = None
        self._load_model()
        
    def _load_model(self):
        try:
            model_path = Path(__file__).parent.parent.parent.parent / "data" / "models" / "category_classifier.joblib"
            if model_path.exists():
                self.model = joblib.load(model_path)
                logger.info("Category Classifier loaded successfully")
            else:
                logger.warning(f"Category Classifier not found at {model_path}")
        except Exception as e:
            logger.error(f"Failed to load Category Classifier: {e}")
            
    def predict(self, text: str) -> dict:
        """
        Predict job category.
        Returns:
            {
                'category': str,
                'confidence': float
            }
        """
        if not self.model:
            return {'category': 'Unknown', 'confidence': 0.0}
            
        try:
            # Predict
            category = self.model.predict([text])[0]
            # Get probability
            proba = self.model.predict_proba([text]).max()
            
            return {
                'category': category,
                'confidence': round(float(proba), 2)
            }
        except Exception as e:
            logger.error(f"Category prediction failed: {e}")
            return {'category': 'Error', 'confidence': 0.0}
