from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:3000/merchant/dashboard", wait_until="networkidle")
    page.wait_for_timeout(1000)
    page.screenshot(path="next_dashboard.png", full_page=True)
    page.goto("http://localhost:3000/merchant/inventory", wait_until="networkidle")
    page.wait_for_timeout(1000)
    page.screenshot(path="next_inventory.png", full_page=True)
    browser.close()
print("Next.js screenshots captured successfully!")
