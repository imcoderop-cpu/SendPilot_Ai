import json
import os
import time
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.main import app
from backend.services.prompts import TASK_PROMPTS


class AIEndpointTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_chat_returns_standardized_response(self) -> None:
        result = {"message": "Review the unused seats first.", "data": {"priority": "high"}}
        with patch("backend.routes.ai.generate_feature_response", return_value=result) as generate:
            response = self.client.post(
                "/api/chat",
                json={
                    "message": "Where can we save?",
                    "history": [],
                    "context": {"metrics": {"monthly_saas_spend": 1000}},
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"success": True, **result},
        )
        self.assertEqual(generate.call_args.args[0], "chat")

    def test_invalid_chat_body_uses_standardized_error(self) -> None:
        response = self.client.post(
            "/api/chat",
            json={"message": "   ", "context": {}},
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["success"], False)
        self.assertTrue(response.json()["message"])
        self.assertEqual(response.json()["data"], {})

    def test_large_context_is_rejected(self) -> None:
        response = self.client.post(
            "/api/ai-cfo",
            json={"context": {"payload": "x" * 25_000}},
        )

        self.assertEqual(response.status_code, 422)
        self.assertFalse(response.json()["success"])

    def test_feature_endpoints_share_response_contract(self) -> None:
        feature_paths = (
            "/api/ai-cfo",
            "/api/subscription-doctor",
            "/api/executive-summary",
            "/api/business-impact",
            "/api/ai-negotiator",
            "/api/recommendations",
            "/api/financial-insights",
        )
        with patch(
            "backend.routes.ai.generate_feature_response",
            return_value={"message": "Analysis complete.", "data": {"items": []}},
        ):
            for path in feature_paths:
                with self.subTest(path=path):
                    response = self.client.post(path, json={"context": {"metrics": {}}})
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(response.json()["success"], True)
                    self.assertEqual(response.json()["message"], "Analysis complete.")
                    self.assertEqual(response.json()["data"], {"items": []})

    def test_specialized_chat_routes_accept_and_forward_questions(self) -> None:
        with patch(
            "backend.routes.ai.generate_feature_response",
            return_value={"message": "Financial insight.", "data": {}},
        ) as generate:
            response = self.client.post(
                    "/api/financial-insights",
                    json={"question": "Can you estimate runway?", "context": {"metrics": {}}},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(generate.call_args.kwargs["message"], "Can you estimate runway?")

    def test_missing_openrouter_key_returns_friendly_error(self) -> None:
        from backend.services import openrouter_service

        openrouter_service.reset_client_for_tests()
        getenv = os.getenv

        def without_api_key(name: str, default: str | None = None) -> str | None:
            if name == "OPENROUTER_API_KEY":
                return None
            return getenv(name, default)

        with (
            patch("backend.services.openrouter_service._load_environment"),
            patch("backend.services.openrouter_service.os.getenv", side_effect=without_api_key),
            patch("backend.routes.ai.generate_feature_response", wraps=openrouter_service.generate_feature_response),
        ):
            response = self.client.post("/api/ai-cfo", json={"context": {"metrics": {}}})

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["success"], False)
        self.assertIn("OPENROUTER_API_KEY", response.json()["message"])
        openrouter_service.reset_client_for_tests()

    def test_invalid_openrouter_api_key_returns_actionable_error(self) -> None:
        from backend.services import openrouter_service

        fake_client = SimpleNamespace(
            post=lambda *args, **kwargs: SimpleNamespace(
                is_success=False,
                status_code=401,
            )
        )
        with patch("backend.services.openrouter_service._get_client", return_value=fake_client):
            response = self.client.post(
                "/api/subscription-doctor",
                json={"context": {"subscription": {"name": "Example"}}},
            )

        self.assertEqual(response.status_code, 503)
        self.assertFalse(response.json()["success"])
        self.assertIn("active OpenRouter key", response.json()["message"])
        self.assertEqual(response.json()["data"], {})

    def test_slow_openrouter_request_times_out_with_standardized_error(self) -> None:
        def slow_response(*args: object, **kwargs: object) -> dict[str, object]:
            time.sleep(0.1)
            return {"message": "Late response.", "data": {}}

        with (
            patch("backend.routes.ai.REQUEST_TIMEOUT_SECONDS", 0.01),
            patch("backend.routes.ai.generate_feature_response", side_effect=slow_response),
        ):
            response = self.client.post("/api/ai-cfo", json={"context": {}})

        self.assertEqual(response.status_code, 504)
        self.assertEqual(response.json()["success"], False)
        self.assertIn("too long", response.json()["message"])

    def test_openrouter_client_is_reused_and_response_is_normalized(self) -> None:
        from backend.services import openrouter_service

        generated_requests: list[tuple[str, dict[str, object]]] = []

        def post(path: str, *, json: dict[str, object]) -> SimpleNamespace:
            generated_requests.append((path, json))
            return SimpleNamespace(
                is_success=True,
                json=lambda: {
                    "choices": [
                        {
                            "message": {
                                "content": '{"message":"Summary ready.","data":{"source":"test"}}'
                            }
                        }
                    ]
                },
            )

        fake_client = SimpleNamespace(post=post, close=lambda: None)
        openrouter_service.reset_client_for_tests()
        with (
            patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key"}),
            patch.dict(os.environ, {}, clear=False),
            patch("backend.services.openrouter_service.httpx.Client", return_value=fake_client) as create_client,
        ):
            os.environ.pop("OPENROUTER_MODEL", None)
            first = openrouter_service.generate_feature_response(
                "executive-summary", context={"metrics": {}}
            )
            second = openrouter_service.generate_feature_response(
                "executive-summary", context={"metrics": {}}
            )

        self.assertEqual(first, {"message": "Summary ready.", "data": {"source": "test"}})
        self.assertEqual(second, first)
        create_client.assert_called_once()
        self.assertEqual(generated_requests[0][0], "chat/completions")
        self.assertEqual(
            generated_requests[0][1]["model"],
            "nvidia/nemotron-3.5-super-vl:free",
        )
        self.assertEqual(
            generated_requests[0][1]["messages"][0]["role"],
            "system",
        )
        self.assertEqual(
            generated_requests[0][1]["response_format"],
            {"type": "json_object"},
        )
        self.assertEqual(generated_requests[0][1]["max_tokens"], 1800)
        self.assertEqual(
            generated_requests[0][1]["reasoning"],
            {"effort": "none"},
        )
        openrouter_service.reset_client_for_tests()

    def test_frontend_mount_does_not_expose_dotfiles(self) -> None:
        for path in ("/.env", "/.env/.env", "/.env/Untitled"):
            with self.subTest(path=path):
                response = self.client.get(path)

                self.assertEqual(response.status_code, 404)

    def test_frontend_mount_serves_application_and_demo_data(self) -> None:
        self.assertEqual(self.client.get("/dashboard.html").status_code, 200)
        data_response = self.client.get("/data/company.json")

        self.assertEqual(data_response.status_code, 200)
        self.assertIn("company", data_response.json())

    def test_all_frontend_pages_and_json_datasets_are_served(self) -> None:
        frontend = Path(__file__).resolve().parents[1] / "frontend"
        for page in frontend.glob("*.html"):
            with self.subTest(page=page.name):
                response = self.client.get(f"/{page.name}")
                self.assertEqual(response.status_code, 200)
                self.assertIn("text/html", response.headers["content-type"])

        for dataset in (frontend / "data").glob("*.json"):
            with self.subTest(dataset=dataset.name):
                response = self.client.get(f"/data/{dataset.name}")
                self.assertEqual(response.status_code, 200)
                self.assertIsInstance(response.json(), dict)
                json.loads(dataset.read_text(encoding="utf-8"))

    def test_api_documentation_and_health_route_are_available(self) -> None:
        self.assertEqual(self.client.get("/docs").status_code, 200)
        health = self.client.get("/api/health")
        self.assertEqual(health.status_code, 200)
        self.assertTrue(health.json()["success"])
        self.assertEqual(self.client.get("/openapi.json").status_code, 200)

    def test_local_live_server_origin_can_call_ai_api(self) -> None:
        response = self.client.options(
            "/api/chat",
            headers={
                "Origin": "http://127.0.0.1:5502",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["access-control-allow-origin"],
            "http://127.0.0.1:5502",
        )

    def test_chat_prompts_require_direct_data_grounded_top_five_answers(self) -> None:
        for feature in ("chat", "recommendations"):
            with self.subTest(feature=feature):
                prompt = TASK_PROMPTS[feature].lower()
                self.assertIn("five", prompt)
                self.assertTrue(
                    "estimated_annual_savings" in prompt
                    or "estimated annual savings" in prompt
                )
                self.assertIn("actual tool/vendor", prompt)
                self.assertIn("generic", prompt)


if __name__ == "__main__":
    unittest.main()
