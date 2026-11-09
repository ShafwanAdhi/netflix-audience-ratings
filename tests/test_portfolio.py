"""Portfolio evidence, initial HTML and regeneration contracts."""
import importlib.util
import json
import struct
from html.parser import HTMLParser

import pytest
from fastapi.testclient import TestClient
from netflix_api.main import create_app
from netflix_ml.shared.io import root


class Head(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.meta = {}
        self.canonical = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            self.meta[attrs.get("property", attrs.get("name"))] = attrs.get("content")
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical.append(attrs.get("href"))


def test_initial_html_and_preview_without_javascript():
    config = json.loads((root() / "apps/web/project-meta.json").read_text(encoding="utf-8"))
    assert (root() / "apps/web/dist/assets").exists(), "Build the frontend before testing static delivery"
    with TestClient(create_app(load_model=False)) as client:
        for route, item in config["routes"].items():
            response = client.get(route + "?group=movies#ignored")
            assert response.status_code == 200
            head = Head(response.text)
            url = config["origin"] + route
            assert head.canonical == [url]
            assert head.meta["og:url"] == url
            assert head.meta["description"] == item["description"]
            assert head.meta["og:title"] == item["label"] + " · " + config["name"]
            assert head.meta["twitter:card"] == "summary_large_image"
            assert head.meta["og:image"] == config["origin"] + "/social-preview.png"
            assert response.text.count('property="og:title"') == 1
            assert head.meta["twitter:description"] == item["description"]
        image = client.get("/social-preview.png")
        assert image.status_code == 200
        assert image.headers["content-type"].startswith("image/png")
        assert struct.unpack(">II", image.content[16:24]) == (1200, 630)
        assert client.get("/api/v1/does-not-exist").status_code == 404
        assert client.get("/%2e%2e/project.json").headers["content-type"].startswith("text/html")


def test_provenance_is_run_bound_and_preserves_unknowns(monkeypatch, tmp_path):
    from netflix_api import dataset
    profile = json.loads((root() / "reports/dataset-profile.json").read_text(encoding="utf-8"))
    record = json.loads((root() / "data/provenance.json").read_text(encoding="utf-8"))
    assert profile["provenance"] == record
    assert record["verification_status"] == "Upstream source unverified"
    assert record["redistribution_status"] == "Redistribution permission unverified"
    assert record["upstream_url"] is record["license"] is record["acquired_at"] is None
    (tmp_path / "reports").mkdir()
    with TestClient(create_app()) as client:
        response = client.get("/api/v1/dataset")
        assert response.status_code == 200
        assert response.json()["provenance"]["source_sha256"] == profile["source_sha256"]
        profile["provenance"]["source_sha256"] = "wrong"
        (tmp_path / "reports/dataset-profile.json").write_text(json.dumps(profile), encoding="utf-8")
        monkeypatch.setattr(dataset, "root", lambda: tmp_path)
        assert client.get("/api/v1/dataset").status_code == 503


def test_readme_refresh_rejects_stale_run_and_source(monkeypatch):
    path = root() / "scripts/refresh_readme.py"
    spec = importlib.util.spec_from_file_location("readme_results", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    expected = module.render()
    readme = (root() / "README.md").read_text(encoding="utf-8")
    assert readme.split(module.START)[1].split(module.END)[0] == "\n" + expected
    read = module.read
    def stale(path):
        data = read(path)
        if path.name == "dataset-profile.json":
            data["run_id"] = "stale"
        return data
    monkeypatch.setattr(module, "read", stale)
    with pytest.raises(ValueError, match="active run"):
        module.render()
    def wrong_source(path):
        data = read(path)
        if path.name == "provenance.json":
            data["source_sha256"] = "wrong"
        return data
    monkeypatch.setattr(module, "read", wrong_source)
    with pytest.raises(ValueError, match="hash mismatch"):
        module.render()
