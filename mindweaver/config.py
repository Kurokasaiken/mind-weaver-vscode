"""Configuration loading for Mind Weaver core."""
from pathlib import Path
from typing import Any, Dict
import yaml

DEFAULT_CONFIG_PATH = Path.home() / ".config" / "mindweaver" / "config.yaml"


class Config:
    def __init__(self, config_path: Path | None = None):
        self.path = config_path or DEFAULT_CONFIG_PATH
        self._data = self._load()

    def _load(self) -> Dict[str, Any]:
        if not self.path.exists():
            return {}
        return yaml.safe_load(self.path.read_text(encoding="utf-8")) or {}

    def get(self, key: str, default: Any = None) -> Any:
        return self._data.get(key, default)

    def providers(self) -> Dict[str, Any]:
        return self._data.get("providers", {})