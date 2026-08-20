variable "aws_region" {
  description = "AWS deployment region (Cape Town for lowest latency to Mozambique)"
  type        = string
  default     = "af-south-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "db_password" {
  description = "Master password for PostgreSQL RDS"
  type        = string
  sensitive   = true
  default     = "claq_secure_db_pass_2026_mz"
}
