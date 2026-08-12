# PERGUNTAS E PREMISSAS

## PERGUNTAS

1 - O intervalo entre as ondas precisa ser curto, mas devemos deixar um tempo x configurado para que os usuários prioritários consigam ver a notificação e ter a possibilidade de pegar a vaga, se não pode chegar em membros não prioritários muito rapidamente. Ex: Onda 1 -> 10 min -> Onda 2 -> 20 min -> Onda 3. Desse modo garantimos que as pessoas com prioridade tem tempo para ver a notificação e preencher a vaga. Como a onda 2 é, em tese, maior que a Onda 1, aumentamos o backoff. Faz sentido isso ou a ideia seria funcionar de uma outra maneira?

2 - A lógica de favoritos não foi mencionada, hoje ela já funciona ou seria uma feature a desenvolvermos?

3 - "Vagas publicadas com menos de 24h de antecedência ("urgentes") têm taxa de preenchimento muito baixa". Isso me deixou em dúvida, as vagas urgentes são as com createdAt < 24h comparado ao tempo atual ou quem publica a vaga define algum campo type (enum URGENT, NO_URGENT), ou uma flag is_urgent. Na minha visão urgente define uma vaga que precisa ser preenchida rápida. Isso ficou meio em aberto. 

4 - Qual seria a doc do serviço externo de push de notifications? Quero ver se eles aceitam envio em lotes (batches) de notificações, iria diminuir um pouco a carga de abrir conexoes http e enviar as req.

5 - Quando uma vaga que esta em processo de dispatch for cancelada, devemos mandar um dispatch de cancelamento?

6 - Quando uma vaga que esta em processo de dispatch for editada, devemos mandar um dispatch de atualização?

7 - Se um usuário atender mais de um grupo da onda, colocamos ele no mais prioritário certo?

8 - Como o sistema lida com busca geoespacial?

9 - Uma leve consistência eventual é aceitável no contexto de aceitar uma vaga?

## PREMISSAS

1 - Assumir intervalo maior entre as ondas, 10 min e 20 min, dando tempo para os usuários prioritários preencherem a vaga.

Caso essa premissa estiver errada, basta reduzirmos o intervalo de sendAt registrado na tabela Waves. Para que isso funcione no tempo esperado, precisamos que as consultas no banco sejam extremamente rápidas, trabalhar com indexes nas tabelas FavoritesOperators e JobSubscriptions

2 - Assumo que não tem envio em batch no provedor de notifications, controlo o numero de req/s para não estourar a rota

3 - Envio dispatch de cancelamento apenas, evito atualização, várias atualizações podem spammar as notificações e bater o teto diário

4 - Colocar usuário no grupo mais prioritário da onda.

5 - Assumo que urgente é uma flag is_urgent, marcada pelo local.

6 - Assumo que uma consistência eventual é aceitável, considerando que existe a possibilidade de enviar e fazer pooling do status daquela solicitação, consultando o banco para saber se foi aceita ou rejeitada.

