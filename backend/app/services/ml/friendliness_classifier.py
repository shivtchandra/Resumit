class FriendlinessClassifier:
    def __init__(self):
        # Deductions map
        self.penalties = {
            "IMAGE_BASED_PDF": 50,
            "Z_ORDER_FRAGMENTATION": 30,
            "FLOATING_OBJECTS": 20,
            "MISSING_EMAIL": 10,
            "MISSING_PHONE": 10,
            "POOR_SECTION_HEADERS": 15,
            "WORKDAY_PARSING_RISK": 10
        }

    def predict(self, features: dict):
        """
        Calculates ATS Friendliness Score (0-100) based on features.
        """
        score = 100
        risks = features.get("risk_flags", [])
        issues = []

        for risk in risks:
            penalty = self.penalties.get(risk, 5)
            score -= penalty
            issues.append({
                "type": risk,
                "penalty": penalty,
                "message": self._get_message(risk)
            })

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
            "issues": issues
        }

    def _get_message(self, risk_code):
        messages = {
            "IMAGE_BASED_PDF": "Resume is an image. Most ATS parsers will fail to read this. Use a standard text-based PDF or DOCX.",
            "Z_ORDER_FRAGMENTATION": "Text selection order is scrambled. This confuses parsers about which text belongs to which section.",
            "FLOATING_OBJECTS": "Detected text boxes or floating elements. Legacy parsers (like Taleo) often ignore these.",
            "MISSING_EMAIL": "No email address detected. You may be auto-rejected as 'uncontactable'.",
            "MISSING_PHONE": "No phone number detected.",
            "POOR_SECTION_HEADERS": "Could not detect standard section headers (Experience, Education). Use standard terms.",
            "WORKDAY_PARSING_RISK": "Structure may cause issues with Workday's strict field mapping."
        }
        return messages.get(risk_code, "Unknown parsing risk detected.")
