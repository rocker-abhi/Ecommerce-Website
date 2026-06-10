import os
import uuid

from app.exceptions.file_handler_exceptions import UnsupportedFileType
from werkzeug.datastructures import FileStorage


class FileHandler:
    upload_root = "uploads"

    file_storage_config = {
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
        file_extension = file_name.split(".")[-1]
        return f"{uuid.uuid4()}.{file_extension}"

    @classmethod
    def save_file(
        cls,
        file: FileStorage,
        file_type: str,
    ) -> str:

        config = cls.file_storage_config.get(file_type)

        if not config:
            raise UnsupportedFileType()

        folder = config["folder"]

        extension = file.filename.rsplit(".", 1)[-1].lower()

        if extension not in config["allowed_extensions"]:
            raise UnsupportedFileType()

        os.makedirs(
            os.path.join(
                cls.upload_root,
                folder,
            ),
            exist_ok=True,
        )

        filename = f"{uuid.uuid4()}.{extension}"

        relative_path = os.path.join(
            folder,
            filename,
        )

        absolute_path = os.path.join(
            cls.upload_root,
            relative_path,
        )

        file.save(absolute_path)

        return relative_path

    @classmethod
    def get_file_path(cls, relative_path: str) -> str:
        absolute_path = os.path.join(cls.upload_root, relative_path)
        if not os.path.exists(absolute_path):
            raise FileNotFoundError(f"File not found: {relative_path}")
        return absolute_path
