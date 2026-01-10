import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health check: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
    return response.status_code == 200

def test_investor_registration():
    """Test investor registration"""
    investor_data = {
        "pan_number": "TESTE1234F",
        "full_name": "Test Investor",
        "date_of_birth": "1990-01-01",
        "gender": "male",
        "email": "test@example.com",
        "mobile_number": "9876543210",
        "address_line1": "123 Test Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
    }

    response = requests.post(
        f"{BASE_URL}/api/v1/investor/auth/register",
        json=investor_data,
        params={"password": "testpassword123"}
    )

    print(f"Investor registration: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
        return response.json()
    else:
        print(f"Error: {response.text}")
        return None

def test_investor_login(email, password):
    """Test investor login"""
    response = requests.post(
        f"{BASE_URL}/api/v1/investor/auth/login",
        json={"email": email, "password": password}
    )

    print(f"Investor login: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
        return response.json()
    else:
        print(f"Error: {response.text}")
        return None

if __name__ == "__main__":
    print("Testing RTA Investor Backend API")
    print("=" * 40)

    # Test health
    if not test_health():
        print("Health check failed!")
        exit(1)

    print("\n" + "=" * 40)

    # Test registration
    reg_result = test_investor_registration()
    if reg_result:
        print("\n" + "=" * 40)

        # Test login
        login_result = test_investor_login("test@example.com", "testpassword123")

        if login_result:
            print("\n" + "=" * 40)
            print("✅ All tests passed!")
        else:
            print("❌ Login test failed!")
    else:
        print("❌ Registration test failed!")









