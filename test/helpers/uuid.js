export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// UUID determinístico a partir de um número sequencial (ex: __VU), útil para
// identificar de antemão qual operador deve vencer uma disputa em testes de
// ordenação. Continua passando em @IsUUID() (nibble de versão "4", variante "8").
export function orderedUuid(n) {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
}
