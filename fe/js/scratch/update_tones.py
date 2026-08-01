import json

js_path = r'c:\Code\EngWithMe\fe\js\listening-data-fallback.js'

with open(js_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Extract JSON string inside const missions = ... ;
prefix = "const missions = "
suffix = ";\n\n  window.LISTENING_LAB_MISSIONS = missions;"
start_idx = text.find(prefix) + len(prefix)
end_idx = text.rfind(suffix)

json_str = text[start_idx:end_idx].strip()
items = json.loads(json_str)

easy_goals = ["self-introduction", "family-friends", "daily-routine", "weather-seasons", "hobbies-free-time"]
medium_goals = ["shopping-prices", "food-restaurant", "travel-directions", "study-school", "health-doctor"]
hard_goals = ["work-career", "news-society", "tech-internet"]

def get_tone(goal):
    if goal in easy_goals:
        return "green"
    if goal in medium_goals:
        return "warm"
    if goal in hard_goals:
        return "danger"
    return "green"

# Update tone for all 78 items
for item in items:
    item['tone'] = get_tone(item['goal'])

print(f"Updated tone for all {len(items)} missions!")

out_js = f"""(function () {{
  "use strict";

  const missions = {json.dumps(items, ensure_ascii=False, indent=2)};

  window.LISTENING_LAB_MISSIONS = missions;
  window.LISTENING_LAB_MISSION_EXPANSIONS = [];
  window.LISTENING_LAB_SUPPLEMENTAL_EXPANSIONS = [];
}})();
"""

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(out_js)

print("SUCCESS! Updated tones for all missions!")
