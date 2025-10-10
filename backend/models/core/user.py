from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from werkzeug.security import generate_password_hash, check_password_hash
from .base import Base

class UserRole(enum.Enum):
    ADMIN = 'admin'
    MANAGER = 'manager'
    OPERATOR = 'operator'
    VIEWER = 'viewer'

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    
    # Datos básicos
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    role = Column(Enum(UserRole), nullable=False, default=UserRole.VIEWER)
    
    # Relaciones
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    
    # Preferencias
    preferences = Column(JSON)  # Preferencias de usuario
    notification_settings = Column(JSON)  # Configuración de notificaciones
    
    # Estado
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relaciones
    company = relationship("Company", backref="users")
    notifications = relationship("Notification", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.email}>"
        
    @property
    def full_name(self):
        """Retorna el nombre completo del usuario"""
        return f"{self.first_name} {self.last_name}" if self.first_name and self.last_name else self.email
        
    @property
    def is_admin(self):
        """Verifica si el usuario es administrador"""
        return self.role == UserRole.ADMIN
        
    @property
    def is_manager(self):
        """Verifica si el usuario es manager"""
        return self.role == UserRole.MANAGER
        
    def has_permission(self, permission):
        """Verifica si el usuario tiene un permiso específico"""
        role_permissions = {
            UserRole.ADMIN: ['all'],
            UserRole.MANAGER: ['view', 'edit', 'create', 'delete'],
            UserRole.OPERATOR: ['view', 'edit', 'create'],
            UserRole.VIEWER: ['view']
        }
        return 'all' in role_permissions[self.role] or permission in role_permissions[self.role]
        
    def to_dict(self):
        """Convierte el objeto a diccionario"""
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role.value,
            'company_id': self.company_id,
            'preferences': self.preferences,
            'notification_settings': self.notification_settings,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
    def set_password(self, password):
        """Establece la contraseña del usuario"""
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        """Verifica la contraseña del usuario"""
        return check_password_hash(self.password_hash, password)
        
    def get_user_permissions(self):
        """Retorna los permisos del usuario según su rol"""
        permissions = {
            'admin': ['read', 'write', 'delete', 'manage_users', 'manage_fleets'],
            'manager': ['read', 'write', 'manage_fleets'],
            'operator': ['read', 'write']
        }
        return permissions.get(self.role.value, [])
        
    def can_access_fleet(self, fleet_id):
        """Verifica si el usuario puede acceder a una flota específica"""
        if self.role == UserRole.ADMIN:
            return True
        return any(f.id == fleet_id for f in self.company.fleets)
        
    def get_notification_channels(self):
        """Retorna los canales de notificación configurados"""
        return self.notification_settings.get('channels', [])
        
    def update_last_login(self):
        """Actualiza el timestamp del último login"""
        self.last_login = func.now() 