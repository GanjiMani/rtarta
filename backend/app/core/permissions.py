from fastapi import Depends, HTTPException, status
from app.models.user import User, UserRole
from app.core.jwt import get_current_user
from app.core.roles import ROLE_PERMISSIONS

def has_permission(required_permission: str):
    """
    Dependency to check if the current user has the required permission.
    First checks if the permission is in the user's custom 'permissions' JSON column.
    If not, falls back to the default 'ROLE_PERMISSIONS' mapping based on their sub_role.
    """
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        # 1. Basic Admin Role Check
        if current_user.role != UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Access forbidden: Not an admin user"
            )
        
        # 2. Check if permission is explicitly granted in user's custom permissions (DB override)
        # Assuming user.permissions is a Dict like {"allowed": ["perm1", "perm2"], "denied": []} or just a list
        user_custom_perms = current_user.permissions or {}
        # If it's a list/dict structure, adjust access accordingly. For now assuming simple list in JSON or dict wrapper.
        # Let's assume the column stores a simple dict/json, we'll check logic carefully.
        # If user.permissions is just a list of strings:
        if isinstance(user_custom_perms, list):
             if required_permission in user_custom_perms:
                 return current_user
        
        # 3. Check Role-Based Default Permissions
        user_sub_role = current_user.sub_role
        if not user_sub_role:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Access forbidden: User has no assigned sub-role"
            )

        allowed_permissions = ROLE_PERMISSIONS.get(user_sub_role, [])
        
        if required_permission not in allowed_permissions:
             # Check for Super Permissions
             from app.core.roles import AdminPermissions
             if AdminPermissions.READ_ALL in allowed_permissions and "read" in required_permission:
                 return current_user
             if AdminPermissions.WRITE_ALL in allowed_permissions and "write" in required_permission:
                 return current_user
                 
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Access forbidden: Missing permission '{required_permission}'"
            )

        return current_user

    return permission_checker
