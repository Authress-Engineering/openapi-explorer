import { css } from 'lit';

export default css`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Expand a block from 0 to something visible, then to probably full screen, then beyond most screens.
     Unlike with a transition, the final CSS can have an unbounded height, which will take effect after the animation. */
  @keyframes expand-height {
    0% { max-height: 0; }
    50% { max-height: 100px; }
    95% { max-height: 1000px; }
    100% { max-height: 5000px; }
  }
  /* Inverse of the above, collapsing quickly at first (to avoid a delay if the element is already quite short)
     then slowing towards 0. */
  @keyframes collapse-height {
    0% { max-height: 5000px; }
    5% { max-height: 500px; }
    50% { max-height: 100px; }
    100% { max-height: 0; }
  }
`;
