#!/usr/bin/env python3
"""Browser regression for PathwayOS v2.3 native-ready selection-first Career Buddy."""
from __future__ import annotations

import base64
import json
import re
from pathlib import Path
from typing import Any

from playwright.sync_api import BrowserContext, Page, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BUILD_ROOT = ROOT / "dist"
RESULT_PATH = ROOT / "docs" / "career-buddy-e2e-results.json"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def build_inline_document() -> str:
    module_map: dict[str, str] = {}
    catalog = (BUILD_ROOT / "data" / "pathwayos-career-catalog.json").read_bytes()
    catalog_url = "data:application/json;base64," + base64.b64encode(catalog).decode("ascii")

    for path in sorted((BUILD_ROOT / "src").glob("*.js")):
        source = path.read_text(encoding="utf-8")
        source = re.sub(
            r'(from\s+["\'])\./([^"\']+)(["\'])',
            lambda match: f'{match.group(1)}@pathway/{Path(match.group(2)).stem}{match.group(3)}',
            source,
        )
        source = re.sub(
            r'(import\s*["\'])\./([^"\']+)(["\'])',
            lambda match: f'{match.group(1)}@pathway/{Path(match.group(2)).stem}{match.group(3)}',
            source,
        )
        if path.name == "career-catalog.js":
            source = source.replace(
                'export async function loadCareerCatalog(url = new URL("../data/pathwayos-career-catalog.json", import.meta.url)) {',
                f"export async function loadCareerCatalog(url = {json.dumps(catalog_url)}) {{",
            )
        module_map[f"@pathway/{path.stem}"] = (
            "data:text/javascript;base64," + base64.b64encode(source.encode("utf-8")).decode("ascii")
        )

    styles = (BUILD_ROOT / "styles.css").read_text(encoding="utf-8")
    imports = json.dumps({"imports": module_map})
    return (
        '<!doctype html><html><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
        '<title>PathwayOS — Career Buddy</title><style>' + styles + '</style>'
        '<script type="importmap">' + imports + '</script></head><body>'
        '<div id="app" class="app-shell"></div>'
        '<script type="module">import "@pathway/app";</script></body></html>'
    )


INLINE_DOCUMENT = build_inline_document()


def create_page(context: BrowserContext, errors: list[dict[str, str]]) -> Page:
    page = context.new_page()
    page.on(
        "console",
        lambda message: errors.append({"kind": "console", "type": message.type, "text": message.text})
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: errors.append({"kind": "pageerror", "type": "error", "text": str(error)}))
    page.set_content(INLINE_DOCUMENT, wait_until="load", timeout=30_000)
    page.wait_for_function("window.PathwayOSCareerBuddy?.tools?.length === 33", timeout=30_000)
    return page


def journey(page: Page) -> dict[str, Any]:
    return page.evaluate("window.PathwayOSCareerBuddy.getState()")


def data_state(page: Page) -> dict[str, Any]:
    return page.evaluate("window.PathwayOSCareerBuddy.getDataState()")


def wait_step(page: Page, step: str) -> None:
    page.wait_for_function(
        f"window.PathwayOSCareerBuddy.getState().currentStep === {json.dumps(step)} && "
        "window.PathwayOSCareerBuddy.getState().busy === false",
        timeout=30_000,
    )


def click_and_wait(page: Page, selector: str, step: str | None = None) -> None:
    page.locator(selector).click()
    if step:
        wait_step(page, step)
    else:
        page.wait_for_function("window.PathwayOSCareerBuddy.getState().busy === false", timeout=30_000)


def verify_no_horizontal_overflow(page: Page, label: str) -> None:
    metrics = page.evaluate(
        "({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth, "
        "app: document.querySelector('.buddy-app')?.scrollWidth || 0 })"
    )
    require(metrics["body"] <= metrics["viewport"] + 1, f"{label} body overflows horizontally: {metrics}")
    require(metrics["app"] <= metrics["viewport"] + 1, f"{label} application overflows horizontally: {metrics}")


def verify_nested_scroll(page: Page, label: str) -> None:
    metrics = page.evaluate(
        """() => {
          const el = document.querySelector('.conversation-scroll');
          if (!el) return null;
          const before = el.scrollTop;
          el.scrollTop = el.scrollHeight;
          return { before, after: el.scrollTop, clientHeight: el.clientHeight, scrollHeight: el.scrollHeight };
        }"""
    )
    require(metrics is not None, f"{label} conversation scroll container is missing")
    require(metrics["scrollHeight"] > metrics["clientHeight"], f"{label} does not have scrollable content: {metrics}")
    require(metrics["after"] > 0, f"{label} could not change scrollTop: {metrics}")


def verify_document_scroll(page: Page, label: str) -> None:
    metrics = page.evaluate(
        """() => {
          const root = document.scrollingElement || document.documentElement;
          const before = root.scrollTop;
          root.scrollTop = root.scrollHeight;
          return { before, after: root.scrollTop, clientHeight: root.clientHeight, scrollHeight: root.scrollHeight };
        }"""
    )
    require(metrics["scrollHeight"] > metrics["clientHeight"], f"{label} document does not have scrollable content: {metrics}")
    require(metrics["after"] > 0, f"{label} document could not scroll: {metrics}")


