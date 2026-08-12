
---

### 2026-08-12 20:05:21

tive uma ideia de como fazer o dispatch de waves, pensei em criar uma fila de gerenciamento de offset para consumir os waves, levantar os usuarios e publicar cada um em uma outra fila de notifications, pro notification provider enviar as notificacoes separadamente


---

### 2026-08-12 20:05:46

tive uma ideia de como fazer o dispatch de waves, pensei em criar uma fila de gerenciamento de offset para consumir os waves, levantar os usuarios e publicar cada um em uma outra fila de notifications, pro notification provider enviar as notificacoes separadamente, o que acha dessa solucao


---

### 2026-08-12 20:36:22

avalie o docs/architechture.png


---

### 2026-08-12 20:39:47

  5. Thundering herd no cron de 1 min: se várias ondas vencerem no mesmo tick, todo o "levanta operadores + fan-out" acontece
  de uma vez. Pode ser aceitável na escala do teste, mas vale citar como trade-off consciente. me explique melhor sobre esse risco?


---

### 2026-08-12 20:44:24

criar uma fila de processamento de waves faz sentido? dessa forma garantimos uma consistencia eventual no tempo de envio das notificacoes mas nao fazemos memory bound e cpu bound no banco

