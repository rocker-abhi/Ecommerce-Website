import os
import uuid
from typing import Dict, Set

from app.exceptions.file_handler_exceptions import UnsupportedFileType
from werkzeug.datastructures import FileStorage


class FileHandler:
    """Utility class to handle file operations securely and robustly on the local filesystem."""

    upload_root: str = "uploads"

    file_storage_config: Dict[str, Dict[str, any]] = {
        "product": {
            "folder": "products",
            "allowed_extensions": {"jpg", "jpeg", "png", "webp"},
        },
        "profile": {
            "folder": "profiles",
            "allowed_extensions": {"jpg", "jpeg", "png"},
        },
        "review": {
            "folder": "reviews",
            "allowed_extensions": {"jpg", "jpeg", "png", "webp"},
        },
        "category": {
            "folder": "categories",
            "allowed_extensions": {"jpg", "jpeg", "png"},
        },
    }

    @staticmethod
    def _generate_file_name(file_name: str) -> str:
        """Generates a secure unique file name using UUID while keeping the original extension.

        Args:
            file_name (str): Original file name.

        Returns:
            str: Generated unique file name.
        """
        if not file_name or "." not in file_name:
            return str(uuid.uuid4())
        file_extension = file_name.split(".")[-1].lower()
        return f"{uuid.uuid4()}.{file_extension}"

    @classmethod
    def save_file(cls, file: FileStorage, file_type: str) -> str:
        """Saves an uploaded file to the local filesystem under the appropriate directory structure.

        Args:
            file (FileStorage): The file object uploaded via Flask request.
            file_type (str): Key mapping to storage configuration (e.g., 'product').

        Raises:
            UnsupportedFileType: If file extension is not supported or type is invalid.
            ValueError: If file is empty or missing name.
            PermissionError: If path security validation fails.

        Returns:
            str: Relative path of the saved file.
        """
        config = cls.file_storage_config.get(file_type)
        if not config:
            raise UnsupportedFileType()

        folder = config["folder"]

        if not file or not file.filename or "." not in file.filename:
            raise UnsupportedFileType()

        extension = file.filename.rsplit(".", 1)[-1].lower()
        if extension not in config["allowed_extensions"]:
            raise UnsupportedFileType()

        # Build absolute directory path
        target_dir = os.path.join(cls.upload_root, folder)
        os.makedirs(target_dir, exist_ok=True)

        filename = f"{uuid.uuid4()}.{extension}"
        relative_path = os.path.join(folder, filename)
        absolute_path = os.path.join(cls.upload_root, relative_path)

        # Path traversal mitigation check
        base_dir = os.path.abspath(cls.upload_root)
        if not os.path.abspath(absolute_path).startswith(base_dir):
            raise PermissionError("Directory traversal attempt detected")

        file.save(absolute_path)
        return relative_path

    @classmethod
    def get_file_path(cls, relative_path: str) -> str:
        """Resolves a relative file path to an absolute path securely.

        Args:
            relative_path (str): The relative path of the file.

        Raises:
            PermissionError: If path resolution falls outside uploads directory.
            FileNotFoundError: If the file does not exist on disk.

        Returns:
            str: Absolute path to the file.
        """
        base_dir = os.path.abspath(cls.upload_root)
        absolute_path = os.path.abspath(os.path.join(cls.upload_root, relative_path))

        # Traversal protection check
        if not absolute_path.startswith(base_dir):
            raise PermissionError("Directory traversal attempt detected")

        if not os.path.exists(absolute_path):
            raise FileNotFoundError(f"File not found: {relative_path}")

        return absolute_path

    @classmethod
    def delete_file(cls, relative_path: str) -> bool:
        """Securely deletes a file from the uploads directory.

        Args:
            relative_path (str): Relative path of the file to delete.

        Returns:
            bool: True if deletion was successful, False otherwise.
        """
        try:
            absolute_path = cls.get_file_path(relative_path)
            if os.path.exists(absolute_path) and os.path.isfile(absolute_path):
                os.remove(absolute_path)
                return True
            return False
        except Exception:
            return False

    @classmethod
    def file_exists(cls, relative_path: str) -> bool:
        """Securely checks if a file exists in the uploads directory.

        Args:
            relative_path (str): Relative path to verify.

        Returns:
            bool: True if file exists and is a file, False otherwise.
        """
        try:
            absolute_path = cls.get_file_path(relative_path)
            return os.path.exists(absolute_path) and os.path.isfile(absolute_path)
        except Exception:
            return False
