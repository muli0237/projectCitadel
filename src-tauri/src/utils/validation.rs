use crate::errors::{CitadelError, Result};

pub struct Validator;

impl Validator {
    /// Validates safe tool identifiers (alphanumeric, hyphens, underscores)
    pub fn validate_identifier(id: &str) -> Result<()> {
        if id.is_empty() || id.len() > 64 {
            return Err(CitadelError::Security("Identifier length invalid".into()));
        }
        if !id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
            return Err(CitadelError::Security("Identifier contains invalid characters".into()));
        }
        Ok(())
    }

    /// Validates allowed user-supplied asset extensions
    pub fn validate_asset_extension(ext: &str) -> bool {
        matches!(
            ext.to_lowercase().as_str(),
            "png" | "jpg" | "jpeg" | "webp" | "svg" | "avif" | "ogg" | "wav" | "mp3" | "json"
        )
    }

    /// Checks if a file size is within limits (e.g. 15MB max for custom theme assets)
    pub fn validate_asset_size(size_bytes: u64, max_mb: u64) -> bool {
        size_bytes <= (max_mb * 1024 * 1024)
    }
}
