output "frontend_bucket_name" {
  description = "Nome do bucket S3 do frontend estático"
  value       = aws_s3_bucket.frontend.id
}

output "cloudfront_distribution_id" {
  description = "ID da distribuição CloudFront do frontend"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "Domínio público da distribuição CloudFront"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "ecr_repository_url" {
  description = "URL do repositório ECR da core-api"
  value       = aws_ecr_repository.backend.repository_url
}

output "ec2_instance_id" {
  description = "ID da instância EC2 que roda os containers do backend"
  value       = aws_instance.backend.id
}

output "ec2_public_ip" {
  description = "IP público da instância EC2 do backend"
  value       = aws_instance.backend.public_ip
}
