import jwt
import time
import os

# The secret provided by the user
JWT_SECRET = "2m4mh+ChqEiXKYMsD4MdesTzXEvAJODY7PrDnSZ87Xg9bKWoVP3Q3HNZOmWqpGIk7ZmEb1sK8NZaN15n9j4h1w=="
PROJECT_REF = "btcildrnwthlwmvmhrmc"

def generate_token():
    payload = {
        "role": "service_role",
        "iss": "supabase",
        "iat": int(time.time()),
        "exp": int(time.time()) + 315360000, # 10 years
        "ref": PROJECT_REF
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    print(f"GENERATED_TOKEN={token}")

if __name__ == "__main__":
    generate_token()
