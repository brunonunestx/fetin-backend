variable "aws_region" {
  description = "Região AWS onde os recursos serão provisionados"
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "Profile do ~/.aws/credentials usado para autenticar (null usa a credential chain padrão, ex: env vars no CI)"
  type        = string
  default     = "bruno-account"
}

variable "project_name" {
  description = "Nome do projeto, usado como prefixo para os recursos"
  type        = string
  default     = "trampofacil"
}

variable "environment" {
  description = "Nome do ambiente (ex: production, staging)"
  type        = string
  default     = "production"
}

# --- Frontend (S3 + CloudFront) ---

variable "frontend_bucket_force_destroy" {
  description = "Permite destruir o bucket do frontend mesmo com objetos dentro"
  type        = bool
  default     = false
}

variable "cloudfront_price_class" {
  description = "Price class da distribuição CloudFront"
  type        = string
  default     = "PriceClass_100"
}

# --- Backend (ECR + EC2) ---

variable "ecr_repository_name" {
  description = "Nome do repositório ECR para a imagem da core-api"
  type        = string
  default     = "trampofacil-core-api"
}

variable "ecr_image_tag" {
  description = "Tag da imagem publicada no ECR que o EC2 deve rodar"
  type        = string
  default     = "latest"
}

variable "ec2_instance_type" {
  description = "Tipo da instância EC2 que roda os containers"
  type        = string
  default     = "t3.micro"
}

variable "ec2_root_volume_size" {
  description = "Tamanho (GB) do volume raiz da instância EC2"
  type        = number
  default     = 30
}

variable "ec2_key_name" {
  description = "Nome do key pair EC2 para acesso SSH (opcional, deixe null para não permitir SSH)"
  type        = string
  default     = null
}

variable "ssh_allowed_cidr_blocks" {
  description = "Lista de CIDRs autorizados a acessar a porta 22; vazio desabilita SSH"
  type        = list(string)
  default     = []
}

variable "http_port" {
  description = "Porta pública exposta pela instância EC2 para a API"
  type        = number
  default     = 80
}

variable "app_port" {
  description = "Porta interna em que o container da core-api escuta"
  type        = number
  default     = 3000
}

variable "jwt_secret" {
  description = "Valor de JWT_SECRET passado ao container da core-api"
  type        = string
  sensitive   = true
}

variable "jwt_expires_in" {
  description = "Valor de JWT_EXPIRES_IN passado ao container da core-api"
  type        = string
  default     = "3600"
}

variable "postgres_user" {
  description = "Usuário do Postgres rodando no container da instância EC2"
  type        = string
  default     = "user"
}

variable "postgres_password" {
  description = "Senha do Postgres rodando no container da instância EC2"
  type        = string
  sensitive   = true
}

variable "postgres_db" {
  description = "Nome do database do Postgres rodando no container da instância EC2"
  type        = string
  default     = "core_api"
}
