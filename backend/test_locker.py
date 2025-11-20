from user_locker_system import UserLockerSystem

# Initialize
locker = UserLockerSystem("user_lockers")

# Test 1: Create user
print("Creating user...")
result = locker.create_user_locker("test_user", "test123")
print(result)

# Test 2: Save data
print("\nSaving data...")
test_data = {"name": "Test User", "email": "test@example.com"}
result = locker.save_user_data("test_user", "test123", "profile", test_data)
print(result)

# Test 3: Load data
print("\nLoading data...")
data = locker.load_user_data("test_user", "test123", "profile")
print(data)
