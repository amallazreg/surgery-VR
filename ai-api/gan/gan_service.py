import torch
import torch.nn as nn
import numpy as np
from PIL import Image
import io
import base64
import os
from huggingface_hub import hf_hub_download

DEVICE = torch.device("cpu")

HF_REPO_ID = "amallazreg/surgery-vr-models"

# Architecture UNet
class UNetBlock(nn.Module):
    def __init__(self, in_ch, out_ch, down=True,
                 use_bn=True, dropout=False):
        super().__init__()
        layers = []
        if down:
            layers.append(
                nn.Conv2d(in_ch, out_ch, 4, 2, 1, bias=False)
            )
        else:
            layers.append(
                nn.ConvTranspose2d(in_ch, out_ch, 4, 2, 1, bias=False)
            )
        if use_bn:
            layers.append(nn.BatchNorm2d(out_ch))
        if dropout:
            layers.append(nn.Dropout(0.5))
        self.block      = nn.Sequential(*layers)
        self.activation = nn.LeakyReLU(0.2) if down else nn.ReLU()

    def forward(self, x):
        return self.activation(self.block(x))


class Generator(nn.Module):
    def __init__(self):
        super().__init__()
        self.e1 = UNetBlock(3,   64,  down=True, use_bn=False)
        self.e2 = UNetBlock(64,  128, down=True)
        self.e3 = UNetBlock(128, 256, down=True)
        self.e4 = UNetBlock(256, 512, down=True)
        self.e5 = UNetBlock(512, 512, down=True)
        self.e6 = UNetBlock(512, 512, down=True)
        self.e7 = UNetBlock(512, 512, down=True)
        self.bottleneck = nn.Sequential(
            nn.Conv2d(512, 512, 4, 2, 1), nn.ReLU()
        )
        self.d1 = UNetBlock(512,  512, down=False, dropout=True)
        self.d2 = UNetBlock(1024, 512, down=False, dropout=True)
        self.d3 = UNetBlock(1024, 512, down=False, dropout=True)
        self.d4 = UNetBlock(1024, 512, down=False)
        self.d5 = UNetBlock(1024, 256, down=False)
        self.d6 = UNetBlock(512,  128, down=False)
        self.d7 = UNetBlock(256,  64,  down=False)
        self.final = nn.Sequential(
            nn.ConvTranspose2d(128, 3, 4, 2, 1), nn.Tanh()
        )

    def forward(self, x):
        e1 = self.e1(x)
        e2 = self.e2(e1)
        e3 = self.e3(e2)
        e4 = self.e4(e3)
        e5 = self.e5(e4)
        e6 = self.e6(e5)
        e7 = self.e7(e6)
        b  = self.bottleneck(e7)
        d1 = self.d1(b)
        d2 = self.d2(torch.cat([d1, e7], dim=1))
        d3 = self.d3(torch.cat([d2, e6], dim=1))
        d4 = self.d4(torch.cat([d3, e5], dim=1))
        d5 = self.d5(torch.cat([d4, e4], dim=1))
        d6 = self.d6(torch.cat([d5, e3], dim=1))
        d7 = self.d7(torch.cat([d6, e2], dim=1))
        return self.final(torch.cat([d7, e1], dim=1))


# ============================================================
# Mapping procédure → modèle
# ============================================================
PROCEDURE_CONFIG = {
    "rhinoplastie": {
        "model_file": "unet_nose_ep30.pth",      # ← epoch 30
        "available":  True,
        "label":      "Rhinoplastie"
    },
    "blepharoplastie": {
        "model_file": "unet_eyebrow_ep30.pth",   # ← à uploader
        "available":  False,                      # ← False jusqu'à upload
        "label":      "Blépharoplastie"
    },
    "lifting": {
        "model_file": None,
        "available":  False,
        "label":      "Lifting Facial"
    },
    "augmentation_levres": {
        "model_file": None,
        "available":  False,
        "label":      "Augmentation des lèvres"
    },
    "aucune_intervention": {
        "model_file": None,
        "available":  False,
        "label":      "Aucune intervention"
    },
}

# Cache des modèles en mémoire
_models_cache: dict = {}
CACHE_DIR = os.path.join(os.path.dirname(__file__), "models_cache")


def get_model_path(filename: str) -> str:
    os.makedirs(CACHE_DIR, exist_ok=True)
    local_path = os.path.join(CACHE_DIR, filename)

    if os.path.exists(local_path):
        print(f"Modèle en cache : {filename}")
        return local_path

    print(f"Téléchargement depuis HuggingFace : {filename}")
    hf_hub_download(
        repo_id=HF_REPO_ID,
        filename=filename,
        local_dir=CACHE_DIR,
        token=os.getenv("HF_TOKEN")
    )
    return local_path


def load_model(model_path: str) -> Generator:
    if model_path in _models_cache:
        return _models_cache[model_path]

    print(f"Chargement du modèle : {model_path}")
    model = Generator().to(DEVICE)
    state_dict = torch.load(model_path, map_location=DEVICE)
    model.load_state_dict(state_dict)
    model.eval()
    _models_cache[model_path] = model
    print("Modèle chargé !")
    return model


def preprocess_image(image_bytes: bytes) -> torch.Tensor:
    img    = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img    = img.resize((256, 256))
    arr    = np.array(img).astype(np.float32) / 127.5 - 1.0
    tensor = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)
    return tensor.to(DEVICE)


def tensor_to_base64(tensor: torch.Tensor) -> str:
    arr = tensor.squeeze(0).permute(1, 2, 0).cpu().detach().numpy()
    arr = ((arr + 1) * 127.5).clip(0, 255).astype(np.uint8)
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def image_to_base64(image_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((256, 256))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def generate_simulation(image_bytes: bytes, procedure: str) -> dict:
    config = PROCEDURE_CONFIG.get(procedure)

    if not config:
        return {
            "success": False,
            "error":   f"Procédure inconnue : {procedure}"
        }

    if not config["available"]:
        return {
            "success":   False,
            "available": False,
            "procedure": procedure,
            "label":     config["label"],
            "message":   f"La simulation pour '{config['label']}' sera disponible prochainement."
        }

    try:
        model_path = get_model_path(config["model_file"])
        model      = load_model(model_path)
        tensor     = preprocess_image(image_bytes)

        with torch.no_grad():
            output = model(tensor)

        return {
            "success":    True,
            "available":  True,
            "procedure":  procedure,
            "label":      config["label"],
            "before_b64": image_to_base64(image_bytes),
            "after_b64":  tensor_to_base64(output),
        }

    except Exception as e:
        return {
            "success": False,
            "error":   str(e)
        }
