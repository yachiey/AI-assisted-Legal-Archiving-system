import requests
import os

api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    # Try to load from .env manually if not in env
    try:
        paths = [".env", "../.env", "d:/capstone/Legal_Arch_aiu/.env"]
        for p in paths:
            if os.path.exists(p):
                with open(p, "r") as f:
                    for line in f:
                        if line.startswith("GROQ_API_KEY="):
                            api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                            break
                if api_key: break
    except:
        pass

if not api_key:
    print("Error: GROQ_API_KEY not found")
    exit(1)

url = "https://api.groq.com/openai/v1/models"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

try:
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        models = response.json()['data']
        print("\nAvailable Models:")
        for model in models:
            if 'vision' in model['id']:
                print(f" - {model['id']} (VISION)")
            else:
                print(f" - {model['id']}")
    else:
        print(f"Error: {response.status_code} - {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
