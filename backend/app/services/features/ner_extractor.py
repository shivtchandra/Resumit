"""
NER Extractor (V3 Upgrade)
Uses pre-trained BERT model for Skill and Entity Extraction.
"""

from transformers import pipeline
import logging
import re

logger = logging.getLogger(__name__)

class NERExtractor:
    def __init__(self):
        self.ner_pipeline = None
        self._load_model()
        
    def _load_model(self):
        try:
            # Load pre-trained model for Resume NER
            # We use 'yashpwr/resume-ner-bert-v2' as identified in research
            self.ner_pipeline = pipeline(
                "ner", 
                model="yashpwr/resume-ner-bert-v2", 
                aggregation_strategy="simple"
            )
            logger.info("NER Model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load NER model: {e}")
            
    def extract_entities(self, text: str) -> dict:
        """
        Extract entities like Skills, Designation, Company, etc.
        Returns:
            {
                'skills': [],
                'designation': [],
                'company': [],
                'degree': [],
                'all_entities': []
            }
        """
        if not self.ner_pipeline:
            return {'skills': [], 'error': 'Model not loaded'}
            
        # Truncate text if too long (BERT limit is usually 512 tokens)
        # We'll process the first 2000 characters which usually covers Summary + Skills + Experience start
        processed_text = text[:2000]
        
        try:
            entities = self.ner_pipeline(processed_text)
        except Exception as e:
            logger.error(f"NER inference failed: {e}")
            return {'skills': [], 'error': str(e)}
            
        result = {
            'skills': [],
            'designation': [],
            'company': [],
            'degree': [],
            'all_entities': []
        }
        
        for entity in entities:
            label = entity['entity_group']
            word = entity['word']
            
            # Clean up BERT subword tokens (e.g. "Java", "##Script" -> "JavaScript")
            if word.startswith("##"):
                if result['all_entities']:
                    # Append to previous entity if it exists
                    prev = result['all_entities'][-1]
                    prev['word'] += word[2:]
                    # Update the specific list it belongs to
                    self._update_specific_list(result, prev['label'], prev['word'])
                continue

            result['all_entities'].append({'word': word, 'label': label, 'score': float(entity['score'])})
            
            self._update_specific_list(result, label, word)
            
        # Fallback/Augment with Keyword Extraction
        keyword_skills = self._extract_skills_by_keywords(text)
        result['skills'].extend(keyword_skills)
        
        # Deduplicate
        result['skills'] = list(set(result['skills']))
        result['designation'] = list(set(result['designation']))
        result['company'] = list(set(result['company']))
        result['degree'] = list(set(result['degree']))
        
        return result

    def _extract_skills_by_keywords(self, text: str) -> list:
        """
        Simple keyword matching for common tech skills to augment BERT model.
        """
        common_skills = {
            "Python", "Java", "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js", "Django", "Flask",
            "FastAPI", "Spring Boot", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker", "Kubernetes",
            "AWS", "Azure", "GCP", "Git", "CI/CD", "Jenkins", "Terraform", "Linux", "C++", "C#", ".NET",
            "Go", "Rust", "Swift", "Kotlin", "Flutter", "React Native", "HTML", "CSS", "SASS", "GraphQL",
            "REST API", "Microservices", "Machine Learning", "Deep Learning", "NLP", "TensorFlow", "PyTorch",
            "Pandas", "NumPy", "Scikit-learn", "Data Analysis", "Agile", "Scrum", "Jira"
        }
        
        found_skills = []
        text_lower = text.lower()
        
        for skill in common_skills:
            # Simple boundary check
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.append(skill)
                
        return found_skills

    def _update_specific_list(self, result, label, word):
        if label == 'SKILL' or label == 'Skills':
            if ',' in word:
                skills_list = [s.strip() for s in word.split(',')]
                result['skills'].extend(skills_list)
            else:
                result['skills'].append(word)
        elif label == 'DESIGNATION' or label == 'Designation':
            result['designation'].append(word)
        elif label == 'COMPANY' or label == 'Companies worked at':
            result['company'].append(word)
        elif label == 'DEGREE' or label == 'Degree':
            result['degree'].append(word)
