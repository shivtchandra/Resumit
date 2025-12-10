"""
Audit Logger for Resume Rewrite Operations
Logs all rewrite operations for compliance (Local Law 144) and bias auditing.
"""

import json
import os
import logging
from datetime import datetime
from typing import Dict, Any, List
from pathlib import Path

logger = logging.getLogger(__name__)


class AuditLogger:
    def __init__(self, log_dir: str = "logs/audit"):
        """
        Initialize audit logger.
        
        Args:
            log_dir: Directory to store audit logs
        """
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Audit logger initialized. Logs will be saved to: {self.log_dir}")
    
    def log_rewrite_operation(
        self,
        user_id: str,
        original_text: str,
        rewritten_text: str,
        prompts: List[str],
        model_responses: List[str],
        before_score: float,
        after_score: float,
        metadata: Dict[str, Any] = None
    ) -> str:
        """
        Log a complete rewrite operation.
        
        Args:
            user_id: User identifier
            original_text: Original resume text
            rewritten_text: Rewritten resume text
            prompts: List of prompts sent to AI
            model_responses: List of model responses
            before_score: Score before rewrite
            after_score: Score after rewrite
            metadata: Additional metadata
            
        Returns:
            Path to log file
        """
        timestamp = datetime.utcnow()
        log_entry = {
            "timestamp": timestamp.isoformat(),
            "user_id": user_id,
            "operation": "resume_rewrite",
            "model": "gemini-1.5-pro",
            "original_text": original_text,
            "rewritten_text": rewritten_text,
            "prompts": prompts,
            "model_responses": model_responses,
            "scores": {
                "before": before_score,
                "after": after_score,
                "improvement": after_score - before_score
            },
            "metadata": metadata or {}
        }
        
        # Save to daily log file
        log_filename = f"rewrite_{timestamp.strftime('%Y%m%d')}.jsonl"
        log_path = self.log_dir / log_filename
        
        try:
            with open(log_path, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
            
            logger.info(f"Logged rewrite operation to {log_path}")
            return str(log_path)
        except Exception as e:
            logger.error(f"Failed to write audit log: {e}")
            raise
    
    def log_section_rewrite(
        self,
        user_id: str,
        section_type: str,
        original_content: str,
        rewritten_content: str,
        prompt: str,
        model_response: str,
        metadata: Dict[str, Any] = None
    ) -> str:
        """
        Log a single section rewrite.
        
        Args:
            user_id: User identifier
            section_type: Type of section (EXPERIENCE, SUMMARY, etc.)
            original_content: Original section content
            rewritten_content: Rewritten section content
            prompt: Prompt sent to AI
            model_response: Model response
            metadata: Additional metadata
            
        Returns:
            Path to log file
        """
        timestamp = datetime.utcnow()
        log_entry = {
            "timestamp": timestamp.isoformat(),
            "user_id": user_id,
            "operation": "section_rewrite",
            "section_type": section_type,
            "model": "gemini-1.5-pro",
            "original_content": original_content,
            "rewritten_content": rewritten_content,
            "prompt": prompt,
            "model_response": model_response,
            "metadata": metadata or {}
        }
        
        # Save to daily log file
        log_filename = f"rewrite_{timestamp.strftime('%Y%m%d')}.jsonl"
        log_path = self.log_dir / log_filename
        
        try:
            with open(log_path, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
            
            logger.info(f"Logged section rewrite to {log_path}")
            return str(log_path)
        except Exception as e:
            logger.error(f"Failed to write audit log: {e}")
            raise
    
    def get_logs_for_date(self, date: datetime) -> List[Dict[str, Any]]:
        """
        Retrieve all logs for a specific date.
        
        Args:
            date: Date to retrieve logs for
            
        Returns:
            List of log entries
        """
        log_filename = f"rewrite_{date.strftime('%Y%m%d')}.jsonl"
        log_path = self.log_dir / log_filename
        
        if not log_path.exists():
            return []
        
        logs = []
        try:
            with open(log_path, 'r') as f:
                for line in f:
                    if line.strip():
                        logs.append(json.loads(line))
            return logs
        except Exception as e:
            logger.error(f"Failed to read audit logs: {e}")
            return []
    
    def get_logs_for_user(self, user_id: str, start_date: datetime = None, end_date: datetime = None) -> List[Dict[str, Any]]:
        """
        Retrieve all logs for a specific user.
        
        Args:
            user_id: User identifier
            start_date: Start date (optional)
            end_date: End date (optional)
            
        Returns:
            List of log entries for the user
        """
        all_logs = []
        
        # If no date range specified, check all log files
        if start_date is None or end_date is None:
            log_files = list(self.log_dir.glob("rewrite_*.jsonl"))
        else:
            # Generate list of dates in range
            current_date = start_date
            log_files = []
            while current_date <= end_date:
                log_filename = f"rewrite_{current_date.strftime('%Y%m%d')}.jsonl"
                log_path = self.log_dir / log_filename
                if log_path.exists():
                    log_files.append(log_path)
                current_date += timedelta(days=1)
        
        # Read and filter logs
        for log_file in log_files:
            try:
                with open(log_file, 'r') as f:
                    for line in f:
                        if line.strip():
                            entry = json.loads(line)
                            if entry.get("user_id") == user_id:
                                all_logs.append(entry)
            except Exception as e:
                logger.error(f"Failed to read log file {log_file}: {e}")
        
        return all_logs
