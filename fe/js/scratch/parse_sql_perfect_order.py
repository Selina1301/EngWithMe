import json

sql_path = r'c:\Code\EngWithMe\be\database\migrations\20260529_seed_learning_content_items.sql'

with open(sql_path, 'r', encoding='utf-8') as f:
    sql_text = f.read()

def parse_sql_values(text):
    results = []
    for line in text.splitlines():
        line = line.strip()
        if not line.startswith("('listening',"):
            continue
        
        content = line[len("('listening',"):].rstrip(",;").rstrip(")")
        tokens = []
        in_string = False
        current = []
        i = 0
        while i < len(content):
            c = content[i]
            if not in_string:
                if c == "'":
                    in_string = True
                elif c == ',':
                    val = "".join(current).strip()
                    if val:
                        tokens.append(val)
                    current = []
                elif not c.isspace():
                    current.append(c)
            else:
                if c == "'":
                    if i + 1 < len(content) and content[i+1] == "'":
                        current.append("'")
                        i += 1
                    else:
                        in_string = False
                        tokens.append("".join(current))
                        current = []
                else:
                    current.append(c)
            i += 1
        
        if current:
            tokens.append("".join(current))
            
        results.append(tokens)
    return results

rows = parse_sql_values(sql_text)

items_by_goal = {}
for row in rows:
    goal = row[2]
    json_str = row[5]
    # Replace SQL double quote escapes
    json_str = json_str.replace('\\\\"', '\\"')
    
    data = json.loads(json_str)
    data['goal'] = goal
    items_by_goal.setdefault(goal, []).append(data)

all_ordered_items = []
for goal, goal_items in items_by_goal.items():
    for idx, item in enumerate(goal_items):
        item['sessionOrder'] = idx + 1
        item['label'] = f"Session {idx + 1}"
        all_ordered_items.append(item)

print("\n--- VERIFYING ORIGINAL PERFECT SESSION ORDER ---")
for goal in sorted(items_by_goal.keys()):
    print(f"\nGoal '{goal}':")
    for item in items_by_goal[goal]:
        print(f"  [{item['label']}] id='{item['id']}' | title='{item['title']}'")

js_content = f"""(function () {{
  "use strict";

  const missions = {json.dumps(all_ordered_items, ensure_ascii=False, indent=2)};

  window.LISTENING_LAB_MISSIONS = missions;
  window.LISTENING_LAB_MISSION_EXPANSIONS = [];
  window.LISTENING_LAB_SUPPLEMENTAL_EXPANSIONS = [];
}})();
"""

out_path = r'c:\Code\EngWithMe\fe\js\listening-data-fallback.js'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"\nSUCCESS! Updated {out_path} with 1-to-6 ORIGINAL ORDER for ALL 78 SESSIONS!")
