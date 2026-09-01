import { describe, it, expect } from 'vitest';
import { limparTexto, criarGeradorComSeed, embaralharComSeed } from '../utils/helpers';

describe('Helpers - limparTexto', () => {
  it('deve remover tags HTML do texto', () => {
    const input = '<p>Texto <strong>com tags</strong></p>';
    expect(limparTexto(input)).toBe('Texto com tags');
  });

  it('deve remover variáveis entre chaves duplas', () => {
    const input = 'Causa {{ damage }} de dano mágico.';
    expect(limparTexto(input)).toBe('Causa de dano mágico.');
  });

  it('deve remover espaços extras e fazer trim', () => {
    const input = '  Texto   com   espaços    ';
    expect(limparTexto(input)).toBe('Texto com espaços');
  });
});

describe('Helpers - criarGeradorComSeed & embaralharComSeed', () => {
  it('deve gerar sequências determinísticas para a mesma seed', () => {
    const gen1 = criarGeradorComSeed('Ahri');
    const gen2 = criarGeradorComSeed('Ahri');

    const v1 = [gen1(), gen1(), gen1()];
    const v2 = [gen2(), gen2(), gen2()];

    expect(v1).toEqual(v2);
  });

  it('deve embaralhar uma lista de forma determinística', () => {
    const lista = ['A', 'B', 'C', 'D', 'E'];
    const gen1 = criarGeradorComSeed('Zed');
    const gen2 = criarGeradorComSeed('Zed');

    const res1 = embaralharComSeed(lista, gen1);
    const res2 = embaralharComSeed(lista, gen2);

    expect(res1).toEqual(res2);
    expect(res1).not.toEqual(lista);
  });
});
