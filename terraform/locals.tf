locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  s3_origin_id = "${var.project_name}-frontend-origin"
}
