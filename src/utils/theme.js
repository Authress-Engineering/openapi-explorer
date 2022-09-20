import { html } from 'lit-element';
import color from 'color';
import ColorUtils from './color-utils';

/* Generates an schema object containing type and constraint info */

// TODO: possible drive theme from:
/*
  if (!this.theme || !'light, dark,'.includes(`${this.theme},`)) {
    this.theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }
*/

export default function setTheme(theme = {}) {
  const bg1 = (theme.bg1 ? theme.bg1 : '#ffffff');
  const fg1 = (theme.fg1 ? theme.fg1 : '#444444');
  const bg2 = theme.bg2 ? theme.bg2 : ColorUtils.color.brightness(bg1, -5); // or '#fafafa'
  const bg3 = theme.bg3 ? theme.bg3 : ColorUtils.color.brightness(bg1, -15); // or '#f6f6f6'
  const lightBg = theme.bg3 ? theme.bg3 : ColorUtils.color.brightness(bg1, -45);
  const fg2 = theme.fg2 ? theme.fg2 : ColorUtils.color.brightness(fg1, 17); // or '#555'
  const fg3 = theme.fg3 ? theme.fg3 : ColorUtils.color.brightness(fg1, 30); // or #666
  const lightFg = theme.fg3 ? theme.fg3 : ColorUtils.color.brightness(fg1, 70); // or #999
  const inlineCodeFg = theme.inlineCodeFg ? theme.inlineCodeFg : 'brown';

  const selectionBg = '#444';
  const selectionFg = '#eee';

  const headerColor = theme.headerColor ? theme.headerColor : ColorUtils.color.brightness(bg1, -180);
  const navBgColor = theme.navBgColor ? theme.navBgColor : ColorUtils.color.brightness(bg1, -180);
  const navTextColor = theme.navTextColor ? theme.navTextColor : ColorUtils.color.opacity(ColorUtils.color.invert(navBgColor), '0.65');
  const navHoverBgColor = theme.navHoverBgColor ? theme.navHoverBgColor : ColorUtils.color.brightness(navBgColor, -15);
  const navHoverTextColor = theme.navHoverTextColor ? theme.navHoverTextColor : ColorUtils.color.invert(navBgColor);
  const overlayBg = 'rgba(0, 0, 0, 0.4)';

  const defaultColors = [
    `--purple: ${getComputedStyle(this).getPropertyValue('--purple').trim() || '#6f42c1'}`,
    `--red: ${getComputedStyle(this).getPropertyValue('--red').trim() || '#dc3545'}`,
    `--orange: ${getComputedStyle(this).getPropertyValue('--orange').trim() || '#fd7e14'}`,
    `--yellow: ${getComputedStyle(this).getPropertyValue('--yellow').trim() || '#ffc107'}`,
    `--green: ${getComputedStyle(this).getPropertyValue('--green').trim() || '#28a745'}`,
    `--blue: ${getComputedStyle(this).getPropertyValue('--blue').trim() || '#38b3f9'}`,
    `--gray: ${getComputedStyle(this).getPropertyValue('--gray').trim() || '#465865'}`,

    '--pink: #e83e8c',
    '--white: #fff',
    '',
  ];

  const lightColors = [
    `--light-purple: ${color(getComputedStyle(this).getPropertyValue('--purple').trim() || '#6f42c1').lightness(96).hex()}`,
    `--light-red: ${color(getComputedStyle(this).getPropertyValue('--red').trim() || '#dc3545').lightness(96).hex()}`,
    `--light-orange: ${color(getComputedStyle(this).getPropertyValue('--orange').trim() || '#fd7e14').lightness(96).hex()}`,
    `--light-yellow: ${color(getComputedStyle(this).getPropertyValue('--yellow').trim() || '#ffc107').lightness(96).hex()}`,
    `--light-green: ${color(getComputedStyle(this).getPropertyValue('--green').trim() || '#28a745').lightness(96).hex()}`,
    `--light-blue: ${color(getComputedStyle(this).getPropertyValue('--blue').trim() || '#38b3f9').lightness(96).hex()}`,
    `--light-gray: ${color(getComputedStyle(this).getPropertyValue('--gray').trim() || '#465865').lightness(96).hex()}`,
    '',
  ];

  const newTheme = {
    bg1,
    bg2,
    bg3,
    lightBg,
    fg1,
    fg2,
    fg3,
    lightFg,
    inlineCodeFg,
    selectionBg,
    selectionFg,
    overlayBg,
    navBgColor,
    navTextColor,
    navHoverBgColor,
    navHoverTextColor,

    headerColor,
    headerColorInvert: ColorUtils.color.invert(headerColor),
    headerColorDarker: ColorUtils.color.brightness(headerColor, -20),
    headerColorBorder: ColorUtils.color.brightness(headerColor, 10),

    borderColor: theme.borderColor || ColorUtils.color.brightness(bg1, -38),
    lightBorderColor: theme.lightBorderColor || ColorUtils.color.brightness(bg1, -23),
    codeBorderColor: theme.codeBorderColor || 'transparent',

    inputBg: theme.inputBg || ColorUtils.color.brightness(bg1, 10), // #fff
    placeHolder: theme.placeHolder || ColorUtils.color.brightness(lightFg, 20), // #dedede
    hoverColor: theme.hoverColor || ColorUtils.color.brightness(bg1, -5), // # f1f1f1

    codeBg: theme.codeBg || ColorUtils.color.opacity(ColorUtils.color.brightness(bg1, -15), 0.7),
    codeFg: theme.codeFg || '#666',
    codePropertyColor: theme.codePropertyColor || '#905',
    codeKeywordColor: theme.codeKeywordColor || '#07a',
    codeOperatorColor: theme.codeOperatorColor || '#9a6e3a',
  };

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

    --input-bg:${newTheme.inputBg};
    --placeholder-color:${newTheme.placeHolder};
    --hover-color:${newTheme.hoverColor};

    ${defaultColors.join(';\n')}
    
    ${lightColors.join(';\n')}

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
