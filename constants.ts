import { TreeNodeData } from './types';

export const INITIAL_TREE_DATA: TreeNodeData = {
  id: 'root',
  name: 'Manual Estratégico: Canal de Simulação de Sobrevivência Imersiva',
  type: 'root',
  children: [
    {
      id: 'nicho',
      name: 'Definição de Nicho',
      type: 'category',
      children: [
        { id: 'n1', name: 'Nicho: Immersive Survival Simulation', type: 'item' },
        { id: 'n2', name: 'Subnicho: First-Person Human Survival in Hostile Past Worlds', type: 'item' },
        { id: 'n3', name: 'Diferencial: Vivência simulada plausível', type: 'item' },
      ],
    },
    {
      id: 'identidade',
      name: 'Identidade da Marca',
      type: 'category',
      children: [
        { id: 'i1', name: 'Posicionamento: Máquina de teste de sobrevivência humana', type: 'item' },
        { id: 'i2', name: 'Nome Sugerido: Out of Time', type: 'item' },
        { id: 'i3', name: 'Slogan: Testing human survival beyond our time', type: 'item' },
      ],
    },
    {
      id: 'diretrizes',
      name: 'Diretrizes de Conteúdo',
      type: 'category',
      children: [
        { id: 'd1', name: 'Regras: Narrativa imersiva, tom sério, sem humor', type: 'item' },
        { id: 'd2', name: 'Persona: Narrador observador neutro (máquina do tempo)', type: 'item' },
        { id: 'd3', name: 'Jargões: Frases recorrentes sobre limites biológicos', type: 'item' },
      ],
    },
    {
      id: 'estrutura',
      name: 'Estrutura do Vídeo',
      type: 'category',
      children: [
        { id: 'e1', name: 'Lógica Interna: Inserção, ameaça, adaptação e veredito', type: 'item' },
        { id: 'e2', name: 'Roteiro: Blocos de 900-1100 caracteres', type: 'item' },
        { id: 'e3', name: 'Duração: Aproximadamente 12 minutos', type: 'item' },
      ],
    },
    {
      id: 'politicas',
      name: 'Políticas e Segurança',
      type: 'category',
      children: [
        { id: 'p1', name: 'Safe for Ads: Evitar gore e violência gráfica', type: 'item' },
        { id: 'p2', name: 'Narrativa: Descrever limites em vez de mortes explícitas', type: 'item' },
      ],
    },
    {
      id: 'prompts',
      name: 'Prompts de Produção',
      type: 'category',
      children: [
        { id: 'pr1', name: 'Roteiro: Estilo documental cinematográfico', type: 'item' },
        { id: 'pr2', name: 'Imagens: Ultra-realistas, perspectiva humana, 16:9', type: 'item' },
        { id: 'pr3', name: 'Vídeo: Movimentos lentos e foco na atmosfera', type: 'item' },
      ],
    },
  ],
};