const aiTextChunks = [
  { text: 'ATF1 bottleneck is epigenetic silencing: closed chromatin, high nucleosomes, depleted active marks, compartment B localization', isBullet: false },
  { text: 'Upstream pathway genes show 69-93% accessibility while ATF1 has 6% — differential chromatin states within same pathway', isBullet: true },
  { text: 'ATF1 lacks enhancer loops and shows 3.2x nucleosome density with 0.4-0.6x active histone marks — coordinated repression', isBullet: true },
  { text: 'B compartment localization (-0.42 PC1) places ATF1 in heterochromatin-like environment despite pathway activity', isBullet: true },
];

const aiInsights = [
  { icon: '🔒', label: 'Chromatin Lock', value: 'ATF1 promoter is chromatinized' },
  { icon: '⚖️', label: 'Pathway Imbalance', value: '15x expression gap vs upstream' },
  { icon: '🎯', label: 'CRISPRa Target', value: 'Closed but reversible state' },
];

const aiActions = [
  { action: 'Deploy dCas9-VPR CRISPRa targeting ATF1 promoter region to recruit transcriptional machinery and chromatin remodeling activity', because: '6% accessibility and 3.2x nucleosome density indicate reversible chromatin silencing that CRISPRa can overcome by forced recruitment of activating complexes' },
];

