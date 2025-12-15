export function getElementColorRGB(colorName: string): string {
  const colorMap: Record<string, string> = {
    'colorless': '#E0E0F0',
    'silvery-white': '#E8E8E8',
    'silvery': '#C0C0C0',
    'white': '#FFFFFF',
    'gray': '#808080',
    'black': '#202020',
    'red': '#FF0000',
    'blue': '#0080FF',
    'green': '#00FF00',
    'yellow': '#FFFF00',
    'yellow-green': '#A0FF40',
    'pale yellow': '#FFFFAA',
    'reddish-brown': '#A04020',
    'bluish-white': '#D0D0FF',
    'reddish': '#FF6060',
    'lustrous gray': '#909090',
    'lustrous silvery': '#B8B8B8',
    'lustrous white': '#F0F0F0',
    'dark gray': '#404040',
    'steel gray': '#606060',
    'grayish-white': '#C8C8C8',
    'metallic gray': '#888888',
    'silvery-gold': '#FFD700',
    'violet-black': '#4B0082',
    'metallic yellow': '#FFD700',
    'rust-red': '#B7410E',
    'gold': '#FFD700',
    'white-gray': '#D0D0D0',
    'bluish-silver': '#B0C4DE',
    'orange': '#FFA500',
    'unknown': '#666666'
  };

  return colorMap[colorName] || '#CCCCCC';
}
