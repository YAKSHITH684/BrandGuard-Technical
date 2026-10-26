import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import HTTPException
from app.routers import auth
from app.database import init_db, SessionLocal
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.auth import LoginRequest, ResetPasswordRequest

def run_direct_tests():
    init_db()
    db = SessionLocal()

    ws = db.query(Workspace).first()
    if not ws:
        ws = Workspace(name="Test Acme", readability_target=60.0, confidence_threshold=0.65)
        db.add(ws)
        db.commit()
        db.refresh(ws)

    creator = db.query(User).filter(User.email == "creator@brandguard.io").first()
    if not creator:
        creator = User(
            workspace_id=ws.id,
            name="Alex Vance (Creator)",
            email="creator@brandguard.io",
            password_hash=auth.hash_password("password123"),
            role="creator"
        )
        db.add(creator)
        db.commit()
    else:
        creator.password_hash = auth.hash_password("password123")
        db.commit()

    print("[1] Testing wrong password raises HTTPException 400...")
    try:
        auth.login(LoginRequest(email="creator@brandguard.io", password="wrongpassword999"), db)
        assert False, "Expected HTTPException"
    except HTTPException as e:
        assert e.status_code == 400
        assert "Invalid email or password" in e.detail
        print("  -> Passed: correctly caught wrong password error")

    print("[2] Testing unknown email reset raises 404...")
    try:
        auth.reset_password(ResetPasswordRequest(email="unknown_user_999@brandguard.io", new_password="newpassword123"), db)
        assert False, "Expected HTTPException"
    except HTTPException as e:
        assert e.status_code == 404
        assert "No account registered" in e.detail
        print("  -> Passed: correctly rejected unknown email")

    print("[3] Testing reset password too short raises 400...")
    try:
        auth.reset_password(ResetPasswordRequest(email="creator@brandguard.io", new_password="123"), db)
        assert False, "Expected HTTPException"
    except HTTPException as e:
        assert e.status_code == 400
        assert "at least 6 characters" in e.detail
        print("  -> Passed: correctly rejected short password")

    print("[4] Testing reset password success & login with new credentials...")
    res = auth.reset_password(ResetPasswordRequest(email="creator@brandguard.io", new_password="brandguard_new_pass_2026"), db)
    assert "access_token" in res
    assert res["token_type"] == "bearer"
    print("  -> Passed: password reset succeeded and returned bearer token")

    # Old password fails
    try:
        auth.login(LoginRequest(email="creator@brandguard.io", password="password123"), db)
        assert False, "Expected HTTPException"
    except HTTPException as e:
        assert e.status_code == 400
        print("  -> Passed: old password no longer works")

    # New password succeeds
    login_res = auth.login(LoginRequest(email="creator@brandguard.io", password="brandguard_new_pass_2026"), db)
    assert "access_token" in login_res
    print("  -> Passed: new password logged in successfully")

    # Restore default demo password
    auth.reset_password(ResetPasswordRequest(email="creator@brandguard.io", new_password="password123"), db)
    print("  -> Restored default demo password (password123)")

    db.close()
    print("\nALL DIRECT AUTH & RESET PASSWORD TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_direct_tests()
