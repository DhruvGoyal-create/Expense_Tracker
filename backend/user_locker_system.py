import json
import os
import hashlib
import secrets
from pathlib import Path
from typing import Dict, Optional, Any
from datetime import datetime

class UserLockerSystem:
    """
    Secure JSON-based storage system with individual user lockers.
    Each user gets their own encrypted folder like a bank locker.
    """
    
    def __init__(self, base_directory: str = "user_lockers"):
        """
        Initialize the locker system.
        
        Args:
            base_directory: Root directory for all user lockers
        """
        self.base_dir = Path(base_directory)
        self.base_dir.mkdir(exist_ok=True)
        
        # Master registry file to track all users
        self.registry_file = self.base_dir / "registry.json"
        self._initialize_registry()
    
    def _initialize_registry(self):
        """Create or load the master registry."""
        if not self.registry_file.exists():
            initial_registry = {
                "created_at": datetime.now().isoformat(),
                "total_users": 0,
                "max_users": 100,
                "users": {}
            }
            self._save_json(self.registry_file, initial_registry)
    
    def _hash_passkey(self, passkey: str) -> str:
        """
        Create a secure hash of the passkey.
        
        Args:
            passkey: User's passkey
            
        Returns:
            Hashed passkey string
        """
        return hashlib.sha256(passkey.encode()).hexdigest()
    
    def _generate_user_id(self) -> str:
        """Generate a unique user ID."""
        return secrets.token_hex(16)
    
    def _save_json(self, filepath: Path, data: Dict):
        """Save data to JSON file."""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def _load_json(self, filepath: Path) -> Dict:
        """Load data from JSON file."""
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def create_user_locker(self, username: str, passkey: str) -> Dict[str, Any]:
        """
        Create a new user locker with passkey protection.
        
        Args:
            username: Unique username for the user
            passkey: Secret passkey to access the locker
            
        Returns:
            Dictionary with user_id and status
        """
        # Load registry
        registry = self._load_json(self.registry_file)
        
        # Check if max users reached
        if registry["total_users"] >= registry["max_users"]:
            return {
                "success": False,
                "message": "Maximum user limit (100) reached"
            }
        
        # Check if username already exists
        if username in registry["users"]:
            return {
                "success": False,
                "message": "Username already exists"
            }
        
        # Generate unique user ID
        user_id = self._generate_user_id()
        
        # Create user locker directory
        user_locker_path = self.base_dir / user_id
        user_locker_path.mkdir(exist_ok=True)
        
        # Hash the passkey for security
        passkey_hash = self._hash_passkey(passkey)
        
        # Create user metadata
        user_metadata = {
            "user_id": user_id,
            "username": username,
            "passkey_hash": passkey_hash,
            "created_at": datetime.now().isoformat(),
            "last_accessed": datetime.now().isoformat(),
            "data_files": []
        }
        
        # Save user metadata in their locker
        metadata_file = user_locker_path / "metadata.json"
        self._save_json(metadata_file, user_metadata)
        
        # Update registry
        registry["users"][username] = {
            "user_id": user_id,
            "created_at": datetime.now().isoformat()
        }
        registry["total_users"] += 1
        self._save_json(self.registry_file, registry)
        
        return {
            "success": True,
            "user_id": user_id,
            "username": username,
            "message": "User locker created successfully"
        }
    
    def verify_passkey(self, username: str, passkey: str) -> Optional[str]:
        """
        Verify user passkey and return user_id if correct.
        
        Args:
            username: Username
            passkey: Passkey to verify
            
        Returns:
            user_id if passkey is correct, None otherwise
        """
        # Load registry
        registry = self._load_json(self.registry_file)
        
        # Check if user exists
        if username not in registry["users"]:
            return None
        
        user_id = registry["users"][username]["user_id"]
        user_locker_path = self.base_dir / user_id
        metadata_file = user_locker_path / "metadata.json"
        
        # Load user metadata
        metadata = self._load_json(metadata_file)
        
        # Verify passkey
        passkey_hash = self._hash_passkey(passkey)
        if passkey_hash == metadata["passkey_hash"]:
            # Update last accessed time
            metadata["last_accessed"] = datetime.now().isoformat()
            self._save_json(metadata_file, metadata)
            return user_id
        
        return None
    
    def save_user_data(self, username: str, passkey: str, 
                       data_name: str, data: Dict) -> Dict[str, Any]:
        """
        Save data to user's locker.
        
        Args:
            username: Username
            passkey: User's passkey
            data_name: Name for this data file (e.g., "profile", "orders")
            data: Dictionary of data to save
            
        Returns:
            Status dictionary
        """
        # Verify passkey
        user_id = self.verify_passkey(username, passkey)
        if not user_id:
            return {
                "success": False,
                "message": "Invalid username or passkey"
            }
        
        # Get user locker path
        user_locker_path = self.base_dir / user_id
        data_file = user_locker_path / f"{data_name}.json"
        
        # Add timestamp to data
        data["_last_updated"] = datetime.now().isoformat()
        
        # Save data
        self._save_json(data_file, data)
        
        # Update metadata
        metadata_file = user_locker_path / "metadata.json"
        metadata = self._load_json(metadata_file)
        
        if data_name not in metadata["data_files"]:
            metadata["data_files"].append(data_name)
        
        metadata["last_accessed"] = datetime.now().isoformat()
        self._save_json(metadata_file, metadata)
        
        return {
            "success": True,
            "message": f"Data '{data_name}' saved successfully"
        }
    
    def load_user_data(self, username: str, passkey: str, 
                       data_name: str) -> Optional[Dict]:
        """
        Load data from user's locker.
        
        Args:
            username: Username
            passkey: User's passkey
            data_name: Name of the data file to load
            
        Returns:
            Data dictionary if successful, None otherwise
        """
        # Verify passkey
        user_id = self.verify_passkey(username, passkey)
        if not user_id:
            return None
        
        # Get user locker path
        user_locker_path = self.base_dir / user_id
        data_file = user_locker_path / f"{data_name}.json"
        
        # Check if file exists
        if not data_file.exists():
            return None
        
        # Load and return data
        return self._load_json(data_file)
    
    def list_user_files(self, username: str, passkey: str) -> Optional[list]:
        """
        List all data files in user's locker.
        
        Args:
            username: Username
            passkey: User's passkey
            
        Returns:
            List of data file names if successful, None otherwise
        """
        # Verify passkey
        user_id = self.verify_passkey(username, passkey)
        if not user_id:
            return None
        
        # Get user metadata
        user_locker_path = self.base_dir / user_id
        metadata_file = user_locker_path / "metadata.json"
        metadata = self._load_json(metadata_file)
        
        return metadata["data_files"]
    
    def delete_user_data(self, username: str, passkey: str, 
                         data_name: str) -> Dict[str, Any]:
        """
        Delete specific data file from user's locker.
        
        Args:
            username: Username
            passkey: User's passkey
            data_name: Name of the data file to delete
            
        Returns:
            Status dictionary
        """
        # Verify passkey
        user_id = self.verify_passkey(username, passkey)
        if not user_id:
            return {
                "success": False,
                "message": "Invalid username or passkey"
            }
        
        # Get user locker path
        user_locker_path = self.base_dir / user_id
        data_file = user_locker_path / f"{data_name}.json"
        
        # Check if file exists
        if not data_file.exists():
            return {
                "success": False,
                "message": f"Data file '{data_name}' not found"
            }
        
        # Delete file
        data_file.unlink()
        
        # Update metadata
        metadata_file = user_locker_path / "metadata.json"
        metadata = self._load_json(metadata_file)
        
        if data_name in metadata["data_files"]:
            metadata["data_files"].remove(data_name)
        
        self._save_json(metadata_file, metadata)
        
        return {
            "success": True,
            "message": f"Data '{data_name}' deleted successfully"
        }
    
    def change_passkey(self, username: str, old_passkey: str, 
                       new_passkey: str) -> Dict[str, Any]:
        """
        Change user's passkey.
        
        Args:
            username: Username
            old_passkey: Current passkey
            new_passkey: New passkey
            
        Returns:
            Status dictionary
        """
        # Verify old passkey
        user_id = self.verify_passkey(username, old_passkey)
        if not user_id:
            return {
                "success": False,
                "message": "Invalid username or current passkey"
            }
        
        # Update passkey
        user_locker_path = self.base_dir / user_id
        metadata_file = user_locker_path / "metadata.json"
        metadata = self._load_json(metadata_file)
        
        metadata["passkey_hash"] = self._hash_passkey(new_passkey)
        metadata["last_accessed"] = datetime.now().isoformat()
        
        self._save_json(metadata_file, metadata)
        
        return {
            "success": True,
            "message": "Passkey changed successfully"
        }
    
    def get_system_stats(self) -> Dict:
        """Get overall system statistics."""
        registry = self._load_json(self.registry_file)
        return {
            "total_users": registry["total_users"],
            "max_users": registry["max_users"],
            "available_slots": registry["max_users"] - registry["total_users"],
            "created_at": registry["created_at"]
        }


