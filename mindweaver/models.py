from pydantic import BaseModel
from typing import List, Optional


class Message(BaseModel):
    role: str
    content: str


class DeliberationRequest(BaseModel):
    prompt: str
    file_path: Optional[str] = None
    file_content: Optional[str] = None
    providers: Optional[List[str]] = None
    n_rounds: int = 1


class DeliberationResponse(BaseModel):
    result: str
    log: List[str]