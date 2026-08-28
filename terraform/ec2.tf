data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  # us-east-1e é uma AZ legada que não suporta vários instance types novos (ex: t3.micro)
  filter {
    name   = "availability-zone"
    values = ["us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d", "us-east-1f"]
  }
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_security_group" "backend" {
  name        = "${var.project_name}-${var.environment}-backend-sg"
  description = "Acesso a instancia EC2 que roda os containers do backend"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP para a API"
    from_port   = var.http_port
    to_port     = var.http_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "ingress" {
    for_each = length(var.ssh_allowed_cidr_blocks) > 0 ? [1] : []

    content {
      description = "SSH"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.ssh_allowed_cidr_blocks
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

resource "aws_iam_role" "backend_ec2" {
  name = "${var.project_name}-${var.environment}-backend-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "backend_ec2_ecr_read_only" {
  role       = aws_iam_role.backend_ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Permite que a pipeline de deploy dispare o redeploy via SSM Send Command,
# sem precisar de chave SSH nem abrir a porta 22 pros runners do CI.
resource "aws_iam_role_policy_attachment" "backend_ec2_ssm" {
  role       = aws_iam_role.backend_ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "backend_ec2" {
  name = "${var.project_name}-${var.environment}-backend-ec2-profile"
  role = aws_iam_role.backend_ec2.name
}

resource "aws_instance" "backend" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.ec2_instance_type
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.backend.id]
  iam_instance_profile   = aws_iam_instance_profile.backend_ec2.name
  key_name               = var.ec2_key_name

  root_block_device {
    volume_size = var.ec2_root_volume_size
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/templates/user_data.sh.tpl", {
    aws_region         = var.aws_region
    ecr_repository_url = aws_ecr_repository.backend.repository_url
    ecr_image_tag      = var.ecr_image_tag
    app_name           = var.project_name
    app_port           = var.app_port
    http_port          = var.http_port
    jwt_secret         = var.jwt_secret
    jwt_expires_in     = var.jwt_expires_in
    postgres_user      = var.postgres_user
    postgres_password  = var.postgres_password
    postgres_db        = var.postgres_db
  })
  user_data_replace_on_change = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-backend"
  })
}
