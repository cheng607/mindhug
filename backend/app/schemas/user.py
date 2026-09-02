from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field, ValidationInfo, field_validator


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirmPassword: str
    nickname: str | None = ""
    phone: str | None = ""
    gender: int = 1
    agreeTerms: bool = Field(..., description="必须同意用户协议")

    @field_validator("agreeTerms")
    @classmethod
    def must_agree_terms(cls, v: bool) -> bool:
        if not v:
            raise ValueError("请阅读并同意用户协议")
        return v

    @field_validator("confirmPassword")
    @classmethod
    def passwords_match(cls, v: str, info: ValidationInfo) -> str:
        if info.data.get("password") and v != info.data["password"]:
            raise ValueError("两次输入的密码不一致")
        return v


class UserInfoResponse(BaseModel):
    id: int
    username: str
    email: str
    nickname: str
    avatar: str
    phone: str
    gender: int
    genderDisplayName: str
    birthday: str
    userType: int
    userTypeDisplayName: str
    status: int
    statusDisplayName: str
    displayName: str
    createdAt: str
    updatedAt: str

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    userInfo: UserInfoResponse
    token: str
    roleType: str


class UpdateProfileRequest(BaseModel):
    nickname: str | None = Field(None, max_length=50)
    phone: str | None = Field(None, max_length=20)
    gender: int | None = Field(None, ge=1, le=2)


class ChangePasswordRequest(BaseModel):
    oldPassword: str = Field(..., min_length=1)
    newPassword: str = Field(..., min_length=6)
    confirmPassword: str = Field(..., min_length=6)

    @field_validator("confirmPassword")
    @classmethod
    def passwords_match(cls, v: str, info: ValidationInfo) -> str:
        if info.data.get("newPassword") and v != info.data["newPassword"]:
            raise ValueError("两次输入的新密码不一致")
        return v


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    newPassword: str = Field(..., min_length=6)
    confirmPassword: str = Field(..., min_length=6)

    @field_validator("confirmPassword")
    @classmethod
    def passwords_match(cls, v: str, info: ValidationInfo) -> str:
        if info.data.get("newPassword") and v != info.data["newPassword"]:
            raise ValueError("两次输入的新密码不一致")
        return v


class AdminUserPageResponse(BaseModel):
    records: list[UserInfoResponse]
    total: int
    size: int
    current: int
    pages: int


class UpdateUserStatusRequest(BaseModel):
    status: int = Field(..., ge=0, le=1)


class UpdateUserRoleRequest(BaseModel):
    roleCode: int = Field(..., ge=1, le=2)


def build_user_info(user) -> UserInfoResponse:
    return UserInfoResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        nickname=user.nickname or "",
        avatar=user.avatar or "",
        phone=user.phone or "",
        gender=user.gender,
        genderDisplayName=user.gender_display_name,
        birthday=user.birthday.isoformat() if isinstance(user.birthday, date) else "",
        userType=user.user_type,
        userTypeDisplayName=user.user_type_display_name,
        status=user.status,
        statusDisplayName=user.status_display_name,
        displayName=user.display_name,
        createdAt=user.created_at.isoformat() if isinstance(user.created_at, datetime) else "",
        updatedAt=user.updated_at.isoformat() if isinstance(user.updated_at, datetime) else "",
    )