def main() -> None:
    results: dict[str, Any] = {
        "product": "PathwayOS Career Buddy",
        "version": "2.3.0",
        "mode": "inline-production-build",
        "checks": [],
        "errors": [],
    }

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path="/usr/bin/chromium",
            args=["--no-sandbox"],
        )

        desktop = browser.new_context(
            viewport={"width": 1536, "height": 864},
            service_workers="block",
            reduced_motion="no-preference",
        )
        page = create_page(desktop, results["errors"])

        initial = journey(page)
        require(initial["currentStep"] == "direction", "Fresh journey did not start with career direction")
        require(initial["selectedRole"] == "", "Fresh journey silently selected a role")
        require(initial["directionMode"] == "groups", "Fresh journey did not start with supported career groups")
        require(page.locator(".career-group-choice").count() == 6, "The first step should show six guided career areas")
        require(page.locator("input, textarea").count() == 0, "An open-ended text control is still present in the primary journey")
        require(page.locator(".selection-footer").is_visible(), "Selection guidance footer is missing")
        require(page.locator(".trail-step.locked").count() == 8, "Future journey steps are not locked")
        initial_text = page.locator("body").inner_text()
        require("Singer" not in initial_text, "An unsupported career was injected into the catalog")
        require("Become a Machine Learning Engineer" not in initial_text, "Legacy ML default is visible")
        verify_no_horizontal_overflow(page, "desktop start")
        page.screenshot(path=str(ROOT / "mockups" / "01-selection-first-career-areas.png"), full_page=True)
        results["checks"].append("Fresh load shows six supported career areas and no open-ended career input")

        conversation_node = page.locator(".conversation-workspace").element_handle()
        trail_node = page.locator(".journey-trail").element_handle()
        require(conversation_node is not None and trail_node is not None, "Stable journey containers did not render")

        page.locator('[data-action="browse-all-fields"]').first.click()
        page.wait_for_function("window.PathwayOSCareerBuddy.getState().directionMode === 'all'")
        page.locator('.field-chip-list button').first.wait_for(state='visible')
        require(page.locator(".field-chip-list button").count() == 20, "Browse-all did not expose exactly 20 supported fields")
        verify_nested_scroll(page, "desktop full catalog")
        require(page.evaluate("el => el === document.querySelector('.conversation-workspace')", conversation_node), "Conversation workspace was replaced while browsing the catalog")
        page.screenshot(path=str(ROOT / "mockups" / "02-all-supported-fields-scrollable.png"), full_page=True)
        results["checks"].append("The full 20-field catalog is available on demand and the center workspace scrolls")

        page.locator('[data-action="back-to-career-groups"]').click()
        page.wait_for_function("window.PathwayOSCareerBuddy.getState().directionMode === 'groups'")
        page.locator('.career-group-choice').first.wait_for(state='visible')
        page.locator('[data-action="choose-career-group"][data-group="hardware-physical"]').click()
        page.wait_for_function("window.PathwayOSCareerBuddy.getState().directionMode === 'fields'")
        page.locator('.field-choice').first.wait_for(state='visible')
        require(page.locator(".field-choice").count() == 5, "Hardware direction should contain five supported fields")
        require("Robotics" in page.locator(".selection-field-options").inner_text(), "Robotics was not available in the hardware direction")
        require(page.evaluate("el => el === document.querySelector('.journey-trail')", trail_node), "Journey trail was replaced during selection")
        page.screenshot(path=str(ROOT / "mockups" / "03-supported-fields-in-direction.png"), full_page=True)
        results["checks"].append("Selecting a broad area reveals only the supported fields within that area")

        click_and_wait(page, '[data-action="choose-field"][data-topic="Robotics"]', "role")
        require(page.locator(".role-choice").count() == 3, "Robotics should expose exactly its three catalog roles")
        require("Robotics Engineer" in page.locator(".role-options").inner_text(), "Robotics Engineer was not available")
        results["checks"].append("Selecting a field removes all unrelated fields and drills into its catalog roles")

        click_and_wait(page, '[data-action="choose-role"][data-role="Robotics Engineer"]', "priority")
        require(journey(page)["selectedRole"] == "Robotics Engineer", "Role selection was not retained")
        require(data_state(page)["profileGoal"] == "Robotics Engineer", "Career choice did not bind to tool state")
        results["checks"].append("The selected role becomes the anchor for all subsequent decisions")

        click_and_wait(page, '[data-action="choose-priority"][data-value="internship"]', "route")
        require(journey(page)["priority"] == "internship", "Priority was not saved")
        require(page.locator(".route-options .horizontal-choice").count() <= 3, "Academic route step is not focused")
        results["checks"].append("The student selects one immediate priority from available options")

        click_and_wait(page, '[data-action="choose-route"][data-value="explore"]', "semester")
        semester = journey(page)
        require(semester["plan"] is not None, "Next-semester plan was not generated")
        require(page.locator(".semester-plan-card").count() == 1, "More than one semester was displayed")
        verify_nested_scroll(page, "desktop academic route")
        page.screenshot(path=str(ROOT / "mockups" / "04-scrollable-academic-route.png"), full_page=True)
        results["checks"].append("The long academic decision remains vertically scrollable inside the fixed workspace")

        click_and_wait(page, '[data-action="propose-plan"]')
        page.wait_for_function("window.PathwayOSCareerBuddy.getState().planApprovalId.length > 0")
        require(data_state(page)["officialPlan"] is None, "Official plan changed before student approval")
        require(page.locator(".inline-approval").is_visible(), "Inline student confirmation was not shown")
        click_and_wait(page, '[data-action="approve-plan"]', "skills")
        skills = journey(page)
        require(1 <= len(skills["skillOptions"]) <= 3, "Skill analysis did not stay within three gaps")
        results["checks"].append("Plan changes remain approval-gated and unlock only three skill choices")

        page.locator(".skill-choice").first.click()
        page.wait_for_function("window.PathwayOSCareerBuddy.getState().selectedSkill.length > 0")
        page.locator('.deep-dive-section').first.wait_for(state='visible')
        selected_skill = journey(page)["selectedSkill"]
        require(page.locator(".deep-dive-section").count() == 2, "Skill deep dive should contain one learning action and one proof project")
        click_and_wait(page, '[data-action="confirm-skill"]', "experience")
        results["checks"].append(f"Selecting {selected_skill} reveals one learning action and one proof project")

        click_and_wait(page, '[data-action="choose-experience-type"][data-value="internship"]')
        page.wait_for_function(
            "window.PathwayOSCareerBuddy.getState().experienceChoices.length > 0 && "
            "window.PathwayOSCareerBuddy.getState().busy === false",
            timeout=30_000,
        )
        require(page.locator(".opportunity-choice").count() <= 2, "Experience screen rendered more than two choices")
        page.locator(".opportunity-choice").first.click()
        page.wait_for_function("window.PathwayOSCareerBuddy.getState().selectedExperience !== null")
        experience_title = journey(page)["selectedExperience"]["title"]
        click_and_wait(page, '[data-action="confirm-experience"]', "funding")
        click_and_wait(page, '[data-action="skip-funding"]', "roadmap")
        final_state = journey(page)
        require(final_state["finalPathway"] is not None, "Final roadmap was not assembled")
        roadmap_text = page.locator(".roadmap-step-card").inner_text()
        require("Robotics Engineer" in roadmap_text, "Roadmap lost the selected role")
        require(selected_skill in roadmap_text, "Roadmap lost the selected skill")
        require(experience_title in roadmap_text, "Roadmap lost the selected experience")
        page.screenshot(path=str(ROOT / "mockups" / "05-selection-built-roadmap.png"), full_page=True)
        results["checks"].append("The final roadmap is assembled only from selected role, plan, skill, and experience")

        page.locator('.activity-link[data-action="toggle-activity"]').click()
        page.locator('.activity-drawer').wait_for(state='visible')
        require(page.locator(".tool-log-row").count() > 0, "Used tools were not visible in the secondary activity drawer")
        page.locator('[aria-label="Close activity"]').click()
        results["checks"].append("WebMCP activity remains secondary to the selection journey")

        verify_no_horizontal_overflow(page, "desktop completed flow")
        desktop.close()

        mobile = browser.new_context(
            viewport={"width": 390, "height": 844},
            service_workers="block",
            reduced_motion="no-preference",
        )
        mobile_page = create_page(mobile, results["errors"])
        require(mobile_page.locator(".career-group-choice").count() == 6, "Mobile did not show the six supported areas")
        require(mobile_page.locator("input, textarea").count() == 0, "Mobile still exposes open-ended career entry")
        verify_no_horizontal_overflow(mobile_page, "mobile start")
        mobile_page.locator('[data-action="choose-career-group"][data-group="security-networks"]').click()
        mobile_page.wait_for_function("window.PathwayOSCareerBuddy.getState().directionMode === 'fields'")
        mobile_page.locator('.field-choice').first.wait_for(state='visible')
        require(mobile_page.locator(".field-choice").count() == 2, "Mobile security direction should expose two fields")
        verify_document_scroll(mobile_page, "mobile supported fields")
        mobile_page.evaluate("window.scrollTo(0, 0)")
        mobile_page.locator(".conversation-workspace").scroll_into_view_if_needed()
        mobile_page.screenshot(path=str(ROOT / "mockups" / "06-selection-first-mobile.png"), full_page=False)
        verify_no_horizontal_overflow(mobile_page, "mobile selection")
        results["checks"].append("The selection-first journey scrolls at 390×844 without horizontal overflow")
        mobile.close()

        require(not results["errors"], f"Browser errors detected: {results['errors']}")
        results["checks"].append("No console errors or uncaught page errors were detected")
        results["passed"] = True
        results["checkCount"] = len(results["checks"])
        browser.close()

    RESULT_PATH.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