# ============================================
# USAGE EXAMPLES
# ============================================

if __name__ == "__main__":
    # Initialize the locker system
    locker_system = UserLockerSystem("user_lockers")
    
    print("=== User Locker System Demo ===\n")
    
    # Example 1: Create a new user locker
    print("1. Creating user locker for 'john_doe'...")
    result = locker_system.create_user_locker(
        username="john_doe",
        passkey="mySecurePass123!"
    )
    print(f"   Result: {result}\n")
    
    # Example 2: Save user data
    print("2. Saving user profile data...")
    user_profile = {
        "name": "John Doe",
        "email": "john@example.com",
        "age": 30,
        "address": "123 Main St"
    }
    result = locker_system.save_user_data(
        username="john_doe",
        passkey="mySecurePass123!",
        data_name="profile",
        data=user_profile
    )
    print(f"   Result: {result}\n")
    
    # Example 3: Save order history
    print("3. Saving order history...")
    orders = {
        "orders": [
            {"order_id": "ORD001", "amount": 99.99, "date": "2024-01-15"},
            {"order_id": "ORD002", "amount": 149.50, "date": "2024-02-20"}
        ]
    }
    result = locker_system.save_user_data(
        username="john_doe",
        passkey="mySecurePass123!",
        data_name="orders",
        data=orders
    )
    print(f"   Result: {result}\n")
    
    # Example 4: Load user data
    print("4. Loading user profile...")
    profile_data = locker_system.load_user_data(
        username="john_doe",
        passkey="mySecurePass123!",
        data_name="profile"
    )
    print(f"   Loaded data: {profile_data}\n")
    
    # Example 5: List all user files
    print("5. Listing all data files for user...")
    files = locker_system.list_user_files(
        username="john_doe",
        passkey="mySecurePass123!"
    )
    print(f"   Files: {files}\n")
    
    # Example 6: Try wrong passkey
    print("6. Attempting to access with wrong passkey...")
    result = locker_system.load_user_data(
        username="john_doe",
        passkey="wrongPassword",
        data_name="profile"
    )
    print(f"   Result: {result} (Access denied!)\n")
    
    # Example 7: Get system statistics
    print("7. System statistics...")
    stats = locker_system.get_system_stats()
    print(f"   Stats: {stats}\n")
    
    # Example 8: Change passkey
    print("8. Changing passkey...")
    result = locker_system.change_passkey(
        username="john_doe",
        old_passkey="mySecurePass123!",
        new_passkey="newSecurePass456!"
    )
    print(f"   Result: {result}\n")
    
    # Example 9: Test new passkey
    print("9. Testing new passkey...")
    profile_data = locker_system.load_user_data(
        username="john_doe",
        passkey="newSecurePass456!",
        data_name="profile"
    )
    print(f"   Access successful: {profile_data is not None}\n")
    
    print("=== Demo Complete ===")
    