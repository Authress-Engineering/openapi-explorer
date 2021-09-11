/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
export default {
  color: {
    inputReverseFg: '#fff',
    inputReverseBg: '#333',
    headerBg: '#444',
    getRgb(hexStr) {
      let hex = (hexStr || '').trim();
      if (hex.indexOf('#') === 0) {
        hex = hex.slice(1, 7);
      }
      // convert 3-digit hex to 6-digits.
      if (hex.length === 3 || hex.length === 4) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      if (hex.length !== 6) {
        // eslint-disable-next-line no-console
        console.error(`Invalid HEX color: '${hexStr}'`);
        return { r: 0, g: 0, b: 0 };
      }
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    },
    luminanace(hexColorCode) {
      const rgb = this.getRgb(hexColorCode);
      return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114);
    },
    invert(hexColorCode) {
      // compare with `>=128`, but giving little more preference to white over black
      return this.luminanace(hexColorCode) > 149 ? '#000000' : '#ffffff';
    },
    // https://stackoverflow.com/a/41491220/5091874
    selectTextColorFromBackground(bcHexColor) {
      const { r, g, b } = this.getRgb(bcHexColor);
      const colors = [r / 255, g / 255, b / 255];
      const c = colors.map((col) => {
        if (col <= 0.03928) {
          return col / 12.92;
        }
        return ((col + 0.055) / 1.055) ** 2.4;
      });
      const L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
      return (L > 0.179) ? '#000000' : '#FFFFFF';
    },
    opacity(hex, opacity) {
      const rgb = this.getRgb(hex);
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    },
    brightness(hex, amt) {
      const rgb = this.getRgb(hex);
      rgb.r += amt;
      rgb.g += amt;
      rgb.b += amt;
      if (rgb.r > 255) {rgb.r = 255;} else if (rgb.r < 0) {rgb.r = 0;}

      if (rgb.g > 255) {rgb.g = 255;} else if (rgb.g < 0) {rgb.g = 0;}

      if (rgb.b > 255) {rgb.b = 255;} else if (rgb.b < 0) {rgb.b = 0;}
      return `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
    },
  },
  isValidHexColor(colorCode) {
    return (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/i).test(colorCode);
  },
};
