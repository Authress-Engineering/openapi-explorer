import { html } from 'lit-element';
import ColorUtils from './color-utils';
/* Generates an schema object containing type and constraint info */

// TODO: possible drive theme from:
/*
  if (!this.theme || !'light, dark,'.includes(`${this.theme},`)) {
    this.theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }
*/

const defaultColors = [
  '--purple: #6f42c1',
  '--pink: #e83e8c',
  '--red: #dc3545',
  '--orange: #fd7e14',
  '--yellow: #ffc107',
  '--green: #28a745',
  '--white: #fff',
];

export default function setTheme(baseTheme, theme = {}, disableDefaultColors) {
  let newTheme = {};

  // Common Theme colors
  const primaryColor = theme.primaryColor ? theme.primaryColor : baseTheme === 'dark' ? '#f76b39' : '#ff591e';
  const primaryColorInvert = ColorUtils.color.invert(primaryColor);
  const primaryColorTrans = ColorUtils.color.opacity(primaryColor, '0.8');

  // Dark and Light Theme colors
  if (baseTheme === 'dark') {
    const bg1 = theme.bg1 ? theme.bg1 : '#333';
    const fg1 = theme.fg1 ? theme.fg1 : '#bbb';

    const bg2 = theme.bg2 ? theme.bg2 : ColorUtils.color.brightness(bg1, 5); // or #383838;
    const bg3 = theme.bg3 ? theme.bg3 : ColorUtils.color.brightness(bg1, 17); // or #444;
    const lightBg = theme.bg3 ? theme.bg3 : ColorUtils.color.brightness(bg1, 35);
    const fg2 = theme.fg2 ? theme.fg2 : ColorUtils.color.brightness(fg1, -15); // or #ababab
    const fg3 = theme.fg3 ? theme.fg3 : ColorUtils.color.brightness(fg1, -20); // or #aaa
    const lightFg = theme.fg3 ? theme.fg3 : ColorUtils.color.brightness(fg1, -65); // or #777
    const selectionBg = '#bbb';
    const selectionFg = '#eee';

    const headerColor = theme.headerColor ? theme.headerColor : ColorUtils.color.brightness(bg1, 10);

    const navBgColor = theme.navBgColor ? theme.navBgColor : ColorUtils.color.brightness(bg1, 10);
    const navTextColor = theme.navTextColor ? theme.navTextColor : ColorUtils.color.opacity(ColorUtils.color.invert(navBgColor), '0.65');
    const navHoverBgColor = theme.navHoverBgColor ? theme.navHoverBgColor : ColorUtils.color.brightness(navBgColor, -15);
    const navHoverTextColor = theme.navHoverTextColor ? theme.navHoverTextColor : ColorUtils.color.invert(navBgColor);
    const navAccentColor = theme.navAccentColor ? theme.navAccentColor : ColorUtils.color.brightness(primaryColor, 25);
    const overlayBg = 'rgba(80, 80, 80, 0.4)';

    newTheme = {
      bg1,
      bg2,
      bg3,
      lightBg,
      fg1,
      fg2,
      fg3,
      lightFg,
      primaryColor,
      primaryColorTrans,
      primaryColorInvert,
      selectionBg,
      selectionFg,
      overlayBg,
      navBgColor,
      navTextColor,
      navHoverBgColor,
      navHoverTextColor,
      navAccentColor,

      headerColor,
      headerColorInvert: ColorUtils.color.invert(headerColor),
      headerColorDarker: ColorUtils.color.brightness(headerColor, -20),
      headerColorBorder: ColorUtils.color.brightness(headerColor, 10),

      borderColor: theme.borderColor || ColorUtils.color.brightness(bg1, 20), // #555
      lightBorderColor: theme.lightBorderColor || ColorUtils.color.brightness(bg1, 15), // #444
      codeBorderColor: theme.codeBorderColor || ColorUtils.color.brightness(bg1, 30),

      inputBg: theme.inputBg || ColorUtils.color.brightness(bg1, -5), // #2f2f2f
      placeHolder: theme.placeHolder || ColorUtils.color.opacity(fg1, '0.3'),
      hoverColor: theme.hoverColor || ColorUtils.color.brightness(bg1, -10), // #2a2a2a

      codeBg: theme.codeBg || ColorUtils.color.opacity(ColorUtils.color.brightness(bg1, -15), 0.7),
      codeFg: theme.codeFg || '#aaa',
      codePropertyColor: theme.codePropertyColor || '#f8c555',
      codeKeywordColor: theme.codeKeywordColor || '#cc99cd',
      codeOperatorColor: theme.codeOperatorColor || '#67cdcc',
    };
  } else {
    const bg1 = (theme.bg1 ? theme.bg1 : '#ffffff');
    const fg1 = (theme.fg1 ? theme.fg1 : '#444444');
    const bg2 = theme.bg2 ? theme.bg2 : ColorUtils.color.brightness(bg1, -5); // or '#fafafa'
    const bg3 = theme.bg3 ? theme.bg3 : ColorUtils.color.brightness(bg1, -15); // or '#f6f6f6'
    const lightBg = theme.bg3 ? theme.bg3 : ColorUtils.color.brightness(bg1, -45);
    const fg2 = theme.fg2 ? theme.fg2 : ColorUtils.color.brightness(fg1, 17); // or '#555'
    const fg3 = theme.fg3 ? theme.fg3 : ColorUtils.color.brightness(fg1, 30); // or #666
    const lightFg = theme.fg3 ? theme.fg3 : ColorUtils.color.brightness(fg1, 70); // or #999
    const selectionBg = '#444';
    const selectionFg = '#eee';

    const headerColor = theme.headerColor ? theme.headerColor : ColorUtils.color.brightness(bg1, -180);
    const navBgColor = theme.navBgColor ? theme.navBgColor : ColorUtils.color.brightness(bg1, -180);
    const navTextColor = theme.navTextColor ? theme.navTextColor : ColorUtils.color.opacity(ColorUtils.color.invert(navBgColor), '0.65');
    const navHoverBgColor = theme.navHoverBgColor ? theme.navHoverBgColor : ColorUtils.color.brightness(navBgColor, -15);
    const navHoverTextColor = theme.navHoverTextColor ? theme.navHoverTextColor : ColorUtils.color.invert(navBgColor);
    const navAccentColor = theme.navAccentColor ? theme.navAccentColor : ColorUtils.color.brightness(primaryColor, 25);
    const overlayBg = 'rgba(0, 0, 0, 0.4)';

    newTheme = {
      bg1,
      bg2,
      bg3,
      lightBg,
      fg1,
      fg2,
      fg3,
      lightFg,
      primaryColor,
      primaryColorTrans,
      primaryColorInvert,
      selectionBg,
      selectionFg,
      overlayBg,
      navBgColor,
      navTextColor,
      navHoverBgColor,
      navHoverTextColor,
      navAccentColor,

      headerColor,
      headerColorInvert: ColorUtils.color.invert(headerColor),
      headerColorDarker: ColorUtils.color.brightness(headerColor, -20),
      headerColorBorder: ColorUtils.color.brightness(headerColor, 10),

      borderColor: theme.borderColor || ColorUtils.color.brightness(bg1, -38),
      lightBorderColor: theme.lightBorderColor || ColorUtils.color.brightness(bg1, -23),
      codeBorderColor: theme.codeBorderColor || 'transparent',

      codeBg: theme.codeBg ? theme.codeBg : '#454545',
      codeFg: theme.codeFg ? theme.codeFg : '#ccc',

      codeBg: theme.codeBg || ColorUtils.color.opacity(ColorUtils.color.brightness(bg1, -15), 0.7),
      codeFg: theme.codeFg || '#666',
      codePropertyColor: theme.codePropertyColor || '#905',
      codeKeywordColor: theme.codeKeywordColor || '#07a',
      codeOperatorColor: theme.codeOperatorColor || '#9a6e3a',
    };
  }
  return html`
  <style>
  *, *:before, *:after { box-sizing: border-box; }
  
  :host {
    /* Common Styles - irrespective of themes */  
    --border-radius: 2px;
    --layout: ${this.layout || 'column'};
    --nav-item-padding: ${this.navItemSpacing === 'relaxed' ? '10px' : (this.navItemSpacing === 'compact' ? '5px 10px' : '7px 10px')};
    --resp-area-height: ${this.responseAreaHeight};
    --font-size-small:  ${this.fontSize === 'default' ? '12px' : (this.fontSize === 'large' ? '13px' : '14px')};
    --font-size-mono:   ${this.fontSize === 'default' ? '13px' : (this.fontSize === 'large' ? '14px' : '15px')};
    --font-size-regular: ${this.fontSize === 'default' ? '14px' : (this.fontSize === 'large' ? '15px' : '16px')};
    --dialog-z-index: 1000;

    /* Theme specific styles */  
    --bg:${newTheme.bg1};
    --bg2:${newTheme.bg2};
    --bg3:${newTheme.bg3};
    --light-bg:${newTheme.lightBg};
    --fg:${newTheme.fg1};
    --fg2:${newTheme.fg2};
    --fg3:${newTheme.fg3};
    --light-fg:${newTheme.lightFg};
    --selection-bg:${newTheme.selectionBg};
    --selection-fg:${newTheme.selectionFg};
    --overlay-bg:${newTheme.overlayBg};
    
    /* Border Colors */
    --border-color:${newTheme.borderColor};
    --light-border-color:${newTheme.lightBorderColor};
    --code-border-color:${newTheme.codeBorderColor};

    --code-bg:${newTheme.codeBg};
    --code-fg:${newTheme.codeFg};
    --input-bg:${newTheme.inputBg};
    --placeholder-color:${newTheme.placeHolder};
    --hover-color:${newTheme.hoverColor};

    ${disableDefaultColors ? '' : defaultColors.join(';\n')}

    /* Header Color */
    --header-bg:${newTheme.headerColor};
    --header-fg:${newTheme.headerColorInvert};
    --header-color-darker:${newTheme.headerColorDarker};
    --header-color-border:${newTheme.headerColorBorder};

    /* Nav Colors */  
    --nav-bg-color:${newTheme.navBgColor};
    --nav-text-color:${newTheme.navTextColor};
    --nav-hover-bg-color:${newTheme.navHoverBgColor};
    --nav-hover-text-color:${newTheme.navHoverTextColor};

    /*Code Syntax Color*/
    --code-bg:${newTheme.codeBg};
    --code-fg:${newTheme.codeFg};
    --inline-code-fg:${newTheme.inlineCodeFg};
    --code-property-color:${newTheme.codePropertyColor};
    --code-keyword-color:${newTheme.codeKeywordColor};
    --code-operator-color:${newTheme.codeOperatorColor};

    /* Computed Color properties */
    --primary-color: ${theme.primaryColor};
    --secondary-color:${theme.secondaryColor};
    --primary-btn-text-color: ${ColorUtils.color.selectTextColorFromBackground(theme.primaryColor)};
  }
  </style>`;
}
