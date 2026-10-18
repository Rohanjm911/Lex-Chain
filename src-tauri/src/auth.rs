use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum UserRole {
    Administrator,
    Investigator,
    Verifier,
    Auditor,
}

impl UserRole {
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "Administrator" => Some(UserRole::Administrator),
            "Investigator" => Some(UserRole::Investigator),
            "Verifier" => Some(UserRole::Verifier),
            "Auditor" => Some(UserRole::Auditor),
            _ => None,
        }
    }

    pub fn to_string(&self) -> String {
        match self {
            UserRole::Administrator => "Administrator".to_string(),
            UserRole::Investigator => "Investigator".to_string(),
            UserRole::Verifier => "Verifier".to_string(),
            UserRole::Auditor => "Auditor".to_string(),
        }
    }

    pub fn can_register_evidence(&self) -> bool {
        matches!(self, UserRole::Administrator | UserRole::Investigator)
    }

    pub fn can_verify_evidence(&self) -> bool {
        matches!(self, UserRole::Administrator | UserRole::Investigator | UserRole::Verifier)
    }

    pub fn can_manage_cases(&self) -> bool {
        matches!(self, UserRole::Administrator | UserRole::Investigator)
    }

    pub fn can_modify_settings(&self) -> bool {
        matches!(self, UserRole::Administrator)
    }

    pub fn can_view_audit_logs(&self) -> bool {
        matches!(self, UserRole::Administrator | UserRole::Auditor)
    }

    pub fn can_export_reports(&self) -> bool {
        
        true
    }

    pub fn can_manage_users(&self) -> bool {
        matches!(self, UserRole::Administrator)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthUser {
    pub id: String,
    pub username: String,
    pub display_name: String,
    pub role: String,
}

pub struct SessionManager {
    current_user: Arc<Mutex<Option<AuthUser>>>,
}

impl SessionManager {
    pub fn new() -> Self {
        
        let initial_user = AuthUser {
            id: "USR-001".to_string(),
            username: "admin".to_string(),
            display_name: "System Administrator".to_string(),
            role: "Administrator".to_string(),
        };

        SessionManager {
            current_user: Arc::new(Mutex::new(Some(initial_user))),
        }
    }

    pub fn get_current_user(&self) -> Option<AuthUser> {
        self.current_user.lock().unwrap().clone()
    }

    pub fn set_current_user(&self, user: AuthUser) {
        *self.current_user.lock().unwrap() = Some(user);
    }

    pub fn logout(&self) {
        *self.current_user.lock().unwrap() = None;
    }

    pub fn get_role(&self) -> Result<UserRole, String> {
        let user = self
            .get_current_user()
            .ok_or_else(|| "No authenticated user session active".to_string())?;
        UserRole::from_str(&user.role).ok_or_else(|| format!("Unknown user role: {}", user.role))
    }
}
