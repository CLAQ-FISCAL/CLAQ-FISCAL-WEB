# AWS RDS PostgreSQL 16 Multi-AZ Instance for CLAQ Fiscal Alert

resource "aws_db_subnet_group" "main" {
  name       = "claq-db-subnet-group-${var.environment}"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]
  tags       = { Name = "claq-db-subnet-group" }
}

resource "aws_security_group" "rds" {
  name        = "claq-rds-sg-${var.environment}"
  description = "Allow inbound PostgreSQL traffic from ECS cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "postgres" {
  identifier             = "claq-db-${var.environment}"
  allocated_storage      = 50
  max_allocated_storage  = 500
  engine                 = "postgres"
  engine_version         = "16.2"
  instance_class         = "db.t4g.medium"
  db_name                = "claq_fiscal_alert"
  username               = "claq_admin"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  multi_az               = true
  storage_encrypted      = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "claq-db-final-snapshot"

  tags = {
    Name = "CLAQ-RDS-Postgres"
  }
}
