# Zone Z02208751YIW11CSJ50TS é a hosted zone efetivamente delegada no registrador
# para bruno-teixeira.com (confirmado via NS lookup). Existe uma segunda hosted zone
# com o mesmo nome na conta que NÃO está delegada — nunca usar aquela.
resource "aws_route53_record" "api" {
  zone_id = "Z02208751YIW11CSJ50TS"
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_instance.backend.public_ip]
}

# Validação DNS do certificado ACM do CloudFront (aws_acm_certificate.frontend, em cloudfront.tf)
resource "aws_route53_record" "frontend_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.frontend.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = "Z02208751YIW11CSJ50TS"
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 300
}

resource "aws_route53_record" "frontend" {
  zone_id = "Z02208751YIW11CSJ50TS"
  name    = var.frontend_domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}
